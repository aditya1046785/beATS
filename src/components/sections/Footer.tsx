import Link from "next/link";
import { Github, Linkedin, Twitter } from "lucide-react";

const productLinks = [
  { label: "How it Works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Try Now", href: "/auth/github" },
];

const connectLinks = [
  { label: "GitHub", href: "#", icon: Github },
  { label: "LinkedIn", href: "#", icon: Linkedin },
  { label: "Twitter/X", href: "#", icon: Twitter },
];

export default function Footer() {
  return (
    <footer className="border-t border-[#111111] bg-[#080808] py-12">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <div className="inline-flex items-start gap-1 font-heading text-lg font-bold">
              <span className="text-[#A0A0A0]">Position</span>
              <span className="text-[#F0F0F0]">Perfect</span>
              <span className="rounded bg-[rgba(59,130,246,0.15)] px-1.5 py-0.5 text-[10px] leading-none text-[#60A5FA]">
                AI
              </span>
            </div>
            <p className="mt-2 max-w-[220px] text-sm text-[#555555]">
              Built for students who are serious about placement.
            </p>
            <p className="mt-3 text-[13px] text-[#3A3A3A]">
              Made by a BTech student who faced the same problem.
            </p>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.1em] text-[#444444]">PRODUCT</p>
            <div className="mt-3 flex flex-col gap-2">
              {productLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-[#666666] transition-colors duration-150 hover:text-[#F0F0F0]"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.1em] text-[#444444]">CONNECT</p>
            <div className="mt-3 flex flex-col gap-2">
              {connectLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    className="inline-flex items-center gap-2 text-sm text-[#666666] transition-colors duration-150 hover:text-[#F0F0F0]"
                  >
                    <Icon size={14} />
                    {link.label}
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col justify-between gap-3 border-t border-[#111111] pt-6 text-[13px] text-[#333333] md:flex-row">
          <p>© 2025 PositionPerfect AI. All rights reserved.</p>
          <p>
            <Link href="/privacy-policy" className="transition-colors duration-150 hover:text-[#F0F0F0]">
              Privacy Policy
            </Link>{" "}
            ·{" "}
            <Link href="/terms-of-service" className="transition-colors duration-150 hover:text-[#F0F0F0]">
              Terms of Service
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
