import "server-only";
import { spawn } from "child_process";

export async function embedText(text: string): Promise<number[]> {
  const script = `
import json, sys
from sentence_transformers import SentenceTransformer
model = SentenceTransformer("all-MiniLM-L6-v2")
payload = json.load(sys.stdin)
embedding = model.encode(payload["text"], normalize_embeddings=True).tolist()
print(json.dumps(embedding))
`;
  return new Promise((resolve, reject) => {
    const child = spawn("python3", ["-c", script], { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk.toString()));
    child.stderr.on("data", (chunk) => (stderr += chunk.toString()));
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Local Sentence Transformers embedding failed. Install sentence-transformers. ${stderr}`));
        return;
      }
      resolve(JSON.parse(stdout) as number[]);
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
