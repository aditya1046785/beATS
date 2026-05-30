import "server-only";
import { RepoSummary, RepositoryRecord, ResumeContent, UserProfile } from "./types";

const MODEL = "openai/gpt-oss-120b:free";

async function callOpenRouter(system: string, user: string) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is required");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY || ""}`,
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "X-Title": "PositionPerfect AI",
  };

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 3500,
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`OpenRouter request failed: ${response.status} ${detail.slice(0, 300)}`);
  }
  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return payload.choices?.[0]?.message?.content || "";
}

function parseJson<T>(text: string): T {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error("AI returned malformed JSON");
  return JSON.parse(cleaned.slice(start, end + 1)) as T;
}

async function callJson<T>(system: string, user: string) {
  const first = await callOpenRouter(system, user);
  try {
    return parseJson<T>(first);
  } catch {
    const second = await callOpenRouter(
      `${system} Return valid JSON only. No markdown, no commentary, no extra text.`,
      user,
    );
    return parseJson<T>(second);
  }
}

export async function summarizeRepository(input: {
  name: string;
  description: string;
  topics: string[];
  languageBreakdown: Record<string, number>;
  readme: string;
  dependencies: string;
}) {
  const prompt = `Return JSON only with keys: explanation, skills, problem, implementations, relevantRoles.

Repository:
${JSON.stringify(input, null, 2)}`;

  return callJson<RepoSummary>(
    "You summarize GitHub repositories for truthful student resumes. Do not invent technologies.",
    prompt,
  );
}

export async function extractJobMeta(jd: string) {
  return callJson<{ jobTitle: string; companyName: string }>(
    "Extract job metadata. Return JSON only.",
    `From this job description, return {"jobTitle":"","companyName":""}. Use empty string if absent.\n\n${jd}`,
  );
}

export async function generateResumeContent(user: UserProfile, jd: string, repos: RepositoryRecord[]) {
  return callJson<ResumeContent>(
    "You write ATS-friendly resumes as strict JSON. Use only supplied user details and repository evidence. No markdown.",
    `Write resume JSON with keys header, education, technicalSkills, projects, experience, achievements.
Section order will be Header, Education, Skills, Projects, Experience, Achievements.
Projects: max 4. Bullets: 2-3 each, start with strong action verbs, use JD language naturally, quantify only when reasonable.
Skip experience/achievements if not provided.

User:
${JSON.stringify(user, null, 2)}

Selected repositories:
${JSON.stringify(repos, null, 2)}

Job description:
${jd}`,
  );
}
