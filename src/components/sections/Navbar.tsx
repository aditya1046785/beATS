"use client";

import Button from "@/components/ui/Button";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const navLinks = [
  { label: "How it Works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`fixed top-0 z-50 h-16 w-full border-b transition-all duration-200 ${
        scrolled ? "border-[var(--border-subtle)]" : "border-transparent"
      }`}
      style={scrolled ? { background: 'var(--navbar-bg)', backdropFilter: 'blur(12px)' } : undefined}
    >
      <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between px-6 md:px-10">
        <a href="#" className="inline-flex items-start gap-1 font-heading text-lg font-bold">
          <span className="text-[var(--text-secondary)]">be</span>
          <span className="text-[var(--text-primary)]">ATS</span>
          <span className="rounded bg-[rgba(59,130,246,0.15)] px-1.5 py-0.5 text-[10px] leading-none text-[var(--text-blue)]">
            AI
          </span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-[#666666] transition-colors duration-150 hover:text-[#F0F0F0]"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="hidden md:block">
            <Button variant="ghost" size="sm" href="/auth/github" className="text-[var(--text-muted)]">
              Sign in
            </Button>
          </div>
          <Button variant="primary" size="sm" href="/auth/github">
            Try Free -&gt;
          </Button>
        </div>
      </div>
    </motion.nav>
  );
}
