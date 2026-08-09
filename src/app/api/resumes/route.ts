import { NextRequest, NextResponse } from "next/server";
import { requireDashboardUser } from "@/lib/auth";
import { evaluateAtsScore, extractJobMeta, generateResumeContent } from "../../../lib/ai";
import { embedText } from "@/lib/embeddings";
import { normalizeResumeContent, renderResumeHtml, renderHtmlToPdf } from "@/lib/resume";
import { selectRelevantRepos } from "@/lib/selection";
import { addResume, getUserRepositories, saveUser, uploadResumePdf } from "@/lib/store";
import { ResumeRecord } from "@/lib/types";

// Chromium launch + PDF rendering can take longer than the default serverless
// timeout, especially on a cold start. Extend it explicitly.
export const maxDuration = 60;

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
  if (message.includes("GEMINI_API_KEY") || message.includes("Gemini embeddings request failed")) {
    return "Embedding request failed. Please check your GEMINI_API_KEY and try again.";
  }
  if (message.includes("AI returned malformed JSON") || message.includes("JSON")) {
    return "AI returned an invalid resume format. Please try again.";
  }
  if (message.includes("Could not find Chrome") || message.includes("chromium")) {
    return "PDF generation failed on the server. Please try again in a moment.";
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
    const resumeStartedAt = Date.now();
    console.info("[resume] started", { userId: user.id, jdLength: jd.length, repos: repos.length });
    const jdEmbedding = await embedText(jd);
    console.info("[resume] jd embedding created", { dimensions: jdEmbedding.length });
    const selected = selectRelevantRepos(repos, jdEmbedding);
    console.info("[resume] repos selected", selected.map((repo) => repo.githubRepoName));
    const meta = await extractJobMeta(jd).catch((error: unknown) => {
      console.error("[resume] job metadata extraction failed; continuing", error);
      return {
        job_title: "Target Role",
        company_name: "",
        required_skills: [],
        preferred_skills: [],
        key_responsibilities: [],
        keywords: [],
        experience_level: "",
        domain: "",
      };
    });
    console.info("[resume] job metadata ready", meta);
    const content = normalizeResumeContent(await generateResumeContent(user, jd, selected, meta));
    console.info("[resume] content generated", { projects: content.projects.length });
    const html = renderResumeHtml(content);
    const atsStartedAt = Date.now();
    console.info("[resume] ats scoring started", { keywordCount: meta.keywords.length });
    const ats = await evaluateAtsScore({
      jdKeywords: meta.keywords,
      jdRequiredSkills: meta.required_skills,
      jdPreferredSkills: meta.preferred_skills,
      resumeFullText: html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    }).catch((error: unknown) => {
      console.error("[resume] ATS scoring failed; falling back", error);
      return {
        ats_score: 0,
        matched_keywords: [],
        missing_keywords: meta.keywords,
        score_explanation: "ATS analysis failed, so a fallback score of 0 was used.",
        domain_mismatch: false,
        mismatch_reason: null,
        recommended_roles: [],
      };
    });
    console.info("[resume] ats scoring completed", { ats: ats.ats_score, durationMs: Date.now() - atsStartedAt });
    const id = crypto.randomUUID();
    const pdfStartedAt = Date.now();
    console.info("[resume] pdf render started", { id });
    const pdfBuffer = await renderHtmlToPdf(html);
    console.info("[resume] pdf render completed", { durationMs: Date.now() - pdfStartedAt, bytes: pdfBuffer.length });
    const pdfUrl = await uploadResumePdf(`${id}.pdf`, pdfBuffer);
    console.info("[resume] pdf uploaded", { pdfUrl });
    const resume: ResumeRecord = {
      id,
      userId: user.id,
      jobTitle: meta.job_title || "Target Role",
      companyName: meta.company_name || "",
      jdText: jd,
      jdEmbedding,
      selectedRepoIds: selected.map((repo) => repo.id),
      generatedResumeContent: content,
      generatedResumeHtml: html,
      pdfFilePath: pdfUrl,
      atsMatchScore: ats.ats_score,
      atsMatchedKeywords: ats.matched_keywords,
      atsMissedKeywords: ats.missing_keywords,
      atsDomainMismatch: ats.domain_mismatch,
      atsMismatchReason: ats.mismatch_reason,
      atsRecommendedRoles: ats.recommended_roles,
      generatedAt: new Date().toISOString(),
      templateUsed: "ats-single-column",
    };
    await addResume(resume);
    await saveUser({ ...user, monthTracker: nowMonth, resumesGeneratedThisMonth: usage + 1 });
    console.info("[resume] completed", { resumeId: id, ats: ats.ats_score, durationMs: Date.now() - resumeStartedAt });
    return NextResponse.json({ id });
  } catch (error) {
    console.error("[resume] failed", error);
    return NextResponse.json({ error: sanitizeResumeError(error) }, { status: 500 });
  }
}