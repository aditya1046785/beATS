#!/usr/bin/env node
/**
 * Standalone diagnostic: tests the Gemini embeddings API and the OpenRouter
 * LLM API directly, using keys from .env.local. Run from the positionperfect
 * directory:
 *
 *   node scripts/diag-apis.mjs
 *
 * Exit code 0 = both APIs reachable. Non-zero = at least one failed.
 * This does NOT touch GitHub or your app — it isolates the two API calls
 * that happen after a repo is fetched.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");

function loadEnv(file) {
  const vars = {};
  if (!fs.existsSync(file)) return vars;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    let key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

const env = loadEnv(envPath);
const GEMINI_KEY = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const OR_KEY = env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;
const OR_MODEL = env.OPENROUTER_MODEL || process.env.OPENROUTER_MODEL || "openai/gpt-5.6-luna";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

function ok(msg) {
  console.log(`${GREEN}[PASS]${RESET} ${msg}`);
}
function fail(msg) {
  console.log(`${RED}[FAIL]${RESET} ${msg}`);
}
function warn(msg) {
  console.log(`${YELLOW}[WARN]${RESET} ${msg}`);
}

async function testGeminiEmbedding() {
  if (!GEMINI_KEY) {
    fail("GEMINI_API_KEY is not set in .env.local");
    return false;
  }
  console.log("\n=== Test 1: Gemini embeddings (gemini-embedding-001) ===");
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=" +
    GEMINI_KEY;
  const startedAt = Date.now();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(30000),
      body: JSON.stringify({
        model: "models/gemini-embedding-001",
        content: { parts: [{ text: "hello world" }] },
        outputDimensionality: 1536,
      }),
    });
    const elapsed = Date.now() - startedAt;
    const body = await res.text();
    if (!res.ok) {
      fail(`Gemini responded HTTP ${res.status} after ${elapsed}ms`);
      console.log("  body:", body.slice(0, 400));
      return false;
    }
    const data = JSON.parse(body);
    const dims = data?.embedding?.values?.length;
    if (!Array.isArray(data?.embedding?.values)) {
      fail(`Gemini returned unexpected shape after ${elapsed}ms`);
      console.log("  body:", body.slice(0, 400));
      return false;
    }
    ok(`embedding returned ${dims} dimensions in ${elapsed}ms`);
    return true;
  } catch (err) {
    const elapsed = Date.now() - startedAt;
    const name = err instanceof Error && err.name === "TimeoutError" ? "TIMEOUT" : "ERROR";
    fail(`${name} after ${elapsed}ms: ${err instanceof Error ? err.message : String(err)}`);
    console.log("  This means the app would hang exactly here (embedText has no fallback).");
    return false;
  }
}

async function testOpenRouter() {
  if (!OR_KEY) {
    fail("OPENROUTER_API_KEY is not set in .env.local");
    return false;
  }
  console.log(`\n=== Test 2: OpenRouter chat completion (${OR_MODEL}) ===`);
  const startedAt = Date.now();
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OR_KEY}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "PositionPerfect diag",
      },
      signal: AbortSignal.timeout(45000),
      body: JSON.stringify({
        model: OR_MODEL,
        max_tokens: 20,
        messages: [
          { role: "system", content: "You are a diagnostic. Reply with the single word OK." },
          { role: "user", content: "Reply OK." },
        ],
      }),
    });
    const elapsed = Date.now() - startedAt;
    const body = await res.text();
    if (!res.ok) {
      fail(`OpenRouter responded HTTP ${res.status} after ${elapsed}ms`);
      console.log("  body:", body.slice(0, 400));
      if (res.status === 404) {
        warn(`Model "${OR_MODEL}" was not found. Check OPENROUTER_MODEL in .env.local.`);
      }
      if (res.status === 402 || res.status === 429) {
        warn("This is a billing / rate-limit issue on your OpenRouter account, not code.");
      }
      return false;
    }
    const data = JSON.parse(body);
    const content = data?.choices?.[0]?.message?.content || "";
    ok(`model responded in ${elapsed}ms: "${content.trim().slice(0, 60)}"`);
    return true;
  } catch (err) {
    const elapsed = Date.now() - startedAt;
    const name = err instanceof Error && err.name === "TimeoutError" ? "TIMEOUT" : "ERROR";
    fail(`${name} after ${elapsed}ms: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

const geminiOk = await testGeminiEmbedding();
const openRouterOk = await testOpenRouter();

console.log("\n=== SUMMARY ===");
console.log(`Gemini embeddings:  ${geminiOk ? GREEN + "PASS" : RED + "FAIL"}${RESET}`);
console.log(`OpenRouter LLM:     ${openRouterOk ? GREEN + "PASS" : RED + "FAIL"}${RESET}`);
if (geminiOk && openRouterOk) {
  console.log("\nBoth APIs work from your machine. The hang is likely elsewhere");
  console.log("(e.g. GitHub fetch, or the frontend polling) — check the [pipeline]/[openrouter]/[embedding] logs.");
} else if (!geminiOk) {
  console.log("\nGemini is the problem. Fix GEMINI_API_KEY / network, then re-run.");
} else {
  console.log("\nOpenRouter is the problem. Fix the key / model / billing, then re-run.");
}
process.exit(geminiOk && openRouterOk ? 0 : 1);
