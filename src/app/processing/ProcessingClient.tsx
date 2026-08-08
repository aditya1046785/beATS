"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Check, Circle, RotateCw } from "lucide-react";

type ProcessingRepo = {
  name: string;
  description: string;
  language: string;
  stars: number;
  pinned: boolean;
  updatedAt: string;
};

type ProcessingStatus = {
  processed: boolean;
  processing: boolean;
  stage: string;
  progress: number;
  currentRepo: string;
  completed: number;
  total: number;
  repos: ProcessingRepo[];
  error: string;
};

const emptyStatus: ProcessingStatus = {
  processed: false,
  processing: false,
  stage: "Preparing...",
  progress: 0,
  currentRepo: "",
  completed: 0,
  total: 0,
  repos: [],
  error: "",
};

export default function ProcessingClient() {
  const [status, setStatus] = useState<ProcessingStatus>(emptyStatus);
  const [retrying, setRetrying] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const activeRepo = status.currentRepo || status.repos[Math.min(status.repos.length - 1, Math.floor((status.progress / 100) * Math.max(status.repos.length, 1)))]?.name || "";
  const doneCount = status.completed || Math.min(Math.max(1, Math.round((status.progress / 100) * Math.max(status.total || 24, 1))), status.total || 24);
  const totalCount = status.total || Math.max(status.repos.length, 1);
  const logs = useMemo(() => {
    const repoLogs = status.repos.slice(0, 5).map((repo) => {
      const parts = [repo.name];
      if (repo.language) parts.push(repo.language);
      if (repo.stars) parts.push(`${repo.stars}★`);
      if (repo.pinned) parts.push("pinned");
      if (repo.description) parts.push(repo.description);
      return parts.join(" • ");
    });
    return [
      status.processed ? "Repository embeddings saved to profile" : activeRepo ? `Analyzing ${activeRepo}...` : "Reading live GitHub repositories...",
      ...repoLogs,
      status.stage,
      "Repositories fetched directly from GitHub",
    ].filter(Boolean);
  }, [activeRepo, status.processed, status.repos, status.stage]);

  useEffect(() => {
    let mounted = true;
    let source: EventSource | null = null;
    const startedAt = Date.now();

    fetch("/api/processing/status")
      .then((response) => response.json())
      .then((data) => {
        if (mounted) setStatus((current) => ({ ...current, ...data }));
      })
      .catch(() => undefined);

    if (typeof window.EventSource !== "undefined") {
      source = new EventSource("/api/github/progress");
      source.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as Partial<ProcessingStatus>;
          if (mounted) setStatus((current) => ({ ...current, ...data }));
        } catch {
          return;
        }
      };
      source.addEventListener("done", (event) => {
        try {
          const data = JSON.parse((event as MessageEvent).data) as Partial<ProcessingStatus>;
          if (mounted) setStatus((current) => ({ ...current, ...data }));
          if (source) source.close();
        } catch {
          return;
        }
      });
    }

    const timeoutId = window.setInterval(() => {
      if (!timedOut && Date.now() - startedAt > 10 * 60 * 1000) setTimedOut(true);
    }, 5000);

    return () => {
      mounted = false;
      window.clearInterval(timeoutId);
      if (source) source.close();
    };
  }, [timedOut]);

  async function retry() {
    setRetrying(true);
    const response = await fetch("/api/github/resync", { method: "POST" });
    setRetrying(false);
    if (response.ok) setStatus({ ...emptyStatus, processing: true, progress: 10, stage: "Fetching your repositories..." });
  }

  const timeline = [
    { label: `Repositories fetched${status.total ? ` (${status.total})` : ""}`, done: status.progress >= 20 },
    { label: `Project files read${doneCount ? ` (${doneCount} of ${totalCount})` : ""}`, done: status.progress >= 45 },
    { label: `AI analysis in progress (${doneCount} of ${totalCount} done)`, current: !status.processed && status.progress >= 20 && status.progress < 80 },
    { label: "Generating embeddings", done: status.progress >= 80, current: !status.processed && status.progress >= 80 },
    { label: "Saving to your profile", done: status.processed },
  ];

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-8 text-center">
      <div className="relative mx-auto h-56 w-80">
        <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-400/40 bg-indigo-500/20 shadow-[0_0_40px_rgba(99,102,241,0.35)]" />
        {Array.from({ length: 12 }, (_, index) => {
          const angle = (index / 12) * Math.PI * 2;
          const x = 145 + Math.cos(angle) * 120;
          const y = 98 + Math.sin(angle) * 78;
          const lit = index < Math.round((status.progress / 100) * 12);
          return <span key={index} className={`absolute h-3 w-3 rounded-full ${lit ? "bg-indigo-300 shadow-[0_0_18px_rgba(165,180,252,0.8)]" : "bg-zinc-700"}`} style={{ left: x, top: y }} />;
        })}
      </div>

      {status.processed ? (
        <div>
          <h1 className="text-4xl font-bold text-emerald-300">All done!</h1>
          <p className="mt-3 text-zinc-300">Your projects have been analyzed. You&apos;re ready to generate your first resume.</p>
          <Link href="/dashboard" className="mt-6 inline-flex rounded-lg bg-indigo-500 px-5 py-3 font-semibold text-white hover:bg-indigo-400">Go to Dashboard {"->"}</Link>
        </div>
      ) : (
        <div>
          <h1 className="text-4xl font-bold">Analyzing your GitHub</h1>
          <p className="mt-3 text-zinc-400">{activeRepo ? `Reading ${activeRepo}...` : status.stage}</p>
        </div>
      )}

      {status.repos.length > 0 ? (
        <div className="mx-auto grid w-full max-w-3xl gap-3 text-left md:grid-cols-2">
          {status.repos.map((repo) => (
            <div key={repo.name} className="rounded-lg border border-zinc-800 bg-[#111118] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-zinc-100">{repo.name}</p>
                  <p className="mt-1 text-sm text-zinc-500">{repo.description || "No description available on GitHub"}</p>
                </div>
                {repo.pinned ? <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-1 text-xs text-indigo-200">Pinned</span> : null}
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-400">
                {repo.language ? <span className="rounded-full border border-zinc-700 px-2 py-1">{repo.language}</span> : null}
                <span className="rounded-full border border-zinc-700 px-2 py-1">{repo.stars} stars</span>
                <span className="rounded-full border border-zinc-700 px-2 py-1">Updated {new Date(repo.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mx-auto grid w-full max-w-xl gap-3 text-left">
        {timeline.map((item) => (
          <div key={item.label} className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-[#111118] p-3 text-sm">
            {item.done ? <Check className="text-emerald-400" size={17} /> : item.current ? <RotateCw className="animate-spin text-indigo-300" size={17} /> : <Circle className="text-zinc-600" size={17} />}
            <span className={item.done ? "text-zinc-100" : item.current ? "text-indigo-200" : "text-zinc-500"}>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="mx-auto max-h-44 w-full max-w-xl overflow-hidden rounded-lg border border-zinc-800 bg-black/40 p-4 text-left font-code text-xs text-zinc-400">
        {logs.map((log, index) => <p key={log} className="py-1">{index === 0 ? "->" : "✓"} {log}</p>)}
      </div>

      {timedOut ? <p className="mx-auto max-w-xl rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">This is taking longer than expected. You can close this tab safely — we&apos;ll finish in background.</p> : null}
      {status.error || (!status.processing && !status.processed) ? (
        <div className="mx-auto grid max-w-xl gap-3">
          <p className="text-sm text-red-300">{status.error || "Processing is paused. Start it again to continue."}</p>
          <button onClick={retry} disabled={retrying} className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{retrying ? "Starting..." : "Try Again"}</button>
        </div>
      ) : null}
      <p className="text-sm text-zinc-500">This only happens once. Future resume generation is instant.</p>
    </div>
  );
}
