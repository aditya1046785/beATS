import Link from "next/link";
import type { ReactNode } from "react";
import { requireDashboardUser } from "@/lib/auth";
import { getResumeForUser } from "@/lib/store";
import ResumeGenerator from "@/app/dashboard/ResumeGenerator";

function formatKeywords(items: string[], max = 16) {
  const visible = items.slice(0, max);
  return `${visible.join(", ")}${items.length > max ? ` ...and ${items.length - max} more` : ""}`;
}

function Chip({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-200">{children}</span>;
}

export default async function ResumePage({ params }: { params: { id: string } }) {
  const user = await requireDashboardUser();
  const resume = await getResumeForUser(user.id, params.id);
  if (!resume) return <main className="min-h-screen bg-[#080808] p-8 text-white">Resume not found.</main>;

  const atsScore = resume.atsMatchScore || 0;
  const domainMismatch = Boolean(resume.atsDomainMismatch);
  const isHardWarning = domainMismatch; // Show hard warning whenever domain_mismatch is true
  const isSoftNotice = !domainMismatch && atsScore >= 40 && atsScore <= 60; // Only show soft notice when NO mismatch and score is moderate
  const isStrongMatch = !domainMismatch && atsScore > 60;

  return (
    <main className="min-h-screen bg-[#080808] px-6 py-8 text-white">
      <div className="mx-auto grid max-w-5xl gap-5">
        {isHardWarning ? (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-5 text-red-50 shadow-lg shadow-red-950/20">
            <h2 className="text-xl font-bold">⚠️ Low Match Warning</h2>
            <p className="mt-2 text-sm text-red-100/90">{resume.atsMismatchReason || "This profile does not match the job requirements well enough."}</p>
            {resume.atsRecommendedRoles?.length ? (
              <div className="mt-4">
                <p className="text-sm font-semibold text-red-100">Your profile is better suited for:</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {resume.atsRecommendedRoles.map((role) => (
                    <Chip key={role}>{role}</Chip>
                  ))}
                </div>
              </div>
            ) : null}
            <p className="mt-4 text-sm text-red-100/90">
              This role may not be the right fit for your current profile. Consider focusing on roles that align better with your experience level and skill set.
            </p>
          </div>
        ) : null}

        {isSoftNotice ? (
          <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-yellow-50">
            <p className="font-semibold">This resume partially matches the job description. Consider building projects in the missing areas to improve your profile for this role.</p>
            {resume.atsMissedKeywords?.length ? (
              <p className="mt-2 text-sm text-yellow-100/90">Missing keywords: {formatKeywords(resume.atsMissedKeywords)}</p>
            ) : null}
          </div>
        ) : null}

        {isStrongMatch ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-50">
            <p className="font-semibold">Strong match for this role.</p>
            {resume.atsMatchedKeywords?.length ? (
              <p className="mt-2 text-sm text-emerald-100/90">Matched keywords: {formatKeywords(resume.atsMatchedKeywords)}</p>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Your resume is ready! Download it below.</h1>
            <p className="text-blue-300">ATS Match Score: {resume.atsMatchScore}%</p>
            {user.planType === "pro" ? (
              <div className="mt-2 space-y-1 text-sm text-zinc-400">
                <p>Matched: {formatKeywords(resume.atsMatchedKeywords)}</p>
                <p>Missed: {formatKeywords(resume.atsMissedKeywords)}</p>
              </div>
            ) : null}
          </div>
          <div className="flex gap-2">
            <a className="rounded bg-blue-600 px-4 py-2 font-semibold" href={resume.pdfFilePath}>Download PDF</a>
            <Link className="rounded border border-zinc-700 px-4 py-2" href="/dashboard">Back to Dashboard</Link>
          </div>
        </div>
        <iframe title="Resume preview" srcDoc={resume.generatedResumeHtml} className="h-[900px] w-full bg-white" />
        <details className="rounded border border-zinc-800 bg-zinc-950 p-4">
          <summary className="cursor-pointer font-semibold">Regenerate</summary>
          <div className="mt-4">
            <ResumeGenerator initialJd={resume.jdText} />
          </div>
        </details>
      </div>
    </main>
  );
}
