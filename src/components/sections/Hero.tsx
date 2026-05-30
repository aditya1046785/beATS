"use client";

import Button from "@/components/ui/Button";
import AtsScoreBadge from "@/components/ui/AtsScoreBadge";
import GradientText from "@/components/ui/GradientText";
import TypewriterText from "@/components/ui/TypewriterText";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

const rowOneAfter =
  "Engineered a real-time weather dashboard in React - optimizing API call batching and state management patterns aligned with Google's frontend infra scale requirements.";
const rowTwoAfter =
  "Built a production-grade REST API in Node.js with JWT auth and role-based access control - directly applicable to Google SDE L3 backend service architecture.";

export default function Hero() {
  const [cycle, setCycle] = useState(0);
  const [fading, setFading] = useState(false);

  const rowOneDuration = useMemo(() => rowOneAfter.length * 40, []);
  const rowTwoDelay = useMemo(() => 1500 + rowOneDuration + 800, [rowOneDuration]);
  const fullCycleDelay = useMemo(
    () => 1500 + rowOneDuration + 800 + rowTwoAfter.length * 40 + 4000,
    [rowOneDuration],
  );

  useEffect(() => {
    const timer = setTimeout(() => setFading(true), fullCycleDelay);
    const restart = setTimeout(() => {
      setFading(false);
      setCycle((prev) => prev + 1);
    }, fullCycleDelay + 600);

    return () => {
      clearTimeout(timer);
      clearTimeout(restart);
    };
  }, [fullCycleDelay, cycle]);

  return (
    <section
      className="relative min-h-screen overflow-hidden pt-28"
      style={{
        background: `radial-gradient(circle 700px at 40% 50%, var(--hero-glow) 0%, transparent 70%), var(--bg-primary)`,
      }}
    >
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-16 md:px-10 lg:grid-cols-[55%_45%] lg:py-24">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } },
          }}
          className="flex flex-col"
        >
          <motion.div
            variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-[rgba(59,130,246,0.2)] bg-[var(--bg-card)] px-4 py-1.5"
          >
            <span className="text-xs text-[var(--accent-blue)]">●</span>
            <p className="text-xs text-[var(--text-muted)]">
              Built for CS students <span className="text-[var(--text-secondary)]">serious about placement</span>
            </p>
          </motion.div>

          <motion.h1
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
            className="mt-6 font-heading text-4xl font-extrabold leading-[1.1] text-[var(--text-primary)] md:text-6xl"
          >
            Every job is different.
          </motion.h1>
          <motion.h1
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
            className="font-heading text-4xl font-extrabold leading-[1.1] md:text-6xl"
          >
            <GradientText>Your resume should be too.</GradientText>
          </motion.h1>

          <motion.p
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
            className="mt-6 max-w-[480px] text-base leading-[1.7] text-[var(--text-secondary)] md:text-lg"
          >
            Paste any job description. We analyze your GitHub projects and rewrite them to match
            the role - so every resume you send feels built specifically for that position.
          </motion.p>

          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.4 }}
            className="mt-8 flex flex-wrap gap-4"
          >
            <Button href="/auth/github" variant="primary" glow>
              Build My Tailored Resume -&gt;
            </Button>
            <Button href="#how-it-works" variant="ghost">
              See How It Works
            </Button>
          </motion.div>

          <motion.p
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.5 }}
            className="mt-4 text-sm text-[#444444]"
          >
            No credit card required <span className="text-[#333333]">·</span> Takes under 2
            minutes <span className="text-[#333333]">·</span> Free to try
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
          className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5 shadow-[0_0_60px_rgba(59,130,246,0.06),0_0_0_1px_rgba(255,255,255,0.04)]"
        >
          <div className="mb-4 flex items-center justify-between border-b border-[var(--bg-card-hover)] pb-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
            </div>
            <div className="rounded-full border border-[var(--border-medium)] bg-[var(--bg-card-hover)] px-3 py-1 text-xs text-[var(--text-muted)]">
              resume_google_sde.pdf
            </div>
            <AtsScoreBadge score={94} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="border-r border-[var(--bg-card-hover)] pr-4">
              <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-secondary)]">Before</p>
              <p className="mt-3 text-[13px] italic leading-6 text-[var(--text-muted)]">
                &quot;Built a weather app using React&quot;
              </p>
              <p className="mt-5 text-[13px] italic leading-6 text-[var(--text-muted)]">
                &quot;Made a CRUD app with Node.js&quot;
              </p>
            </div>

            <div className={`transition-opacity duration-500 ${fading ? "opacity-0" : "opacity-100"}`}>
              <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--accent-blue)]">After ✦</p>
              <div key={`one-${cycle}`} className="mt-3 text-[13px] leading-6 text-[#D4E4FF]">
                <TypewriterText text={rowOneAfter} speed={40} startDelay={1500} />
              </div>
              <div key={`two-${cycle}`} className="mt-5 text-[13px] leading-6 text-[#D4E4FF]">
                <TypewriterText text={rowTwoAfter} speed={40} startDelay={rowTwoDelay} />
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3 border-t border-[var(--bg-card-hover)] pt-4 text-xs">
            <span className="text-[var(--text-secondary)]">Tailored for:</span>
            <span className="rounded-full border border-[rgba(59,130,246,0.25)] bg-[var(--accent-blue-glow)] px-3 py-1 text-[var(--text-blue)]">
              Google - SDE Intern 2025
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
