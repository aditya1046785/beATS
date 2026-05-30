import "server-only";
import { cosineSimilarity } from "./embeddings";
import { RepositoryRecord } from "./types";

export const PINNED_BOOST = 0.08;

export function selectRelevantRepos(repos: RepositoryRecord[], jdEmbedding: number[]) {
  const ranked = repos
    .map((repo) => {
      const baseScore = cosineSimilarity(repo.vectorEmbedding, jdEmbedding);
      const adjustedScore = repo.isPinned ? baseScore + PINNED_BOOST : baseScore;
      return { repo, baseScore, adjustedScore };
    })
    .sort((a, b) => b.adjustedScore - a.adjustedScore);

  return ranked.slice(0, 4).map((item) => item.repo);
}
