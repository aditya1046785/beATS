import Link from "next/link";
import { requireDashboardUser } from "@/lib/auth";
import { getResumeForUser } from "@/lib/store";
import ResumeGenerator from "@/app/dashboard/ResumeGenerator";

export default async function ResumePage({ params }: { params: { id: string } }) {
  const user = await requireDashboardUser();
  const resume = await getResumeForUser(user.id, params.id);
  if (!resume) return <main className="min-h-screen bg-[#080808] p-8 text-white">Resume not found.</main>;
  return (
    <main className="min-h-screen bg-[#080808] px-6 py-8 text-white">
      <div className="mx-auto grid max-w-5xl gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Your resume is ready! Download it below.</h1>
            <p className="text-blue-300">ATS Match Score: {resume.atsMatchScore}%</p>
            {user.planType === "pro" ? <p className="text-sm text-zinc-400">Matched: {resume.atsMatchedKeywords.join(", ")}</p> : null}
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
            <ResumeGenerator />
          </div>
        </details>
      </div>
    </main>
  );
}
