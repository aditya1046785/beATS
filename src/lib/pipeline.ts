import "server-only";
import { embedText } from "./embeddings";
import { RateLimitError, fetchAllRepos, fetchLanguages, fetchPinnedRepoNames, fetchRepoFile } from "./github";
import { summarizeRepository } from "./ai";
import { getUserRepositories, updateData, upsertUserRepositories } from "./store";
import { RepositoryRecord, UserProfile } from "./types";

function summaryText(repo: RepositoryRecord) {
  return [
    repo.aiSummary.one_liner,
    repo.aiSummary.what_it_does,
    repo.aiSummary.tech_skills.languages.join(", "),
    repo.aiSummary.tech_skills.frameworks.join(", "),
    repo.aiSummary.tech_skills.tools.join(", "),
    repo.aiSummary.tech_skills.concepts.join(", "),
    repo.aiSummary.notable_implementations.join(", "),
    repo.aiSummary.relevant_roles.join(", "),
  ].join(". ");
}

async function setProgress(userId: string, stage: string, progress: number, error = "") {
  await updateData((data) => {
    const user = data.users.find((item) => item.id === userId);
    if (!user) return;
    user.githubProcessing = true;
    user.githubProcessingStage = stage;
    user.githubProcessingProgress = progress;
    user.githubProcessingError = error;
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

export async function processGithubForUser(user: UserProfile) {
  const nextRepositories: RepositoryRecord[] = [];
  const existingRepositories = await getUserRepositories(user.id);
  const existingByName = new Map(existingRepositories.map((repo) => [repo.githubRepoName, repo]));

  try {
    await setProgress(user.id, "Fetching your repositories...", 10);
    const [repos, pinnedNames] = await Promise.all([
      fetchAllRepos(user.githubAccessToken),
      fetchPinnedRepoNames(user.githubAccessToken, user.githubUsername),
    ]);
    const validRepos = repos.filter((repo) => !repo.fork && repo.name !== user.githubUsername);

    // Prepare list of repos that require processing (new or updated)
    const toProcess: { repo: any; existing?: RepositoryRecord }[] = [];
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

    const batchSize = 8; // between 8-10 as required
    function sleep(ms: number) {
      return new Promise((res) => setTimeout(res, ms));
    }

    for (let i = 0; i < toProcess.length; i += batchSize) {
      const batch = toProcess.slice(i, i + batchSize);
      await setProgress(user.id, `Analyzing your projects with AI... (${completed} of ${total} complete)`, 45);

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
            await setProgress(user.id, `Analyzing your projects... (${completed} of ${total} complete)`, 45 + Math.floor((completed / total) * 40));
            return;
          }

          // Start AI summarization
          const aiSummary = await summarizeRepository({
            name: repo.name,
            description: repo.description || "",
            topics,
            languageBreakdown: files.languages,
            readme: files.readme,
            dependencies: [files.packageJson, files.requirements, files.pom, files.gradle].filter(Boolean).join("\n\n"),
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
            const vec = await embedText(summaryText(record));
            record.vectorEmbedding = vec;
          } catch (embedErr) {
            console.error("Embedding failed for repo", repo.name, embedErr);
            record.vectorEmbedding = [];
          }

          nextRepositories.push(record);
          completed += 1;
          await setProgress(user.id, `Analyzing your projects... (${completed} of ${total} complete)`, 45 + Math.floor((completed / total) * 40));
        } catch (err) {
          // If it's a rate limit error, rethrow to be handled by outer catch
          if (err instanceof RateLimitError) throw err;
          console.error("Repository processing failed, skipping:", repo.name, err);
          // Continue without adding this repo
          completed += 1;
          await setProgress(user.id, `Analyzing your projects... (${completed} of ${total} complete)`, 45 + Math.floor((completed / total) * 40));
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
    }

    await setProgress(user.id, "Finishing up...", 90);
    await upsertUserRepositories(user.id, nextRepositories);
    await updateData((data) => {
      const current = data.users.find((item) => item.id === user.id);
      if (!current) return;
      current.githubProcessed = true;
      current.githubProcessing = false;
      current.githubProcessingStage = "Done! Taking you to your dashboard...";
      current.githubProcessingProgress = 100;
      current.lastGithubSyncAt = new Date().toISOString();
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      await upsertUserRepositories(user.id, nextRepositories);
      await updateData((data) => {
        const current = data.users.find((item) => item.id === user.id);
        if (!current) return;
        current.githubProcessed = false;
        current.githubProcessing = true;
        current.githubProcessingStage = "GitHub rate limit reached. We'll resume shortly.";
        current.githubProcessingProgress = Math.max(current.githubProcessingProgress || 0, 40);
        current.githubProcessingError = userFacingError(error);
      });
      return;
    }

    await upsertUserRepositories(user.id, nextRepositories);
    await updateData((data) => {
      const current = data.users.find((item) => item.id === user.id);
      if (!current) return;
      current.githubProcessing = false;
      current.githubProcessingProgress = Math.max(current.githubProcessingProgress || 0, 45);
      current.githubProcessingError = userFacingError(error);
    });
  }
}
