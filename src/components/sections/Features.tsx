"use client";

import { motion } from "framer-motion";

const featureRows = [
  {
    id: "f1",
    label: "SMART PROJECT SELECTION",
    title: "Not all your projects matter for every role.",
    body: "beATS reads the job description and scores each of your GitHub projects for relevance. Frontend role? It surfaces your React projects. Backend role? Your API and database work. You never have to guess what to include.",
    reverse: false,
  },
  {
    id: "f2",
    label: "ATS KEYWORD OPTIMIZATION",
    title: "Your projects are good. The words you use to describe them might not be.",
    body: "Most resume tools add random keywords. We analyze what the specific recruiter at the specific company actually looks for - based on their job description - and rewrite your experience using that exact language. Specific, not generic.",
    reverse: true,
  },
  {
    id: "f3",
    label: "THREE TAILORED VERSIONS",
    title: "One set of experience. Three strategic resumes.",
    body: "Different hiring managers look for different things. The technical lead wants to see depth. The HR screen wants ATS keywords. The startup wants impact and velocity. You get all three - generated simultaneously.",
    reverse: false,
  },
];

function FeatureVisual({ id }: { id: string }) {
  if (id === "f1") {
    const bars = [
      ["weather-dashboard", 82, "var(--accent-green)"],
      ["portfolio-website", 41, "var(--accent-orange)"],
      ["express-rest-api", 91, "var(--accent-green)"],
      ["todo-app-crud", 24, "var(--accent-orange)"],
    ] as const;
    return (
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
        <div className="space-y-4">
          {bars.map(([name, score, color]) => (
            <div key={name}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-[var(--text-secondary)]">{name}</span>
                <span style={{ color: color as string }}>{score}%</span>
              </div>
              <div className="h-1 rounded-full bg-[var(--bg-card-hover)]">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${score}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: color }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 inline-flex rounded-full border border-[var(--border-blue)] bg-[var(--accent-blue-glow)] px-3 py-1 text-xs text-[var(--text-blue)]">
          Selected for: Google SDE Intern
        </div>
      </div>
    );
  }

  if (id === "f2") {
    return (
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Original text</p>
            <p className="mt-2 text-sm leading-6 text-[var(--accent-orange)]/70 line-through">
              Built a chat app with real-time features
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">After optimization</p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Engineered a <span className="rounded bg-[var(--accent-blue-glow)] px-1.5 py-0.5 text-[var(--text-blue)]">WebSocket-based</span> messaging system with <span className="rounded bg-[var(--accent-blue-glow)] px-1.5 py-0.5 text-[var(--text-blue)]">sub-100ms latency</span>, leveraging <span className="rounded bg-[var(--accent-blue-glow)] px-1.5 py-0.5 text-[var(--text-blue)]">event-driven architecture</span> patterns.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-56">
      <div className="absolute left-6 top-8 h-40 w-64 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 opacity-60">
        <p className="text-xs text-[var(--text-secondary)]">Technical Depth</p>
      </div>
      <div className="absolute left-10 top-5 h-40 w-64 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 opacity-80">
        <p className="text-xs text-[var(--text-secondary)]">Impact Focus</p>
      </div>
      <div className="absolute left-14 top-2 h-40 w-64 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-[var(--text-secondary)]">ATS Optimized</p>
          <span className="rounded-full border border-[rgba(34,197,94,0.2)] bg-[rgba(34,197,94,0.1)] px-2 py-0.5 text-[11px] text-[var(--accent-green)]">
            96%
          </span>
        </div>
        <div className="mt-3 space-y-2">
          <div className="h-2 w-full rounded bg-[var(--bg-card-hover)]" />
          <div className="h-2 w-4/5 rounded bg-[var(--bg-card-hover)]" />
          <div className="h-2 w-3/5 rounded bg-[var(--bg-card-hover)]" />
        </div>
      </div>
    </div>
  );
}

export default function Features() {
  return (
    <section id="features" className="bg-[var(--bg-primary)] py-16 md:py-28">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        <p className="text-center text-[11px] uppercase tracking-[0.12em] text-[var(--accent-blue)]">
          WHAT MAKES THIS DIFFERENT
        </p>
        <h2 className="mx-auto mt-4 max-w-[700px] text-center font-heading text-[28px] font-bold leading-tight text-[var(--text-primary)] md:text-[42px]">
          Not just keywords. Actually understands your work.
        </h2>

        <div className="mt-14 space-y-14">
          {featureRows.map((row) => (
            <motion.article
              key={row.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={`grid items-center gap-8 ${row.reverse ? "lg:grid-cols-[55%_45%]" : "lg:grid-cols-[45%_55%]"}`}
            >
              <div className={`${row.reverse ? "lg:order-2" : ""}`}>
                <p className="text-[11px] uppercase tracking-[0.1em] text-[var(--accent-blue)]">{row.label}</p>
                <h3 className="mt-3 font-heading text-3xl font-semibold leading-tight text-[var(--text-primary)]">
                  {row.title}
                </h3>
                <p className="mt-4 text-base leading-[1.7] text-[var(--text-secondary)]">{row.body}</p>
              </div>
              <div className={`${row.reverse ? "lg:order-1" : ""}`}>
                <FeatureVisual id={row.id} />
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
