"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProcessingClient() {
  const router = useRouter();
  const [status, setStatus] = useState({
    processed: false,
    processing: false,
    stage: "Preparing...",
    progress: 0,
    error: "",
  });
  const [retrying, setRetrying] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const startedAt = Date.now();
    const id = window.setInterval(async () => {
      const response = await fetch("/api/processing/status");
      const data = await response.json();
      setStatus(data);
      if (data.processed) router.push("/dashboard");
      if (!timedOut && Date.now() - startedAt > 10 * 60 * 1000) setTimedOut(true);
    }, 2000);
    return () => window.clearInterval(id);
  }, [router, timedOut]);

  async function retry() {
    setRetrying(true);
    const response = await fetch("/api/github/resync", { method: "POST" });
    setRetrying(false);
    if (response.ok) {
      setStatus({
        processed: false,
        processing: true,
        stage: "Fetching your repositories...",
        progress: 10,
        error: "",
      });
    }
  }

  return (
    <div className="mx-auto max-w-xl rounded border border-zinc-800 bg-zinc-950 p-6">
      <h1 className="text-2xl font-bold">We&apos;re analyzing your GitHub profile.</h1>
      <p className="mt-2 text-zinc-300">You only need to do this once. Future resumes will be instant.</p>
      <div className="mt-6 h-3 overflow-hidden rounded bg-zinc-800">
        <div className="h-full bg-blue-500" style={{ width: `${status.progress}%` }} />
      </div>
      <p className="mt-4 text-sm text-zinc-200">{status.stage}</p>
      <p className="mt-1 text-xs text-zinc-500">Estimated time remaining: a few minutes</p>
      {timedOut ? (
        <p className="mt-3 rounded border border-amber-700 bg-amber-950 p-3 text-sm text-amber-200">
          This is taking longer than expected. You can leave this page and try re-syncing again later.
        </p>
      ) : null}
      {status.error || (!status.processing && !status.processed) ? (
        <div className="mt-4 grid gap-3">
          <p className="text-sm text-red-300">
            {status.error || "Processing is paused. Start it again to continue."}
          </p>
          <button
            onClick={retry}
            disabled={retrying}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {retrying ? "Starting..." : "Try Again"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
