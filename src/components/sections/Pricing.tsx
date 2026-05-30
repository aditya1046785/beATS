import Button from "@/components/ui/Button";
import { Lock } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "₹0",
    subtext: "forever free",
    features: [
      "GitHub analysis (5 repos)",
      "ATS compatibility score",
      "Project relevance ranking",
      "Resume generation",
    ],
    cta: "Get Started Free",
    variant: "ghost" as const,
    mutedLast: true,
  },
  {
    name: "PositionPerfect",
    price: "₹199",
    subtext: "one-time, per position",
    oldPrice: "₹499",
    features: [
      "Everything in Starter",
      "3 tailored resume versions",
      "Full project rewriting",
      "Role-specific keyword injection",
      "PDF + DOCX download",
      "24-hour result delivery guarantee",
    ],
    cta: "Build My Resume ->",
    variant: "primary" as const,
    highlighted: true,
  },
  {
    name: "Unlimited",
    price: "₹399",
    subtext: "one-time, lifetime access",
    features: [
      "Everything in PositionPerfect",
      "Unlimited positions (no per-use charge)",
      "Priority processing (< 10 minutes)",
      "Cover letter generation",
      "Lifetime updates",
    ],
    cta: "Get Unlimited Access",
    variant: "ghost" as const,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="bg-[var(--bg-primary)] py-16 md:py-28">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        <h2 className="text-center font-heading text-[28px] font-bold leading-tight text-[var(--text-primary)] md:text-[42px]">
          Pay once. Use forever.
          <br />
          <span className="text-[var(--accent-blue)]">No subscriptions.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-[480px] text-center text-base text-[var(--text-muted)]">
          Students already spend enough. One interview call pays this back ten times over.
        </p>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`relative rounded-2xl border p-6 ${
                  plan.highlighted
                    ? "border-[var(--border-blue)] bg-[var(--bg-card)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-card)]"
                }`}
            >
              {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--accent-blue)] px-4 py-1 text-[11px] uppercase tracking-[0.1em] text-white">
                  MOST POPULAR
                </span>
              )}
                <h3 className="font-heading text-xl font-semibold text-[var(--text-primary)]">{plan.name}</h3>
                <p className={`mt-3 font-heading font-bold text-[var(--text-primary)] ${plan.highlighted ? "text-5xl" : "text-4xl"}`}>
                {plan.price}
              </p>
                <p className={`text-sm ${plan.highlighted ? "text-[var(--text-blue)]" : "text-[var(--text-muted)]"}`}>
                {plan.subtext}
              </p>
                {plan.oldPrice && <p className="mt-1 text-sm text-[var(--text-muted)] line-through">{plan.oldPrice}</p>}

              <ul className="mt-6 space-y-2 text-sm">
                {plan.features.map((feature, idx) => {
                  const muted = plan.mutedLast && idx === plan.features.length - 1;
                  return (
                    <li key={feature} className={muted ? "text-[var(--text-muted)] line-through" : "text-[var(--text-secondary)]"}>
                      {muted ? "✗" : "✓"} {feature}
                    </li>
                  );
                })}
              </ul>

              <div className="mt-6">
                <Button variant={plan.variant} fullWidth href="/auth/github">
                  {plan.cta}
                </Button>
                {plan.highlighted && (
                  <p className="mt-3 inline-flex w-full items-center justify-center gap-1 text-center text-xs text-[var(--text-muted)]">
                    <Lock size={12} /> Secure payment via Razorpay
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>

        <p className="mx-auto mt-8 max-w-[520px] text-center text-sm text-[var(--text-muted)]">
          Still unsure? The Starter plan is <span className="text-[var(--accent-green)]">completely free</span> - no card needed. Try it on a real job you&apos;re applying to right now.
        </p>
      </div>
    </section>
  );
}
