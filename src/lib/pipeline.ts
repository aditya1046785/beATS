import "server-only";
import { embedText } from "./embeddings";
import { fetchAllRepos, fetchLanguages, fetchPinnedRepoNames, fetchRepoFile } from "./github";
import { summarizeRepository } from "./ai";
import { replaceUserRepositories, updateData } from "./store";
import { RepositoryRecord, UserProfile } from "./types";

function summaryText(repo: RepositoryRecord) {
  return [
    repo.aiSummary.explanation,
    repo.aiSummary.problem,
    repo.aiSummary.skills.join(", "),
    repo.aiSummary.implementations.join(", "),
    repo.aiSummary.relevantRoles.join(", "),
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

export async function processGithubForUser(user: UserProfile) {
  try {
    await setProgress(user.id, "Fetching your repositories...", 10);
    const [repos, pinnedNames] = await Promise.all([
      fetchAllRepos(user.githubAccessToken),
      fetchPinnedRepoNames(user.githubAccessToken, user.githubUsername),
    ]);
    const validRepos = repos.filter((repo) => !repo.fork);
    const processed: RepositoryRecord[] = [];

    for (let index = 0; index < validRepos.length; index += 1) {
      const repo = validRepos[index];
      await setProgress(user.id, `Reading your project files... (${index + 1} of ${validRepos.length})`, 20);
      const [readme, packageJson, requirements, pom, gradle, languages] = await Promise.all([
        fetchRepoFile(user.githubAccessToken, user.githubUsername, repo.name, "README.md"),
        fetchRepoFile(user.githubAccessToken, user.githubUsername, repo.name, "package.json"),
        fetchRepoFile(user.githubAccessToken, user.githubUsername, repo.name, "requirements.txt"),
        fetchRepoFile(user.githubAccessToken, user.githubUsername, repo.name, "pom.xml"),
        fetchRepoFile(user.githubAccessToken, user.githubUsername, repo.name, "build.gradle"),
        fetchLanguages(user.githubAccessToken, user.githubUsername, repo.name),
      ]);

      const topics = repo.topics || [];
      if (!repo.description && topics.length === 0 && !readme) continue;

      await setProgress(user.id, `Analyzing your projects with AI... (${index + 1} of ${validRepos.length} done)`, 45);
      const aiSummary = await summarizeRepository({
        name: repo.name,
        description: repo.description || "",
        topics,
        languageBreakdown: languages,
        readme,
        dependencies: [packageJson, requirements, pom, gradle].filter(Boolean).join("\n\n"),
      });

      const record: RepositoryRecord = {
        id: crypto.randomUUID(),
        userId: user.id,
        githubRepoName: repo.name,
        githubRepoUrl: repo.html_url,
        shortDescription: repo.description || aiSummary.explanation,
        primaryLanguage: repo.language || Object.keys(languages)[0] || "",
        languageBreakdown: languages,
        topics,
        homepageUrl: repo.homepage || "",
        isPinned: pinnedNames.has(repo.name),
        stars: repo.stargazers_count,
        aiSummary,
        vectorEmbedding: [],
        githubUpdatedAt: repo.updated_at,
        lastSyncedAt: new Date().toISOString(),
      };
      record.vectorEmbedding = await embedText(summaryText(record));
      processed.push(record);
    }

    await setProgress(user.id, "Finishing up...", 90);
    await replaceUserRepositories(user.id, processed);
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
    await updateData((data) => {
      const current = data.users.find((item) => item.id === user.id);
      if (!current) return;
      current.githubProcessing = false;
      current.githubProcessingProgress = Math.max(current.githubProcessingProgress || 0, 45);
      current.githubProcessingError = error instanceof Error ? error.message : "Processing failed";
    });
  }
}
