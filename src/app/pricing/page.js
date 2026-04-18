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
    accent: "#6b7280",
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
    price: "₹1200",
    period: "/ user / mo",
    description: "For growing teams that need more power and visibility.",
    cta: "Request Access",
    href: null,
    primary: true,
    accent: "#2563eb",
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
    accent: "#7c3aed",
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
      <main className="relative z-10 flex-1 px-6 pb-20 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`group flex flex-col rounded-xl border p-8 transition-all duration-300 hover:-translate-y-2 cursor-pointer ${
                plan.primary
                  ? "border-[#2563eb] ring-1 ring-[#2563eb]/20 shadow-[0_8px_32px_rgba(37,99,235,0.15)] bg-white dark:bg-surface-container hover:shadow-[0_20px_60px_rgba(37,99,235,0.25)]"
                  : "border-gray-200 dark:border-outline bg-white dark:bg-surface-container hover:shadow-[0_20px_60px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
              }`}
            >
              {plan.primary && (
                <span className="self-start mb-4 text-[10px] font-bold uppercase tracking-widest bg-[#2563eb] text-white px-3 py-1.5 rounded transition-transform duration-300 group-hover:scale-105">
                  Most Popular
                </span>
              )}
              <h2 className="text-xl font-bold text-foreground tracking-tight transition-colors duration-300 group-hover:text-[#2563eb]">{plan.name}</h2>
              <p className="mt-2 text-sm text-foreground-muted leading-relaxed">{plan.description}</p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight transition-transform duration-300 group-hover:scale-105 origin-left">{plan.price}</span>
                {plan.period && (
                  <span className="text-sm text-foreground-muted font-medium">{plan.period}</span>
                )}
              </div>

              <ul className="mt-8 flex flex-col gap-3.5 flex-1">
                {plan.features.map((f, idx) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-foreground-muted transition-transform duration-200" style={{ transitionDelay: `${idx * 30}ms` }}>
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0 transition-all duration-300 group-hover:scale-110"
                      style={{ backgroundColor: `${plan.accent}15` }}
                    >
                      <Check className="w-3 h-3 transition-transform duration-300 group-hover:scale-110" style={{ color: plan.accent }} />
                    </div>
                    <span className="leading-relaxed transition-colors duration-300 group-hover:text-foreground">{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-10">
                {plan.href ? (
                  <Link
                    href={plan.href}
                    onClick={(e) => e.stopPropagation()}
                    className={`flex items-center justify-center gap-2 font-semibold py-3.5 px-6 rounded-lg transition-all duration-300 text-sm ${
                      plan.primary
                        ? "bg-[#2563eb] text-white group-hover:bg-[#1d4ed8] shadow-md group-hover:shadow-lg group-hover:scale-[1.02]"
                        : "border border-gray-300 dark:border-outline text-foreground group-hover:bg-[#2563eb] group-hover:text-white group-hover:border-[#2563eb] group-hover:scale-[1.02]"
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                ) : (
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="w-full flex items-center justify-center gap-2 font-semibold py-3.5 px-6 rounded-lg transition-all duration-300 text-sm bg-[#2563eb] text-white group-hover:bg-[#1d4ed8] shadow-md group-hover:shadow-lg group-hover:scale-[1.02]"
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
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
