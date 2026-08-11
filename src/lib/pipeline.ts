import "server-only";
import { embedText } from "./embeddings";
import { RateLimitError, fetchAllRepos, fetchLanguages, fetchPinnedRepoNames, fetchRepoFile, type GitHubRepo } from "./github";
import { summarizeRepository } from "./ai";
import { getUserRepositories, updateData, upsertUserRepositories } from "./store";
import { RepositoryRecord, UserProfile } from "./types";

function summaryText(repo: RepositoryRecord) {
  return [
    repo.aiSummary.one_liner,
    repo.aiSummary.what_it_does,
    repo.aiSummary.impact_or_scale,
    repo.aiSummary.tech_skills.languages.join(", "),
    repo.aiSummary.tech_skills.frameworks.join(", "),
    repo.aiSummary.tech_skills.tools.join(", "),
    repo.aiSummary.tech_skills.concepts.join(", "),
    repo.aiSummary.notable_implementations.join(", "),
    repo.aiSummary.relevant_roles.join(", "),
  ]
    .filter(Boolean)
    .join(". ");
}

async function setProgress(
  userId: string,
  stage: string,
  progress: number,
  error = "",
  extra: Partial<Pick<UserProfile, "githubProcessingCurrentRepo" | "githubProcessingCompleted" | "githubProcessingTotal" | "githubProcessingRepos">> = {},
) {
  await updateData((data) => {
    const user = data.users.find((item) => item.id === userId);
    if (!user) return;
    user.githubProcessing = true;
    user.githubProcessingStage = stage;
    user.githubProcessingProgress = progress;
    user.githubProcessingError = error;
    if (extra.githubProcessingCurrentRepo !== undefined) user.githubProcessingCurrentRepo = extra.githubProcessingCurrentRepo;
    if (extra.githubProcessingCompleted !== undefined) user.githubProcessingCompleted = extra.githubProcessingCompleted;
    if (extra.githubProcessingTotal !== undefined) user.githubProcessingTotal = extra.githubProcessingTotal;
    if (extra.githubProcessingRepos !== undefined) user.githubProcessingRepos = extra.githubProcessingRepos;
  });
}

function userFacingError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (error instanceof RateLimitError) {
    return "GitHub rate limit hit. We paused processing and will resume shortly.";
  }
  if (message.includes("OPENROUTER_API_KEY") || message.includes("ANTHROPIC_API_KEY")) {
    return "AI service key is not configured correctly. Add OPENROUTER_API_KEY in .env.local and restart the server.";
  }
  if (message.includes("OpenRouter request failed")) {
    return "AI analysis request failed. Please check your OpenRouter key and try again.";
  }
  if (message.includes("Sentence Transformers")) {
    return "Local embedding model is not ready. Install sentence-transformers on the server and try again.";
  }
  return "Processing failed. Please try syncing again.";
}

// Prevents overlapping pipeline runs for the same user (e.g. double-clicking
// "Try Again" or resubmitting onboarding). In-process only: on process restart
// the set is empty, so a stale DB flag is not mistaken for an active run.
const activeProcessing = new Set<string>();

export function isProcessing(userId: string) {
  return activeProcessing.has(userId);
}

export async function processGithubForUser(user: UserProfile) {
  if (activeProcessing.has(user.id)) {
    console.warn("[pipeline] duplicate run skipped (already processing)", { user: user.githubUsername });
    return;
  }
  activeProcessing.add(user.id);
  try {
    await runGithubPipeline(user);
  } finally {
    activeProcessing.delete(user.id);
  }
}

