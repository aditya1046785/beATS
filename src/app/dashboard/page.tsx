import Image from "next/image";
import Link from "next/link";
import { Bell, Download, FileText, Github, LayoutDashboard, RotateCw, Search, Settings, UserCircle } from "lucide-react";
import { requireDashboardUser } from "@/lib/auth";
import { getUserRepositories, getUserResumes } from "@/lib/store";
import { formatDate } from "@/lib/formatDate";
import ResumeGenerator from "./ResumeGenerator";

function scoreColor(score: number) {
  if (score > 70) return "text-emerald-400";
  if (score >= 40) return "text-amber-400";
  return "text-red-400";
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const user = await requireDashboardUser();
  const [repos, resumes] = await Promise.all([getUserRepositories(user.id), getUserResumes(user.id)]);
  const lastSyncDays = user.lastGithubSyncAt
    ? Math.floor((Date.now() - new Date(user.lastGithubSyncAt).getTime()) / 86400000)
    : 0;
  const usage = Math.min(user.resumesGeneratedThisMonth, 2);
  const avgScore = resumes.length ? Math.round(resumes.reduce((sum, resume) => sum + (resume.atsMatchScore || 0), 0) / resumes.length) : 0;
  const planIsFree = user.planType === "free";
  const visibleResumes = resumes.slice(0, 4);

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-zinc-100">
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center border-b border-zinc-800 bg-[#0a0a0f]/90 px-4 backdrop-blur">
        <Link href="/dashboard" className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500 text-white"><FileText size={18} /></Link>
        <div className="mx-auto hidden w-full max-w-md items-center gap-2 rounded-full border border-zinc-800 bg-[#111118] px-4 py-2 text-sm text-zinc-500 md:flex">
          <Search size={16} />
          <span>Search your resumes...</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button className="rounded-lg border border-zinc-800 p-2 text-zinc-400 hover:border-indigo-500/40 hover:text-zinc-100" aria-label="Notifications"><Bell size={17} /></button>
          {user.avatarUrl ? (
            <Image src={user.avatarUrl} alt="" width={32} height={32} className={`rounded-full ring-2 ${planIsFree ? "ring-zinc-600" : "ring-emerald-400"}`} />
          ) : <UserCircle className={planIsFree ? "text-zinc-600" : "text-emerald-400"} />}
        </div>
      </header>

      <aside className="fixed bottom-0 left-0 top-14 hidden w-60 border-r border-zinc-800 bg-[#0d0d13] p-4 lg:flex lg:flex-col">
        <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-[#111118] p-3">
          {user.avatarUrl ? <Image src={user.avatarUrl} alt="" width={40} height={40} className="rounded-full" /> : <UserCircle />}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-zinc-500">{user.degree || "B.Tech CSE"} • {user.collegeName || "FGIET"}</p>
            <Link href="/settings#billing" className="mt-1 inline-flex rounded-full border border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-300">{planIsFree ? "Free Plan" : "Pro Plan"}</Link>
          </div>
        </div>
        <nav className="mt-6 grid gap-1 text-sm">
          <Link href="/dashboard" className="flex items-center gap-3 border-l-2 border-indigo-500 bg-indigo-500/10 px-3 py-2 text-indigo-200"><LayoutDashboard size={16} />Dashboard</Link>
          <Link href="#resumes" className="flex items-center gap-3 border-l-2 border-transparent px-3 py-2 text-zinc-400 hover:bg-white/5 hover:text-zinc-100"><FileText size={16} />My Resumes</Link>
          <Link href="/processing" className="flex items-center gap-3 border-l-2 border-transparent px-3 py-2 text-zinc-400 hover:bg-white/5 hover:text-zinc-100"><RotateCw size={16} />Sync GitHub</Link>
          <Link href="/settings" className="flex items-center gap-3 border-l-2 border-transparent px-3 py-2 text-zinc-400 hover:bg-white/5 hover:text-zinc-100"><Settings size={16} />Settings</Link>
        </nav>
        {planIsFree ? (
          <div className="mt-auto rounded-lg border border-zinc-800 bg-[#111118] p-4">
            <div className="flex justify-between text-xs text-zinc-400"><span>Resumes this month</span><span>{usage} / 2 used</span></div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
              <div className={`h-full ${usage >= 2 ? "bg-amber-500" : "bg-indigo-500"}`} style={{ width: `${(usage / 2) * 100}%` }} />
            </div>
            <Link href="/settings#billing" className="mt-3 inline-flex text-sm text-indigo-300 hover:text-indigo-200">Upgrade for unlimited {"->"}</Link>
          </div>
        ) : null}
      </aside>

      <div className="pt-14 lg:pl-60">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-8">
          <section className="rounded-lg border border-indigo-500/10 bg-gradient-to-r from-indigo-500/10 to-transparent p-5">
            <h1 className="text-2xl font-bold">{greeting()}, {user.name.split(" ")[0]}.</h1>
            <p className="mt-1 text-zinc-400">{resumes.length ? `You have ${resumes.length} tailored resumes ready to use.` : "Paste a job description below to generate your resume."}</p>
          </section>
          {lastSyncDays > 30 ? (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
              Your last GitHub sync was {lastSyncDays} days ago. Sync now to include new projects.
            </p>
          ) : null}
          <ResumeGenerator />
          <section className="font-code grid gap-3 rounded-lg border border-zinc-800 bg-[#111118] px-5 py-4 text-sm text-zinc-300 sm:grid-cols-3">
            <p><span className="text-zinc-50">{resumes.length}</span> Resumes Created</p>
            <p><span className="text-zinc-50">{avgScore}%</span> Avg ATS Score</p>
            <p><span className="text-zinc-50">{repos.length}</span> GitHub Projects Used</p>
          </section>
          <section id="resumes">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent Resumes</h2>
              {resumes.length > 4 ? <Link href="#resumes" className="text-sm text-indigo-300">View All {"->"}</Link> : null}
            </div>
            {visibleResumes.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visibleResumes.map((resume) => {
                  const initials = (resume.companyName || resume.jobTitle || "R").slice(0, 2).toUpperCase();
                  const dots = Math.max(1, Math.round((resume.atsMatchScore || 0) / 20));
                  return (
                    <Link key={resume.id} href={`/resume/${resume.id}`} className="group rounded-lg border border-zinc-800 bg-[#111118] p-5 hover:-translate-y-0.5 hover:border-indigo-500/40 hover:shadow-xl hover:shadow-black/30">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-500/15 font-semibold text-indigo-200">{initials}</div>
                      <h3 className="mt-5 font-semibold">{resume.jobTitle}</h3>
                      <p className="text-sm text-zinc-500">{resume.companyName || "Target company"}</p>
                      <p className={`font-code mt-4 text-sm ${scoreColor(resume.atsMatchScore || 0)}`}>ATS Score: {resume.atsMatchScore || 0}% <span>{"●".repeat(dots)}{"○".repeat(5 - dots)}</span></p>
                      <p className="mt-3 text-xs text-zinc-500">Generated {formatDate(resume.generatedAt)}</p>
                      <div className="mt-5 flex gap-2">
                        <span className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200"><Download size={14} />Download</span>
                        <span className="rounded-lg bg-indigo-500 px-3 py-2 text-sm font-semibold text-white">View</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-zinc-800 bg-[#111118] p-10 text-center">
                <FileText className="mx-auto text-zinc-600" size={44} />
                <h3 className="mt-4 text-lg font-semibold">Your first resume is one paste away.</h3>
                <p className="mt-1 text-sm text-zinc-500">Copy any job description above and hit Generate.</p>
              </div>
            )}
          </section>
          <section>
            <h2 className="mb-4 text-xl font-semibold">My GitHub Projects</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {repos.map((repo) => (
                <div key={repo.id} className="rounded-lg border border-zinc-800 bg-[#111118] p-4">
                  <p className="flex items-center gap-2 font-medium"><Github size={16} />{repo.githubRepoName}{repo.isPinned ? " (Pinned)" : ""}</p>
                  <p className="text-sm text-indigo-300">{repo.primaryLanguage}</p>
                  <p className="mt-2 text-sm text-zinc-500">{repo.shortDescription}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
