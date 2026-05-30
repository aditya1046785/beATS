"use client";

import Button from "@/components/ui/Button";
import AtsScoreBadge from "@/components/ui/AtsScoreBadge";
import { Github } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type TabKey = "technical" | "impact" | "ats";

const loadingSteps = [
  "Fetching your GitHub repositories...",
  "Reading project descriptions and READMEs...",
  "Matching your work to the role requirements...",
  "Generating tailored versions...",
];

const tabContent: Record<TabKey, { title: string; entries: { name: string; text: string }[] }> = {
  technical: {
    title: "Technical Depth",
    entries: [
      {
        name: "Realtime Dashboard",
        text: "Engineered a React dashboard with batched fetch pipelines and optimized render paths for high-frequency UI updates.",
      },
      {
        name: "Event Analytics API",
        text: "Built a Node.js service with JWT auth, role-based guards, and resilient queue-backed ingestion patterns.",
      },
      {
        name: "Search Index Worker",
        text: "Designed asynchronous workers with retry-safe jobs and\nperformance profiling for backend data pipelines.",
      },
    ],
  },
  impact: {
    title: "Impact Focus",
    entries: [
      {
        name: "Realtime Dashboard",
        text: "Reduced dashboard refresh latency by 43% and improved engagement by simplifying high-volume data interactions.",
      },
      {
        name: "Event Analytics API",
        text: "Cut authentication-related failures by introducing structured role-based access and better token hygiene.",
      },
      {
        name: "Search Index Worker",
        text: "Improved report generation speed by 2.1x through async pipelines and targeted cache invalidation.",
      },
    ],
  },
  ats: {
    title: "ATS Optimized",
    entries: [
      {
        name: "Realtime Dashboard",
        text: "Implemented a \"WebSocket-based\" UI layer with \"event-driven architecture\" for low-latency frontend delivery.",
      },
      {
        name: "Event Analytics API",
        text: "Built scalable \"REST API\" services with \"JWT authentication\" and \"role-based access control\".",
      },
      {
        name: "Search Index Worker",
        text: "Delivered backend processing flows aligned with \"distributed systems\" and \"performance optimization\" goals.",
      },
    ],
  },
};

function highlightTerms(text: string) {
  return text.split("\"").map((part, idx) =>
    idx % 2 === 1 ? (
      <span
        key={`${part}-${idx}`}
        className="rounded bg-[rgba(59,130,246,0.15)] px-1 py-0.5 text-[#60A5FA]"
      >
        {part}
      </span>
    ) : (
      <span key={`${part}-${idx}`}>{part}</span>
    ),
  );
}

export default function LiveDemo() {
  const [github, setGithub] = useState("");
  const [jd, setJd] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("technical");

  const totalDuration = useMemo(() => loadingSteps.length * 1800, []);

  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setStepIdx((prev) => {
        if (prev >= loadingSteps.length - 1) {
          clearInterval(interval);
          setTimeout(() => {
            setIsLoading(false);
            setShowResult(true);
          }, 1200);
          return prev;
        }
        return prev + 1;
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [isLoading]);

  const onGenerate = () => {
    setShowResult(false);
    setIsLoading(true);
    setStepIdx(0);
  };

  const progress = isLoading ? ((stepIdx + 1) / loadingSteps.length) * 100 : 0;

  return (
    <section id="try-demo" className="bg-[var(--bg-primary)] py-16 md:py-28">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        <h2 className="text-center font-heading text-[28px] font-extrabold leading-tight text-[var(--text-primary)] md:text-[48px]">
          Try it right now.
          <br />
          <span className="text-[var(--text-muted)]">No account needed.</span>
        </h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mx-auto mt-12 max-w-4xl rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5 shadow-[0_0_80px_rgba(59,130,246,0.05)] md:p-8"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-[var(--text-secondary)]">GitHub Username</label>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 focus-within:border-[rgba(59,130,246,0.5)] focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.08)]">
                <Github size={16} className="text-[var(--text-muted)]" />
                <input
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="e.g. torvalds"
                  className="w-full bg-transparent text-[15px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm text-[var(--text-secondary)]">Job Description</label>
              <textarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="Paste full JD here - role title, requirements, company name, responsibilities..."
                className="min-h-[120px] w-full resize-none rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 text-[15px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] focus:border-[rgba(59,130,246,0.5)] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.08)]"
              />
            </div>
          </div>

          <div className="mt-6">
            <Button variant="primary" fullWidth className="h-[52px] text-base" onClick={onGenerate} disabled={isLoading}>
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                  Analyzing your projects...
                </span>
              ) : (
                "✦  Generate My Tailored Resume"
              )}
            </Button>

            {isLoading && (
              <div className="mt-4">
                <p className="text-center text-sm text-[var(--text-muted)]">{loadingSteps[stepIdx]}</p>
                <div className="mt-2 h-0.5 rounded-full bg-[var(--bg-card-hover)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent-blue)] transition-all duration-500"
                    style={{ width: `${progress}%`, transitionDuration: `${totalDuration / 10}ms` }}
                  />
                </div>
              </div>
            )}
          </div>

          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="mt-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[15px] text-[var(--text-primary)]">Resume for Google - SDE Intern</p>
                <AtsScoreBadge score={91} />
              </div>

              <div className="mt-4 flex gap-4 border-b border-[#1E1E1E] pb-2 text-sm">
                {([
                  ["technical", "Technical Depth"],
                  ["impact", "Impact Focus"],
                  ["ats", "ATS Optimized"],
                ] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`border-b pb-2 transition-colors ${
                      activeTab === key
                        ? "border-[var(--accent-blue)] text-[var(--text-blue)]"
                        : "border-transparent text-[var(--text-muted)]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="mt-4 space-y-4">
                {tabContent[activeTab].entries.map((entry) => (
                  <div key={entry.name}>
                    <p className="font-heading text-sm font-semibold text-[var(--text-primary)]">{entry.name}</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{highlightTerms(entry.text)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-4">
                <p className="text-sm text-[var(--text-muted)]">3 versions generated</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="primary" size="sm" href="/auth/github">
                    Download PDF
                  </Button>
                  <Button variant="ghost" size="sm" href="/auth/github">
                    Edit & Export
                  </Button>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card-hover)] p-3 text-sm">
                <p className="text-[var(--text-muted)]">Get full access - enter email to download</p>
                <div className="mt-2 flex gap-2">
                  <input
                    placeholder="Email address"
                    className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
                  />
                  <Button variant="primary" size="sm" href="/auth/github">
                    Send -&gt;
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
