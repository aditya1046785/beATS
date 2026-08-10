import "server-only";
import { cosineSimilarity } from "./embeddings";
import { RepositoryRecord } from "./types";

export const PINNED_BOOST = 0.08;

// Pure embedding similarity can under-rank large, multi-topic repos (e.g. a
// full-stack CMS/ERP that also happens to use React) against a narrow JD,
// because the summary's overall vector gets diluted across many unrelated
// concepts. Blending in a direct keyword-overlap score (same idea as ATS
// keyword matching) keeps genuinely relevant repos from losing to smaller,
// single-purpose ones that just happen to sit closer in vector space.
const EMBEDDING_WEIGHT = 0.6;
const KEYWORD_WEIGHT = 0.4;

function normalize(word: string) {
  return word.toLowerCase().trim();
}

function repoKeywordPool(repo: RepositoryRecord): string[] {
  const { tech_skills, relevant_roles } = repo.aiSummary;
  return [
    ...tech_skills.languages,
    ...tech_skills.frameworks,
    ...tech_skills.tools,
    ...tech_skills.concepts,
    ...relevant_roles,
    repo.primaryLanguage,
    ...repo.topics,
  ]
    .map(normalize)
    .filter(Boolean);
}

function keywordOverlapScore(repo: RepositoryRecord, jdKeywords: string[]): number {
  if (!jdKeywords.length) return 0;
  const pool = repoKeywordPool(repo);
  let matches = 0;
  for (const raw of jdKeywords) {
    const keyword = normalize(raw);
    if (!keyword) continue;
    const isMatch = pool.some((entry) => entry.includes(keyword) || keyword.includes(entry));
    if (isMatch) matches += 1;
  }
  return matches / jdKeywords.length;
}

export function selectRelevantRepos(
  repos: RepositoryRecord[],
  jdEmbedding: number[],
  jdKeywords: string[] = [],
) {
  const ranked = repos
    .map((repo) => {
      const embeddingScore = cosineSimilarity(repo.vectorEmbedding, jdEmbedding);
      const keywordScore = keywordOverlapScore(repo, jdKeywords);
      const combinedScore = embeddingScore * EMBEDDING_WEIGHT + keywordScore * KEYWORD_WEIGHT;
      const adjustedScore = repo.isPinned ? combinedScore + PINNED_BOOST : combinedScore;
      return { repo, embeddingScore, keywordScore, adjustedScore };
    })
    .sort((a, b) => b.adjustedScore - a.adjustedScore);

  return ranked.slice(0, 4).map((item) => item.repo);
}