"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-outline bg-surface-low">
      {/* Main footer grid */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-2 sm:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="col-span-2 sm:col-span-1 flex flex-col gap-4">
          <span className="text-[13px] tracking-[0.2em] uppercase font-extrabold text-foreground">
            Task Tracker
          </span>
          <p className="text-[12px] text-foreground-muted leading-relaxed max-w-[180px]">
            The project management platform your whole team will love.
          </p>
        </div>

        {/* Product */}
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-foreground-muted mb-1">
            Product
          </p>
          {[
            { label: "Features", href: "/#features" },
            { label: "Pricing", href: "/pricing" },
            { label: "Changelog", href: "#" },
            { label: "Roadmap", href: "#" },
          ].map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="text-[12px] text-foreground-muted hover:text-foreground transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Roles */}
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-foreground-muted mb-1">
            Dashboards
          </p>
          {[
            { label: "Admin panel", href: "/login" },
            { label: "Dept Head panel", href: "/login" },
            { label: "Employee panel", href: "/login" },
            { label: "Sign in", href: "/login" },
          ].map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="text-[12px] text-foreground-muted hover:text-foreground transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Company */}
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-foreground-muted mb-1">
            Company
          </p>
          {[
            { label: "About", href: "#" },
            { label: "Contact", href: "#" },
            { label: "Privacy policy", href: "#" },
            { label: "Terms of service", href: "#" },
          ].map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="text-[12px] text-foreground-muted hover:text-foreground transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-outline px-6 py-5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-foreground-muted">
            &copy; 2026 Task Tracker. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/pricing"
              className="text-[11px] text-foreground-muted hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="text-[11px] text-foreground-muted hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="#"
              className="text-[11px] text-foreground-muted hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
