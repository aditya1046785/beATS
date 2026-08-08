import "server-only";

const GEMINI_EMBEDDING_MODEL = "gemini-embedding-001";
const OUTPUT_DIMENSIONALITY = 1536; // matches schema.sql — Gemini supports 3072, 1536, or 768

export async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set. Add it to your environment variables.");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_EMBEDDING_MODEL}:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: `models/${GEMINI_EMBEDDING_MODEL}`,
        content: { parts: [{ text: text.slice(0, 6000) }] },
        outputDimensionality: OUTPUT_DIMENSIONALITY,
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Gemini embeddings request failed (${response.status}): ${errorBody.slice(0, 1500)}`,
    );
  }

  const data = await response.json();
  const embedding = data?.embedding?.values;

  if (!Array.isArray(embedding)) {
    throw new Error("Gemini embeddings response did not contain a valid embedding array.");
  }

  return embedding as number[];
}

export function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0;
  let left = 0;
  let right = 0;
  for (let index = 0; index < Math.min(a.length, b.length); index += 1) {
    dot += a[index] * b[index];
    left += a[index] * a[index];
    right += b[index] * b[index];
  }
  if (!left || !right) return 0;  
  return dot / (Math.sqrt(left) * Math.sqrt(right));
}