import "server-only";
import { spawn } from "child_process";
import { existsSync } from "fs";

const PYTHON_CANDIDATES = ["./venv/bin/python", "python3"];

export async function embedText(text: string): Promise<number[]> {
  const script = `
import json, sys
from sentence_transformers import SentenceTransformer
model = SentenceTransformer("all-MiniLM-L6-v2")
payload = json.load(sys.stdin)
embedding = model.encode(payload["text"], normalize_embeddings=True).tolist()
print(json.dumps(embedding))
`;

  const python = PYTHON_CANDIDATES.find((candidate) => {
    if (candidate === "python3") return true;
    try {
      return existsSync(candidate);
    } catch {
      return false;
    }
  }) || "python3";

  return new Promise((resolve, reject) => {
    const child = spawn(python, ["-c", script], { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk.toString()));
    child.stderr.on("data", (chunk) => (stderr += chunk.toString()));
    child.on("close", (code) => {
      if (code !== 0) {
        reject(
          new Error(
            [
              `Local Sentence Transformers embedding failed with interpreter '${python}'.`,
              "Required model: all-MiniLM-L6-v2.",
              "If sentence-transformers is installed in venv, ensure ./venv/bin/python exists and server runs from project root.",
              "If model download fails, verify network access to huggingface.co and retry.",
              `stderr: ${stderr.slice(0, 1500)}`,
            ].join(" "),
          ),
        );
        return;
      }
      try {
        resolve(JSON.parse(stdout) as number[]);
      } catch (error) {
        reject(new Error(`Local Sentence Transformers embedding output parse failed: ${String(error)}`));
      }
    });
    child.on("error", (error) => {
      reject(new Error(`Failed to start Python interpreter '${python}' for embeddings: ${String(error)}`));
    });
    child.stdin.end(JSON.stringify({ text: text.slice(0, 6000) }));
  });
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
