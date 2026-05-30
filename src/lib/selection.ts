import "server-only";
import { cosineSimilarity } from "./embeddings";
import { RepositoryRecord } from "./types";

export function selectRelevantRepos(repos: RepositoryRecord[], jdEmbedding: number[]) {
  const ranked = repos
    .map((repo) => ({ repo, score: cosineSimilarity(repo.vectorEmbedding, jdEmbedding) }))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.repo);

  const selected = ranked.slice(0, 4);
  const pinned = ranked.filter((repo) => repo.isPinned);
  for (const repo of pinned) {
    if (selected.some((item) => item.id === repo.id)) continue;
    if (selected.length < 4) selected.push(repo);
    else selected[selected.length - 1] = repo;
  }
  return selected.slice(0, 4);
}
