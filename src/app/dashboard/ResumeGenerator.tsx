"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function ResumeGenerator({ initialJd = "" }: { initialJd?: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const jd = String(new FormData(event.currentTarget).get("jd") || "");
    if (jd.trim().split(/\s+/).length < 100) {
      setError("This job description is quite short. For better results, try pasting a more detailed JD.");
    }
    const response = await fetch("/api/resumes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jd }),
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
    <form onSubmit={submit} className="grid gap-4 rounded border border-blue-900 bg-zinc-950 p-5">
      <textarea
        name="jd"
        required
        rows={10}
        placeholder="Paste the Job Description here..."
        defaultValue={initialJd}
        className="min-h-56 rounded border border-zinc-800 bg-black p-4 text-sm text-white outline-none focus:border-blue-500"
      />
      {error ? <p className="text-sm text-amber-300">{error}</p> : null}
      <button disabled={loading} className="rounded bg-blue-600 px-4 py-3 font-semibold text-white disabled:opacity-60">
        {loading ? "Generating..." : "Generate Resume"}
      </button>
    </form>
  );
}
