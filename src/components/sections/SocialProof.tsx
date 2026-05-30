"use client";

import AnimatedCounter from "@/components/ui/AnimatedCounter";
import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Arjun Sharma",
    role: "Applied for: SDE Intern @ Microsoft",
    quote:
      "I had the same resume for 6 months. One tailored version got me a call from Microsoft in 4 days. The rewritten project descriptions sounded like I actually understood what they were building.",
    metric: "First response in 4 days",
    initials: "AS",
  },
  {
    name: "Priya Mehta",
    role: "Applied for: Frontend Developer @ Razorpay",
    quote:
      "I applied to 3 fintech companies with tailored versions. Got calls from 2 of them in the same week. The ATS score feature alone was worth it - my generic resume was at 34%, the tailored one hit 91%.",
    metric: "ATS score: 34% -> 91%",
    initials: "PM",
  },
  {
    name: "Rohit Verma",
    role: "Applied for: Full Stack Intern @ Zepto",
    quote:
      "The 3-version system is what got me. I could see exactly what was being changed and why. It wasn't random - it felt like someone who understood the role had written it.",
    metric: "3 versions generated in 90 seconds",
    initials: "RV",
  },
];

export default function SocialProof() {
  return (
    <section id="results" className="bg-[var(--bg-secondary)] py-16 md:py-28">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        <p className="text-center text-[11px] uppercase tracking-[0.12em] text-[var(--accent-blue)]">REAL RESULTS</p>
        <h2 className="mx-auto mt-4 max-w-[760px] text-center font-heading text-[28px] font-bold leading-tight text-[var(--text-primary)] md:text-[42px]">
          Students getting interview calls. Not just &quot;better resumes.&quot;
        </h2>

        <div className="mt-10 grid rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] py-6 md:grid-cols-3">
          {[{ value: 2847, label: "students", sub: "this month" }, { value: 11204, label: "job applications", sub: "generated" }, { value: 89, label: "reported callbacks", sub: "within 2 weeks", suffix: "%" }].map((item, idx) => (
            <div key={item.label} className={`px-6 text-center ${idx < 2 ? "md:border-r md:border-[var(--border-subtle)]" : ""}`}>
              <p className="font-heading text-4xl font-extrabold text-[var(--text-primary)]">
                <AnimatedCounter value={item.value} suffix={item.suffix} />
              </p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{item.label}</p>
              <p className="text-sm text-[var(--text-muted)]">{item.sub}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {testimonials.map((t) => (
            <motion.article
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 transition-colors duration-200 hover:border-[var(--border-medium)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-blue-glow)] font-heading text-sm text-[var(--text-blue)]">
                    {t.initials}
                  </div>
                  <div>
                      <p className="text-[15px] font-semibold text-[var(--text-primary)]">{t.name}</p>
                      <p className="text-[13px] text-[var(--text-muted)]">{t.role}</p>
                  </div>
                </div>
                  <span className="rounded-full border border-[rgba(34,197,94,0.2)] bg-[rgba(34,197,94,0.1)] px-3 py-1 text-xs text-[var(--accent-green)]">
                  ✓ Got Interview Call
                </span>
              </div>
                <p className="mt-4 text-[15px] italic leading-[1.7] text-[var(--text-secondary)]">{t.quote}</p>
                <p className="mt-5 border-t border-[var(--border-subtle)] pt-4 text-sm text-[var(--text-muted)]">
                  <span className="text-[var(--text-primary)]">{t.metric}</span>
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
