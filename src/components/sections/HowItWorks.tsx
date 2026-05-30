"use client";

import { motion } from "framer-motion";

const steps = [
  {
    number: "1",
    subtitle: "STEP 01",
    title: "Connect your GitHub",
    body: "Paste your GitHub username. We fetch your public repositories, README files, and project descriptions automatically - no manual entry needed.",
    why: "We read what you've already built - no new writing required from you.",
  },
  {
    number: "2",
    subtitle: "STEP 02",
    title: "Paste the job description",
    body: "Copy-paste the full JD from LinkedIn, Naukri, or anywhere. Include the role, company, and requirements - the more specific, the better we tailor.",
    why: "AI needs context. More detail = more precise match.",
  },
  {
    number: "3",
    subtitle: "STEP 03",
    title: "Get 3 tailored versions",
    body: "Receive three resume variations: one highlighting technical depth, one emphasizing impact and outcomes, one optimized purely for ATS keyword matching.",
    why: "Different companies scan resumes differently. Three versions = three chances.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-[var(--bg-secondary)] py-16 md:py-28">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center text-[11px] uppercase tracking-[0.12em] text-[var(--accent-blue)]"
        >
          PROCESS
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          className="mx-auto mt-4 max-w-[600px] text-center font-heading text-[26px] font-bold leading-tight text-[var(--text-primary)] md:text-[42px]"
        >
          From GitHub to interview-ready in three steps.
        </motion.h2>

        <div className="relative mt-12">
          <div className="absolute left-0 right-0 top-8 hidden border-t border-dashed border-[var(--border-subtle)] lg:block" />
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
            }}
            className="grid gap-6 lg:grid-cols-3"
          >
            {steps.map((step) => (
              <motion.article
                key={step.number}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 transition-all duration-200 hover:-translate-y-1 hover:border-[var(--border-medium)]"
              >
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(59,130,246,0.25)] bg-[rgba(59,130,246,0.1)]">
                  <span className="font-heading text-base font-bold text-[var(--accent-blue)]">{step.number}</span>
                </div>

                <p className="mb-2 text-[11px] uppercase tracking-[0.1em] text-[var(--accent-blue)]">{step.subtitle}</p>
                <h3 className="mb-3 font-heading text-xl font-semibold text-[var(--text-primary)]">{step.title}</h3>
                <p className="text-[15px] leading-[1.7] text-[var(--text-secondary)]">{step.body}</p>
                <p className="mt-4 border-t border-[var(--bg-card-hover)] pt-4 text-sm text-[var(--text-secondary)]">{step.why}</p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
