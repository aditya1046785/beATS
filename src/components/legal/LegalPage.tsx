import Link from "next/link";
import type { ReactNode } from "react";

type Section = {
  id: string;
  title: string;
  content: ReactNode;
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  lastUpdated: string;
  sections: Section[];
};

export default function LegalPage({
  eyebrow,
  title,
  intro,
  lastUpdated,
  sections,
}: LegalPageProps) {
  return (
    <main className="min-h-screen bg-[#050508] text-[#F1F1F8]">
      <section className="relative overflow-hidden border-b border-[rgba(139,92,246,0.12)]">
        <div className="absolute inset-x-0 top-[-180px] h-[420px] bg-[radial-gradient(circle_at_top,rgba(109,40,217,0.22),transparent_62%)]" />
        <div className="absolute bottom-[-140px] right-[-80px] h-[300px] w-[300px] bg-[radial-gradient(circle,rgba(99,102,241,0.12),transparent_68%)]" />

        <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-8 md:px-10 md:pb-24 md:pt-10">
          <div className="mb-10 flex items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1 font-['Space_Grotesk'] text-lg font-bold tracking-[-0.02em]"
            >
              <span className="text-[#55556E]">Position</span>
              <span className="text-[#F1F1F8]">Perfect</span>
              <span className="rounded border border-[rgba(139,92,246,0.32)] bg-[rgba(139,92,246,0.12)] px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-[#C4B5FD]">
                AI
              </span>
            </Link>

            <div className="hidden items-center gap-3 text-sm text-[#9999B8] md:flex">
              <Link href="/privacy-policy" className="transition-colors hover:text-white">
                Privacy
              </Link>
              <Link href="/terms-of-service" className="transition-colors hover:text-white">
                Terms
              </Link>
              <Link
                href="/auth/github"
                className="rounded-xl border border-[rgba(139,92,246,0.28)] bg-[linear-gradient(135deg,#7C3AED,#6D28D9)] px-4 py-2 font-medium text-white shadow-[0_10px_30px_rgba(109,40,217,0.28)] transition-transform hover:-translate-y-0.5"
              >
                Start Building
              </Link>
            </div>
          </div>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-16">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C4B5FD]">
                {eyebrow}
              </p>
              <h1 className="mt-5 font-['Space_Grotesk'] text-4xl font-extrabold leading-none tracking-[-0.04em] text-white sm:text-5xl md:text-6xl">
                {title}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-[#9999B8] sm:text-lg">
                {intro}
              </p>

              <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-[rgba(139,92,246,0.18)] bg-[rgba(11,11,20,0.8)] px-4 py-2 text-sm text-[#C4B5FD]">
                <span className="h-2 w-2 rounded-full bg-[#10B981]" />
                Last updated: {lastUpdated}
              </div>
            </div>

            <aside className="rounded-[28px] border border-[rgba(139,92,246,0.14)] bg-[rgba(11,11,20,0.78)] p-6 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C4B5FD]">
                On This Page
              </p>
              <div className="mt-5 flex flex-col gap-3">
                {sections.map((section, index) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="group rounded-2xl border border-transparent px-3 py-3 transition hover:border-[rgba(139,92,246,0.18)] hover:bg-[rgba(139,92,246,0.06)]"
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#55556E]">
                      Section {String(index + 1).padStart(2, "0")}
                    </div>
                    <div className="mt-1 text-sm text-[#F1F1F8] transition group-hover:text-white">
                      {section.title}
                    </div>
                  </a>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
        <div className="grid gap-6">
          {sections.map((section, index) => (
            <article
              id={section.id}
              key={section.id}
              className="rounded-[28px] border border-[rgba(139,92,246,0.12)] bg-[linear-gradient(180deg,rgba(15,15,26,0.96),rgba(11,11,20,0.9))] p-7 shadow-[0_20px_60px_rgba(0,0,0,0.22)] md:p-9"
            >
              <div className="mb-5 flex items-center gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(139,92,246,0.2)] bg-[rgba(139,92,246,0.1)] font-['JetBrains_Mono'] text-sm text-[#C4B5FD]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h2 className="font-['Space_Grotesk'] text-2xl font-bold tracking-[-0.03em] text-white">
                  {section.title}
                </h2>
              </div>
              <div className="legal-rich text-[15px] leading-8 text-[#C9C9DA]">{section.content}</div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
