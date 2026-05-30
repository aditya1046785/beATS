"use client";

import { motion } from "framer-motion";

export default function ProblemSection() {
  return (
    <section id="problem" className="bg-[var(--bg-primary)] py-16 md:py-24">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
        className="mx-auto max-w-4xl px-6 text-center md:px-10"
      >
        <motion.h2
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="font-heading text-[26px] font-bold leading-tight text-[var(--text-primary)] md:text-[42px]"
        >
          Most students send the same resume to 20 companies.
          <br />
          Recruiters can tell in under <span className="text-[var(--accent-orange)]">6 seconds.</span>
        </motion.h2>

        <motion.p
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mx-auto mt-6 max-w-[560px] text-base leading-[1.7] text-[var(--text-secondary)] md:text-lg"
        >
          A resume built for &quot;any company&quot; is built for no company. The recruiters who matter are
          looking for candidates who understood the role before applying.
        </motion.p>

        <div className="mt-10 grid gap-6 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="space-y-4"
          >
            <svg viewBox="0 0 320 180" className="h-auto w-full opacity-60 blur-[1px]">
              <g fill="var(--bg-card-hover)" stroke="var(--border-medium)">
                <rect x="24" y="42" width="110" height="130" rx="8" />
                <rect x="40" y="56" width="68" height="6" rx="3" fill="var(--border-medium)" />
                <rect x="40" y="72" width="84" height="4" rx="2" fill="var(--border-medium)" />
                <rect x="150" y="20" width="90" height="110" rx="8" opacity="0.75" />
                <rect x="190" y="52" width="90" height="110" rx="8" opacity="0.6" />
                <rect x="110" y="18" width="90" height="110" rx="8" opacity="0.65" />
                <rect x="220" y="26" width="84" height="100" rx="8" opacity="0.45" />
              </g>
            </svg>
            <p className="text-sm text-[#F97316]">Generic Resume x 20 companies</p>
          </motion.div>

          <div className="hidden h-40 border-r border-[var(--border-subtle)] md:block" />

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
            className="space-y-4"
          >
            <svg viewBox="0 0 320 180" className="h-auto w-full">
              <g fill="var(--bg-card)" stroke="var(--border-medium)">
                <rect x="96" y="20" width="130" height="150" rx="10" />
                <rect x="116" y="46" width="80" height="8" rx="4" fill="var(--accent-blue)" opacity="0.7" />
                <rect x="116" y="68" width="90" height="5" rx="3" fill="var(--border-medium)" />
                <rect x="116" y="84" width="82" height="5" rx="3" fill="var(--border-medium)" />
                <rect x="116" y="100" width="88" height="5" rx="3" fill="var(--border-medium)" />
              </g>
            </svg>
            <p className="text-sm text-[var(--accent-green)]">Tailored Resume x Target Role</p>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
