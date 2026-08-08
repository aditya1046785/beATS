"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

const loadingSteps = ["Analyzing JD...", "Selecting projects...", "Writing resume..."];

export default function ResumeGenerator({ initialJd = "" }: { initialJd?: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [jd, setJd] = useState(initialJd);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wordCount = jd.trim() ? jd.trim().split(/\s+/).length : 0;

  useEffect(() => {
    if (!loading) return;
    const id = window.setInterval(() => setLoadingIndex((current) => (current + 1) % loadingSteps.length), 2000);
    return () => window.clearInterval(id);
  }, [loading]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.max(textarea.scrollHeight, 160)}px`;
  }, [jd]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const formJd = String(new FormData(event.currentTarget).get("jd") || "");
    if (formJd.trim().split(/\s+/).length < 50) {
      setError("This job description is quite short. For better results, try pasting a more detailed JD.");
    }
    const response = await fetch("/api/resumes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jd: formJd }),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(data.error || "Something went wrong. Please try again.");
      return;
    }
    router.push(`/resume/${data.id}`);
  }

  return (
    <form onSubmit={submit} className="grid gap-5 rounded-lg border border-indigo-500/20 bg-indigo-500/[0.04] p-6 shadow-2xl shadow-indigo-950/20">
      <div>
        <label htmlFor="jd" className="text-lg font-semibold text-zinc-50">Paste a Job Description</label>
        <div className="relative mt-3">
          <textarea
            ref={textareaRef}
            id="jd"
            name="jd"
            required
            rows={6}
            placeholder="Drop your JD here and we'll build a resume tailored exactly for it."
            value={jd}
            onChange={(event) => setJd(event.target.value)}
            className="min-h-40 w-full resize-none rounded-lg border border-zinc-800 bg-[#0a0a0f] p-4 pb-10 text-sm leading-6 text-white outline-none placeholder:text-zinc-600 focus:border-indigo-500 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.12)]"
          />
          <span className="font-code absolute bottom-3 right-3 text-xs text-zinc-500">{jd.length} chars</span>
        </div>
        {wordCount > 0 && wordCount < 50 ? (
          <p className="mt-2 text-sm text-amber-300">This seems short — a detailed JD gives better results.</p>
        ) : null}
      </div>
      {error ? <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">{error}</p> : null}
      <button disabled={loading} className={`justify-self-center rounded-lg bg-indigo-500 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-950/30 hover:-translate-y-0.5 hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-70 ${loading ? "shimmer" : ""}`}>
        {loading ? loadingSteps[loadingIndex] : "Generate Resume ->"}
      </button>
    </form>
  );
}
