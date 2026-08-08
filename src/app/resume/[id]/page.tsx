import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, Copy, Download, Lock, MoreHorizontal, RefreshCw, Trash2 } from "lucide-react";
import { requireDashboardUser } from "@/lib/auth";
import { getResumeForUser, getUserRepositories } from "@/lib/store";
import ResumeGenerator from "@/app/dashboard/ResumeGenerator";

function formatKeywords(items: string[], max = 8) {
  const visible = items.slice(0, max);
  return `${visible.join(", ")}${items.length > max ? ` ...and ${items.length - max} more` : ""}`;
}

function Chip({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-200">{children}</span>;
}

export default async function ResumePage({ params }: { params: { id: string } }) {
  const user = await requireDashboardUser();
  const [resume, repos] = await Promise.all([getResumeForUser(user.id, params.id), getUserRepositories(user.id)]);
  if (!resume) return <main className="min-h-screen bg-[#0a0a0f] p-8 text-white">Resume not found.</main>;

  const atsScore = resume.atsMatchScore || 0;
  const filledDots = Math.max(1, Math.round(atsScore / 10));
  const selectedRepoNames = repos.filter((repo) => resume.selectedRepoIds.includes(repo.id)).map((repo) => repo.githubRepoName);
  const domainMismatch = Boolean(resume.atsDomainMismatch);
  const noticeClass = domainMismatch ? "border-red-500/40 bg-red-500/10 text-red-50" : atsScore <= 60 ? "border-amber-500/30 bg-amber-500/10 text-amber-50" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-50";

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-zinc-800 bg-[#0a0a0f]/90 px-5 backdrop-blur">
        <Link className="inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-white" href="/dashboard"><ArrowLeft size={17} />Dashboard</Link>
        <h1 className="truncate px-4 text-sm font-semibold sm:text-base">{resume.jobTitle}{resume.companyName ? ` @ ${resume.companyName}` : ""}</h1>
        <button className="rounded-lg border border-zinc-800 p-2 text-zinc-400" aria-label="More actions"><MoreHorizontal size={17} /></button>
      </header>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,3fr)_minmax(320px,2fr)]">
        <section className="min-h-[calc(100vh-3.5rem)] overflow-auto bg-[#0d0d13] px-4 py-8">
          <div className="mx-auto max-w-[680px]">
            <div className={`mb-5 rounded-lg border p-4 text-sm ${noticeClass}`}>
              <p className="font-semibold">{domainMismatch ? "Low match warning" : atsScore <= 60 ? "Partial match for this role" : "Strong match for this role"}</p>
              <p className="mt-2 opacity-90">{domainMismatch ? resume.atsMismatchReason || "This profile does not match the job requirements well enough." : resume.atsMatchedKeywords?.length ? `Matched keywords: ${formatKeywords(resume.atsMatchedKeywords)}` : "Review the ATS insights before applying."}</p>
              {resume.atsRecommendedRoles?.length ? <div className="mt-3 flex flex-wrap gap-2">{resume.atsRecommendedRoles.map((role) => <Chip key={role}>{role}</Chip>)}</div> : null}
            </div>
            <div className="overflow-hidden bg-white shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
              <iframe title="Resume preview" srcDoc={resume.generatedResumeHtml} className="h-[900px] w-full bg-white" />
            </div>
            <div className="sticky bottom-4 mt-4 inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-[#111118]/95 p-2 text-sm text-zinc-300 backdrop-blur">
              <button className="h-8 w-8 rounded border border-zinc-700">-</button><span className="font-code px-2">100%</span><button className="h-8 w-8 rounded border border-zinc-700">+</button>
            </div>
          </div>
        </section>

        <aside className="border-l border-zinc-800 bg-[#0a0a0f] p-5 lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:overflow-auto">
          <div className="grid gap-6">
            <section className="grid gap-3">
              <a className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-3 font-semibold text-white hover:bg-indigo-400" href={resume.pdfFilePath}><Download size={18} />Download PDF</a>
              <button className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 py-3 text-zinc-200 hover:border-indigo-500/40"><Copy size={17} />Copy share link</button>
              <details className="rounded-lg border border-zinc-800 bg-[#111118] p-3">
                <summary className="cursor-pointer text-sm text-zinc-300"><RefreshCw className="mr-2 inline" size={15} />Regenerate</summary>
                <p className="mt-2 text-xs text-zinc-500">Uses 1 of your monthly resumes.</p>
                <div className="mt-4"><ResumeGenerator initialJd={resume.jdText} /></div>
              </details>
            </section>

            <section className="rounded-lg border border-zinc-800 bg-[#111118] p-5">
              <h2 className="font-semibold">ATS Match Score</h2>
              <div className="font-code mt-5 text-center text-5xl font-bold text-indigo-200">{atsScore}%</div>
              <p className="font-code mt-3 text-center text-sm text-indigo-300">{"●".repeat(filledDots)}{"○".repeat(10 - filledDots)}</p>
              <div className="mt-5 grid gap-4 text-sm">
                <div><p className="text-emerald-300">✓ Matched Keywords ({resume.atsMatchedKeywords?.length || 0})</p><p className="mt-1 text-zinc-400">{formatKeywords(resume.atsMatchedKeywords || [])}</p></div>
                <div><p className="text-zinc-400">{user.planType === "free" ? <Lock className="mr-1 inline" size={14} /> : "✕"} Missing Keywords ({resume.atsMissedKeywords?.length || 0})</p><p className="mt-1 text-zinc-500">{user.planType === "free" ? "Upgrade to see full missing keyword analysis." : formatKeywords(resume.atsMissedKeywords || [])}</p></div>
              </div>
            </section>

            <section className="grid gap-3 rounded-lg border border-zinc-800 bg-[#111118] p-5 text-sm">
              <h2 className="font-semibold text-base">Resume Metadata</h2>
              <p className="flex justify-between gap-3"><span className="text-zinc-500">Generated on</span><span>{new Date(resume.generatedAt).toLocaleDateString()}</span></p>
              <p className="flex justify-between gap-3"><span className="text-zinc-500">Job Title</span><span className="text-right">{resume.jobTitle}</span></p>
              <p className="flex justify-between gap-3"><span className="text-zinc-500">Company</span><span>{resume.companyName || "Unknown"}</span></p>
              <p className="grid gap-1"><span className="text-zinc-500">Projects used</span><span>{selectedRepoNames.join(", ") || "Selected GitHub projects"}</span></p>
            </section>

            <section className="pt-4">
              <button className="inline-flex items-center gap-2 text-sm text-red-300 hover:text-red-200"><Trash2 size={15} />Delete this resume</button>
            </section>
          </div>
        </aside>
      </div>
    </main>
  );
}
