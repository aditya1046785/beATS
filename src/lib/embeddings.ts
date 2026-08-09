import "server-only";

const GEMINI_EMBEDDING_MODEL = "gemini-embedding-001";
const OUTPUT_DIMENSIONALITY = 1536; // matches schema.sql — Gemini supports 3072, 1536, or 768
const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS || 30000);

export async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set. Add it to your environment variables.");
  }

  const startedAt = Date.now();
  const truncated = text.slice(0, 6000);
  console.info("[embedding] request started", {
    model: GEMINI_EMBEDDING_MODEL,
    inputLength: text.length,
    truncatedLength: truncated.length,
    dimensions: OUTPUT_DIMENSIONALITY,
    timeoutMs: GEMINI_TIMEOUT_MS,
  });

  let response: Response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_EMBEDDING_MODEL}:embedContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
        body: JSON.stringify({
          model: `models/${GEMINI_EMBEDDING_MODEL}`,
          content: { parts: [{ text: truncated }] },
          outputDimensionality: OUTPUT_DIMENSIONALITY,
        }),
      },
    );
  } catch (error) {
    const elapsed = Date.now() - startedAt;
    if (error instanceof Error && error.name === "TimeoutError") {
      console.error(`[embedding] TIMED OUT after ${elapsed}ms`, { model: GEMINI_EMBEDDING_MODEL });
      throw new Error(
        `Gemini embeddings request timed out after ${GEMINI_TIMEOUT_MS}ms. Check network access to generativelanguage.googleapis.com and that GEMINI_API_KEY is valid.`,
      );
    }
    console.error(`[embedding] request threw after ${elapsed}ms`, error);
    throw error;
  }

  const elapsed = Date.now() - startedAt;

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    console.error("[embedding] request failed", {
      model: GEMINI_EMBEDDING_MODEL,
      status: response.status,
      elapsedMs: elapsed,
      body: errorBody.slice(0, 500),
    });
    throw new Error(
      `Gemini embeddings request failed (${response.status}): ${errorBody.slice(0, 1500)}`,
    );
  }

  const data = await response.json();
  const embedding = data?.embedding?.values;

  if (!Array.isArray(embedding)) {
    console.error("[embedding] unexpected response shape", { keys: Object.keys(data) });
    throw new Error("Gemini embeddings response did not contain a valid embedding array.");
  }

  console.info("[embedding] request finished", {
    model: GEMINI_EMBEDDING_MODEL,
    status: response.status,
    elapsedMs: elapsed,
    dimensions: (embedding as number[]).length,
  });

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