async function runGithubPipeline(user: UserProfile) {
  const nextRepositories: RepositoryRecord[] = [];
  const existingRepositories = await getUserRepositories(user.id);
  const existingByName = new Map(existingRepositories.map((repo) => [repo.githubRepoName, repo]));
  let repoSnapshot: Array<{
    name: string;
    description: string;
    language: string;
    stars: number;
    pinned: boolean;
    updatedAt: string;
  }> = [];

  console.info("[pipeline] processGithubForUser started", { user: user.githubUsername });

  try {
    await setProgress(user.id, "Fetching your repositories...", 10);
    const [repos, pinnedNames] = await Promise.all([
      fetchAllRepos(user.githubAccessToken),
      fetchPinnedRepoNames(user.githubAccessToken, user.githubUsername),
    ]);
    const validRepos = repos.filter((repo) => !repo.fork && repo.name !== user.githubUsername);
    repoSnapshot = validRepos.slice(0, 8).map((repo) => ({
      name: repo.name,
      description: repo.description || "",
      language: repo.language || "",
      stars: repo.stargazers_count,
      pinned: pinnedNames.has(repo.name),
      updatedAt: repo.updated_at,
    }));

    await setProgress(
      user.id,
      `Found ${validRepos.length} repositories on GitHub`,
      20,
      "",
      {
        githubProcessingCurrentRepo: repoSnapshot[0]?.name || "",
        githubProcessingCompleted: 0,
        githubProcessingTotal: validRepos.length,
        githubProcessingRepos: repoSnapshot,
      },
    );

    // Prepare list of repos that require processing (new or updated)
    const toProcess: { repo: GitHubRepo; existing?: RepositoryRecord }[] = [];
    for (const repo of validRepos) {
      const existing = existingByName.get(repo.name);
      const isUnchanged = existing && existing.githubUpdatedAt === repo.updated_at;
      if (isUnchanged) {
        nextRepositories.push({ ...existing, isPinned: pinnedNames.has(repo.name) });
        continue;
      }
      toProcess.push({ repo, existing });
    }

    const total = validRepos.length;
    let completed = 0;

    console.info("[pipeline] phase: github sync", {
      totalRepos: validRepos.length,
      toProcess: toProcess.length,
      skippedUnchanged: validRepos.length - toProcess.length,
      snapshot: repoSnapshot.map((r) => r.name),
    });

    const batchSize = 8; // between 8-10 as required
    function sleep(ms: number) {
      return new Promise((res) => setTimeout(res, ms));
    }

    for (let i = 0; i < toProcess.length; i += batchSize) {
      const batch = toProcess.slice(i, i + batchSize);
      await setProgress(
        user.id,
        `Analyzing your projects with AI... (${completed} of ${total} complete)`,
        45,
        "",
        {
          githubProcessingCurrentRepo: batch[0]?.repo.name || repoSnapshot[0]?.name || "",
          githubProcessingCompleted: completed,
          githubProcessingTotal: total,
          githubProcessingRepos: repoSnapshot,
        },
      );

      const batchStartedAt = Date.now();
      console.info("[pipeline] phase: batch start", {
        batchIndex: Math.floor(i / batchSize) + 1,
        batchSize: batch.length,
        repos: batch.map((b) => b.repo.name),
      });

      // Start fetching files for all repos in the batch in parallel
      const fileFetchPromises = batch.map(async ({ repo }) => {
        const [readme, packageJson, requirements, pom, gradle, languages] = await Promise.all([
          fetchRepoFile(user.githubAccessToken, user.githubUsername, repo.name, "README.md"),
          fetchRepoFile(user.githubAccessToken, user.githubUsername, repo.name, "package.json"),
          fetchRepoFile(user.githubAccessToken, user.githubUsername, repo.name, "requirements.txt"),
          fetchRepoFile(user.githubAccessToken, user.githubUsername, repo.name, "pom.xml"),
          fetchRepoFile(user.githubAccessToken, user.githubUsername, repo.name, "build.gradle"),
          fetchLanguages(user.githubAccessToken, user.githubUsername, repo.name),
        ]);
        return { repo, readme, packageJson, requirements, pom, gradle, languages };
      });

      // For each repo in batch, kick off AI summarization as soon as files are available
      const processingPromises = batch.map(async ({ repo, existing }, idx) => {
        try {
          const files = await fileFetchPromises[idx];
          const topics = repo.topics || [];
          if (!repo.description && topics.length === 0 && !files.readme) {
            // Nothing to analyze; skip
            nextRepositories.push({
              id: crypto.randomUUID(),
              userId: user.id,
              githubRepoName: repo.name,
              githubRepoUrl: repo.html_url,
              shortDescription: repo.description || "",
              primaryLanguage: repo.language || Object.keys(files.languages)[0] || "",
              languageBreakdown: files.languages,
              topics,
              homepageUrl: repo.homepage || "",
              isPinned: pinnedNames.has(repo.name),
              stars: repo.stargazers_count,
              aiSummary: existing?.aiSummary || {
                one_liner: repo.description || "",
                tech_skills: { languages: [], frameworks: [], tools: [], concepts: [] },
                what_it_does: repo.description || "",
                notable_implementations: [],
                impact_or_scale: null,
                relevant_roles: [],
              },
              vectorEmbedding: [],
              githubUpdatedAt: repo.updated_at,
              lastSyncedAt: new Date().toISOString(),
            });
            completed += 1;
            await setProgress(
              user.id,
              `Analyzing your projects... (${completed} of ${total} complete)`,
              45 + Math.floor((completed / total) * 40),
              "",
              {
                githubProcessingCurrentRepo: repo.name,
                githubProcessingCompleted: completed,
                githubProcessingTotal: total,
                githubProcessingRepos: repoSnapshot,
              },
            );
            return;
          }

          const repoStartedAt = Date.now();
          console.info(`[pipeline] ${repo.name}: files fetched`, {
            hasReadme: Boolean(files.readme),
            languages: Object.keys(files.languages),
            phase: "github-fetch",
          });

          // Start AI summarization
          console.info(`[pipeline] ${repo.name}: phase=openrouter summarize, starting`);
          const aiSummary = await summarizeRepository({
            name: repo.name,
            description: repo.description || "",
            topics,
            languageBreakdown: files.languages,
            readme: files.readme,
            dependencies: [files.packageJson, files.requirements, files.pom, files.gradle].filter(Boolean).join("\n\n"),
          });
          console.info(`[pipeline] ${repo.name}: phase=openrouter summarize, done`, {
            elapsedMs: Date.now() - repoStartedAt,
          });

          // Immediately start embedding in parallel with other AI calls
          const record: RepositoryRecord = {
            id: crypto.randomUUID(),
            userId: user.id,
            githubRepoName: repo.name,
            githubRepoUrl: repo.html_url,
            shortDescription: repo.description || aiSummary.one_liner,
            primaryLanguage: repo.language || Object.keys(files.languages)[0] || "",
            languageBreakdown: files.languages,
            topics,
            homepageUrl: repo.homepage || "",
            isPinned: pinnedNames.has(repo.name),
            stars: repo.stargazers_count,
            aiSummary,
            vectorEmbedding: [],
            githubUpdatedAt: repo.updated_at,
            lastSyncedAt: new Date().toISOString(),
          };

          try {
            console.info(`[pipeline] ${repo.name}: phase=gemini embedding, starting`, {
              textLength: summaryText(record).length,
            });
            const vec = await embedText(summaryText(record));
            record.vectorEmbedding = vec;
            console.info(`[pipeline] ${repo.name}: phase=gemini embedding, done`, {
              dimensions: vec.length,
              elapsedMs: Date.now() - repoStartedAt,
            });
          } catch (embedErr) {
            console.error(`[pipeline] ${repo.name}: embedding failed, storing empty vector`, embedErr);
            record.vectorEmbedding = [];
          }

          nextRepositories.push(record);
          completed += 1;
          console.info(`[pipeline] ${repo.name}: done (${completed}/${total})`, {
            elapsedMs: Date.now() - repoStartedAt,
          });
          await setProgress(
            user.id,
            `Analyzing your projects... (${completed} of ${total} complete)`,
            45 + Math.floor((completed / total) * 40),
            "",
            {
              githubProcessingCurrentRepo: repo.name,
              githubProcessingCompleted: completed,
              githubProcessingTotal: total,
              githubProcessingRepos: repoSnapshot,
            },
          );
        } catch (err) {
          // If it's a rate limit error, rethrow to be handled by outer catch
          if (err instanceof RateLimitError) throw err;
          console.error("Repository processing failed, skipping:", repo.name, err);
          // Continue without adding this repo
          completed += 1;
          await setProgress(
            user.id,
            `Analyzing your projects... (${completed} of ${total} complete)`,
            45 + Math.floor((completed / total) * 40),
            "",
            {
              githubProcessingCurrentRepo: repo.name,
              githubProcessingCompleted: completed,
              githubProcessingTotal: total,
              githubProcessingRepos: repoSnapshot,
            },
          );
          return;
        }
      });

      const results = await Promise.allSettled(processingPromises);
      // If any promise failed with RateLimitError, abort and let outer catch handle it
      for (const res of results) {
        if (res.status === "rejected") {
          const reason = res.reason as unknown;
          if (reason instanceof RateLimitError) throw reason;
        }
      }

      // Wait 1 second between batches to avoid hitting Anthropic / OpenRouter limits
      await sleep(1000);
      console.info("[pipeline] phase: batch finished", {
        batchIndex: Math.floor(i / batchSize) + 1,
        completed,
        total,
        elapsedMs: Date.now() - batchStartedAt,
      });
    }

    console.info("[pipeline] phase: all batches done", { completed, total });
    await setProgress(user.id, "Finishing up...", 90);
    await upsertUserRepositories(user.id, nextRepositories);
    await updateData((data) => {
      const current = data.users.find((item) => item.id === user.id);
      if (!current) return;
      current.githubProcessed = true;
      current.githubProcessing = false;
      current.githubProcessingError = "";
      current.githubProcessingStage = "Done! Taking you to your dashboard...";
      current.githubProcessingProgress = 100;
      current.githubProcessingCurrentRepo = repoSnapshot[repoSnapshot.length - 1]?.name || repoSnapshot[0]?.name || "";
      current.githubProcessingCompleted = total;
      current.githubProcessingTotal = total;
      current.githubProcessingRepos = repoSnapshot;
      current.lastGithubSyncAt = new Date().toISOString();
    });
    console.info("[pipeline] processGithubForUser completed successfully", {
      user: user.githubUsername,
      reposProcessed: nextRepositories.length,
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      try {
        await upsertUserRepositories(user.id, nextRepositories);
      } catch (saveError) {
        console.error("[pipeline] failed to persist partial repos (rate limit path)", saveError);
      }
      await updateData((data) => {
        const current = data.users.find((item) => item.id === user.id);
        if (!current) return;
        current.githubProcessed = false;
        current.githubProcessing = true;
        current.githubProcessingStage = "GitHub rate limit reached. We'll resume shortly.";
        current.githubProcessingProgress = Math.max(current.githubProcessingProgress || 0, 40);
        current.githubProcessingCurrentRepo = current.githubProcessingCurrentRepo || repoSnapshot[0]?.name || "";
        current.githubProcessingCompleted = current.githubProcessingCompleted || 0;
        current.githubProcessingTotal = current.githubProcessingTotal || repoSnapshot.length || 0;
        current.githubProcessingRepos = current.githubProcessingRepos || repoSnapshot;
        current.githubProcessingError = userFacingError(error);
      });
      return;
    }

    try {
      await upsertUserRepositories(user.id, nextRepositories);
    } catch (saveError) {
      console.error("[pipeline] failed to persist partial repos after error; clearing processing state anyway", saveError);
    }
    await updateData((data) => {
      const current = data.users.find((item) => item.id === user.id);
      if (!current) return;
      current.githubProcessing = false;
      current.githubProcessingProgress = Math.max(current.githubProcessingProgress || 0, 45);
      current.githubProcessingCurrentRepo = current.githubProcessingCurrentRepo || repoSnapshot[0]?.name || "";
      current.githubProcessingCompleted = current.githubProcessingCompleted || 0;
      current.githubProcessingTotal = current.githubProcessingTotal || repoSnapshot.length || 0;
      current.githubProcessingRepos = current.githubProcessingRepos || repoSnapshot;
      current.githubProcessingError = userFacingError(error);
    });
    console.error("[pipeline] processGithubForUser FAILED", {
      user: user.githubUsername,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
