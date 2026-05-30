import { NextRequest, NextResponse } from "next/server";
import { requireDashboardUser } from "@/lib/auth";
import { extractJobMeta, generateResumeContent } from "@/lib/ai";
import { embedText } from "@/lib/embeddings";
import { calculateAtsScore, normalizeResumeContent, renderResumeHtml, writeSimplePdf } from "@/lib/resume";
import { selectRelevantRepos } from "@/lib/selection";
import { addResume, generatedPdfPath, getUserRepositories, saveUser } from "@/lib/store";
import { ResumeRecord } from "@/lib/types";

function cleanJd(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function sanitizeResumeError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("OpenRouter request failed")) {
    return "AI request failed. Please check your OpenRouter credits/rate limit and try again.";
  }
  if (message.includes("OPENROUTER_API_KEY")) {
    return "OpenRouter API key is missing. Add OPENROUTER_API_KEY in .env.local and restart the server.";
  }
  if (message.includes("Sentence Transformers") || message.includes("sentence_transformers")) {
    return "Local embedding model is not ready. Install sentence-transformers and try again.";
  }
  if (message.includes("AI returned malformed JSON") || message.includes("JSON")) {
    return "AI returned an invalid resume format. Please try again.";
  }
  return "Something went wrong. Please try again.";
}

export async function POST(request: NextRequest) {
  const user = await requireDashboardUser();
  const nowMonth = new Date().toISOString().slice(0, 7);
  const usage = user.monthTracker === nowMonth ? user.resumesGeneratedThisMonth : 0;
  if (user.planType === "free" && usage >= 2) {
    return NextResponse.json(
      { error: "You've used your 2 free resumes this month. Upgrade to Pro for unlimited resumes." },
      { status: 402 },
    );
  }

  const body = await request.json();
  const jd = cleanJd(body.jd || "");
  if (!jd) return NextResponse.json({ error: "Paste the Job Description here..." }, { status: 400 });
  const repos = await getUserRepositories(user.id);
  if (!repos.length) {
    return NextResponse.json(
      { error: "We couldn't find any public repositories on your GitHub. Make sure your repos are public and have a description or README." },
      { status: 400 },
    );
  }

  try {
    console.info("[resume] started", { userId: user.id, jdLength: jd.length, repos: repos.length });
    const jdEmbedding = await embedText(jd);
    console.info("[resume] jd embedding created", { dimensions: jdEmbedding.length });
    const selected = selectRelevantRepos(repos, jdEmbedding);
    console.info("[resume] repos selected", selected.map((repo) => repo.githubRepoName));
    const meta = await extractJobMeta(jd).catch((error) => {
      console.error("[resume] job metadata extraction failed; continuing", error);
      return { jobTitle: "Target Role", companyName: "" };
    });
    console.info("[resume] job metadata ready", meta);
    const content = normalizeResumeContent(await generateResumeContent(user, jd, selected));
    console.info("[resume] content generated", { projects: content.projects.length });
    const html = renderResumeHtml(content);
    const ats = calculateAtsScore(jd, html);
    const id = crypto.randomUUID();
    const pdf = generatedPdfPath(`${id}.pdf`);
    await writeSimplePdf(html, pdf.absolute);
    const resume: ResumeRecord = {
      id,
      userId: user.id,
      jobTitle: meta.jobTitle || "Target Role",
      companyName: meta.companyName || "",
      jdText: jd,
      selectedRepoIds: selected.map((repo) => repo.id),
      generatedResumeContent: content,
      generatedResumeHtml: html,
      pdfFilePath: pdf.publicUrl,
      atsMatchScore: ats.score,
      atsMatchedKeywords: ats.matched,
      atsMissedKeywords: ats.missed,
      generatedAt: new Date().toISOString(),
      templateUsed: "ats-single-column",
    };
    await addResume(resume);
    await saveUser({ ...user, monthTracker: nowMonth, resumesGeneratedThisMonth: usage + 1 });
    console.info("[resume] completed", { resumeId: id, ats: ats.score });
    return NextResponse.json({ id });
  } catch (error) {
    console.error("[resume] failed", error);
    return NextResponse.json({ error: sanitizeResumeError(error) }, { status: 500 });
  }
}
