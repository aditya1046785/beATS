import Image from "next/image";
import Link from "next/link";
import { requireDashboardUser } from "@/lib/auth";
import { getUserRepositories, getUserResumes } from "@/lib/store";
import ResumeGenerator from "./ResumeGenerator";

export default async function DashboardPage() {
  const user = await requireDashboardUser();
  const [repos, resumes] = await Promise.all([getUserRepositories(user.id), getUserResumes(user.id)]);
  const lastSyncDays = user.lastGithubSyncAt
    ? Math.floor((Date.now() - new Date(user.lastGithubSyncAt).getTime()) / 86400000)
    : 0;
  return (
    <main className="min-h-screen bg-[#080808] px-6 py-8 text-white">
      <div className="mx-auto grid max-w-6xl gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {user.avatarUrl ? <Image src={user.avatarUrl} alt="" width={48} height={48} className="rounded-full" /> : null}
            <div>
              <h1 className="text-2xl font-bold">Hi, {user.name}</h1>
              <p className="text-sm text-zinc-400">{repos.length} GitHub repos processed</p>
            </div>
          </div>
          <Link className="rounded border border-zinc-700 px-4 py-2 text-sm" href="/settings">Settings</Link>
        </header>
        {lastSyncDays > 30 ? (
          <p className="rounded border border-amber-700 bg-amber-950 p-3 text-sm">
            Your last GitHub sync was {lastSyncDays} days ago. Sync now to include new projects.
          </p>
        ) : null}
        <section>
          <h2 className="mb-3 text-xl font-semibold">Generate Resume</h2>
          <ResumeGenerator />
        </section>
        <section>
          <h2 className="mb-3 text-xl font-semibold">My Resumes</h2>
          <div className="grid gap-3">
            {resumes.length ? resumes.slice(0, user.planType === "free" ? 5 : resumes.length).map((resume) => (
              <div key={resume.id} className="flex flex-wrap items-center justify-between gap-3 rounded border border-zinc-800 bg-zinc-950 p-4">
                <div>
                  <p className="font-medium">{resume.jobTitle}{resume.companyName ? ` - ${resume.companyName}` : ""}</p>
                  <p className="text-sm text-zinc-500">{new Date(resume.generatedAt).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <a className="rounded border border-zinc-700 px-3 py-2 text-sm" href={resume.pdfFilePath}>Download</a>
                  <Link className="rounded bg-zinc-800 px-3 py-2 text-sm" href={`/resume/${resume.id}`}>View</Link>
                </div>
              </div>
            )) : <p className="text-zinc-400">No resumes yet. Paste a job description above to generate your first one.</p>}
          </div>
        </section>
        <section>
          <h2 className="mb-3 text-xl font-semibold">My GitHub Projects</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {repos.map((repo) => (
              <div key={repo.id} className="rounded border border-zinc-800 bg-zinc-950 p-4">
                <p className="font-medium">{repo.githubRepoName}{repo.isPinned ? " (Pinned)" : ""}</p>
                <p className="text-sm text-blue-300">{repo.primaryLanguage}</p>
                <p className="mt-2 text-sm text-zinc-400">{repo.shortDescription}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
