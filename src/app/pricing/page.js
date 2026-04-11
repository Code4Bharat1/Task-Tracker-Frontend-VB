"use client";

import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "For individuals and small teams getting started.",
    cta: "Get Started Free",
    href: "/login",
    primary: false,
    features: [
      "Up to 5 users",
      "10 active projects",
      "Basic task management",
      "Daily logs",
      "Email support",
    ],
  },
  {
    name: "Pro",
    price: "1200Rs",
    period: "/ user / mo",
    description: "For growing teams that need more power and visibility.",
    cta: "Request Access",
    href: null,
    primary: true,
    features: [
      "Unlimited users",
      "Unlimited projects",
      "Advanced reporting & dashboards",
      "Bug & testing tracking",
      "Module management",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large organizations with custom needs.",
    cta: "Contact Sales",
    href: "mailto:sales@tasktracker.io",
    primary: false,
    features: [
      "Everything in Pro",
      "SSO / SAML",
      "Custom roles & permissions",
      "Dedicated account manager",
      "SLA guarantee",
      "On-premise option",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="relative min-h-screen flex flex-col bg-surface">
      {/* Dot pattern */}
      <div className="fixed inset-0 bg-dot-pattern pointer-events-none opacity-60" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-outline">
        <Link
          href="/"
          className="font-sans font-extrabold tracking-widest uppercase text-foreground text-sm hover:opacity-80 transition-opacity"
        >
          Task Tracker
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link
            href="/login"
            className="text-xs font-bold uppercase tracking-widest text-primary hover:opacity-80 transition-opacity"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 text-center px-6 pt-16 pb-10">
        <span className="inline-flex items-center gap-2 border border-outline bg-surface-container px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-foreground-muted mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
          Simple, Transparent Pricing
        </span>
        <h1 className="font-sans font-extrabold text-4xl sm:text-5xl tracking-tight text-foreground mt-4">
          Plans for every team size
        </h1>
        <p className="mt-4 text-base text-foreground-muted max-w-md mx-auto">
          Start free, scale as you grow. No hidden fees.
        </p>
      </div>

      {/* Plans */}
      <main className="relative z-10 flex-1 px-6 pb-20 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`flex flex-col rounded-2xl border p-7 bg-surface-container transition-shadow ${
                plan.primary
                  ? "border-primary ring-2 ring-primary/20 shadow-xl"
                  : "border-outline"
              }`}
            >
              {plan.primary && (
                <span className="self-start mb-3 text-[10px] font-bold uppercase tracking-widest bg-primary text-on-primary px-2.5 py-1">
                  Most Popular
                </span>
              )}
              <h2 className="text-lg font-bold text-foreground">{plan.name}</h2>
              <p className="mt-1 text-sm text-foreground-muted">{plan.description}</p>

              <div className="mt-5 flex items-end gap-1">
                <span className="text-4xl font-extrabold text-foreground">{plan.price}</span>
                {plan.period && (
                  <span className="mb-1 text-sm text-foreground-muted">{plan.period}</span>
                )}
              </div>

              <ul className="mt-6 flex flex-col gap-3 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-foreground-muted">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                {plan.href ? (
                  <Link
                    href={plan.href}
                    className={`flex items-center justify-center gap-2 font-bold py-3 rounded transition-all text-sm ${
                      plan.primary
                        ? "bg-primary text-on-primary hover:opacity-90"
                        : "border border-outline text-foreground hover:bg-surface-high"
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link
                    href="/"
                    className="flex items-center justify-center gap-2 font-bold py-3 rounded transition-all text-sm bg-primary text-on-primary hover:opacity-90"
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Back link */}
        <div className="mt-12 text-center">
          <Link href="/" className="text-sm text-primary hover:underline">
            ← Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
