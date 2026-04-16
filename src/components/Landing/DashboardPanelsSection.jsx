"use client";

import {
  Shield,
  Users2,
  User,
  LayoutDashboard,
  FolderKanban,
  BookCheck,
  Bug,
  BarChart3,
  Settings,
  Building2,
  Layers,
  ClipboardList,
  ArrowRight,
  Check,
  Minus,
  Zap,
  Globe,
  Lock,
} from "lucide-react";
import Link from "next/link";
import ProjectFlowSection from "./ProjectFlowSection";

const PANELS = [
  {
    role: "Admin",
    icon: Shield,
    accent: "#adc6ff",
    badge: "Full Control",
    headline: "Admin Panel",
    desc: "Complete visibility and control over the entire organisation — users, departments, projects, and company-wide settings.",
    stat: { value: "100%", label: "Platform access" },
    capabilities: [
      { icon: LayoutDashboard, label: "Company-wide overview" },
      { icon: Users2, label: "User management" },
      { icon: Building2, label: "Department management" },
      { icon: FolderKanban, label: "All projects overview" },
      { icon: BookCheck, label: "Daily logs monitoring" },
      { icon: Settings, label: "Company settings" },
    ],
  },
  {
    role: "Department Head",
    icon: Users2,
    accent: "#e8a847",
    badge: "Team Oversight",
    headline: "Dept Head Panel",
    desc: "Monitor your department projects, track team performance, review daily logs, and keep delivery on schedule.",
    stat: { value: "360°", label: "Team visibility" },
    featured: true,
    capabilities: [
      { icon: LayoutDashboard, label: "Department overview" },
      { icon: FolderKanban, label: "Project management" },
      { icon: Users2, label: "Team members" },
      { icon: BarChart3, label: "Scoreboard & rankings" },
      { icon: BookCheck, label: "Daily log review" },
      { icon: Layers, label: "Module tracking" },
    ],
  },
  {
    role: "Employee",
    icon: User,
    accent: "#47ff8a",
    badge: "Personal Workspace",
    headline: "Employee Panel",
    desc: "Your personal workspace — track assigned modules, submit daily work logs, report bugs, and stay on top of deadlines.",
    stat: { value: "Inf", label: "Daily submissions" },
    capabilities: [
      { icon: LayoutDashboard, label: "Personal dashboard" },
      { icon: FolderKanban, label: "My projects" },
      { icon: Layers, label: "My modules" },
      { icon: ClipboardList, label: "Daily log submission" },
      { icon: Bug, label: "Bug reporting" },
      { icon: BookCheck, label: "KT documents" },
    ],
  },
];

const COMPARISON = [
  {
    feature: "Dashboard overview",
    admin: true,
    deptHead: true,
    employee: true,
  },
  { feature: "User management", admin: true, deptHead: false, employee: false },
  {
    feature: "Department control",
    admin: true,
    deptHead: true,
    employee: false,
  },
  {
    feature: "All projects access",
    admin: true,
    deptHead: false,
    employee: false,
  },
  { feature: "Team projects", admin: true, deptHead: true, employee: true },
  { feature: "Module tracking", admin: true, deptHead: true, employee: true },
  { feature: "Daily log review", admin: true, deptHead: true, employee: false },
  {
    feature: "Daily log submission",
    admin: false,
    deptHead: false,
    employee: true,
  },
  { feature: "Bug reporting", admin: true, deptHead: true, employee: true },
  { feature: "Scoreboard", admin: false, deptHead: true, employee: false },
  {
    feature: "Company settings",
    admin: true,
    deptHead: false,
    employee: false,
  },
];

const HIGHLIGHTS = [
  {
    icon: Zap,
    title: "Instant onboarding",
    desc: "Register your company, invite your team, and assign roles in under 5 minutes. No setup overhead.",
  },
  {
    icon: Globe,
    title: "Works everywhere",
    desc: "Fully responsive across desktop, tablet, and mobile. Your team stays in sync from any device.",
  },
  {
    icon: Lock,
    title: "Secure by design",
    desc: "Per-company data isolation, role-based access control, and short-lived JWT tokens out of the box.",
  },
];

function Cell({ value, accent }) {
  if (value)
    return <Check className="w-4 h-4 mx-auto" style={{ color: accent }} />;
  return <Minus className="w-4 h-4 mx-auto text-foreground-muted opacity-30" />;
}

export default function DashboardPanelsSection() {
  return (
    <div className="relative z-10">
      <section className="border-t border-outline py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center mb-16">
            <div className="inline-flex items-center gap-2 border border-outline bg-surface-container px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-foreground-muted mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
              Role-based dashboards
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              One platform, three powerful views
            </h2>
            <p className="mt-4 text-foreground-muted max-w-xl mx-auto text-base leading-relaxed">
              Every role gets a tailored dashboard — no noise, just the data and
              actions that matter to them.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {PANELS.map(
              ({
                role,
                icon: RoleIcon,
                accent,
                badge,
                headline,
                desc,
                stat,
                featured,
                capabilities,
              }) => (
                <div
                  key={role}
                  className={`group relative flex flex-col bg-surface-low border overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_60px_rgba(0,0,0,0.5)] ${featured ? "border-[#e8a847]/50 shadow-[0_8px_32px_rgba(232,168,71,0.15)] md:-mt-4" : role === "Admin" ? "border-[#adc6ff]/40 shadow-[0_4px_24px_rgba(173,198,255,0.08)]" : "border-[#47ff8a]/40 shadow-[0_4px_24px_rgba(71,255,138,0.08)]"}`}
                >
                  {featured && (
                    <div className="absolute top-4 right-4 text-[9px] font-bold tracking-[0.2em] uppercase px-2 py-0.5 bg-[#e8a847] text-black">
                      Most Used
                    </div>
                  )}
                  <div
                    className="h-[3px] w-full"
                    style={{ background: accent }}
                  />
                  <div className="flex flex-col flex-1 p-8 gap-5">
                    <div className="flex items-start justify-between gap-4">
                      <div
                        className="w-11 h-11 flex items-center justify-center border shrink-0"
                        style={{
                          background: `${accent}18`,
                          borderColor: `${accent}40`,
                        }}
                      >
                        <RoleIcon
                          className="w-5 h-5"
                          style={{ color: accent }}
                        />
                      </div>
                      <span
                        className={`text-[10px] font-bold tracking-[0.15em] uppercase px-2.5 py-1 border ${featured ? "mt-6" : ""}`}
                        style={{
                          color: accent,
                          background: `${accent}12`,
                          borderColor: `${accent}35`,
                        }}
                      >
                        {badge}
                      </span>
                    </div>
                    <div
                      className="border-l-2 pl-4"
                      style={{ borderColor: accent }}
                    >
                      <p
                        className="text-2xl font-extrabold"
                        style={{ color: accent }}
                      >
                        {stat.value}
                      </p>
                      <p className="text-[11px] text-foreground-muted uppercase tracking-widest mt-0.5">
                        {stat.label}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-[15px] font-extrabold text-foreground tracking-tight mb-2">
                        {headline}
                      </h3>
                      <p className="text-[13px] text-foreground-muted leading-relaxed">
                        {desc}
                      </p>
                    </div>
                    <div className="border-t border-outline" />
                    <div className="grid grid-cols-2 gap-2">
                      {capabilities.map(({ icon: Icon, label }) => (
                        <div
                          key={label}
                          className="flex items-center gap-2 bg-surface-container border border-outline px-3 py-2"
                        >
                          <Icon
                            className="w-3.5 h-3.5 shrink-0"
                            style={{ color: accent }}
                          />
                          <span className="text-[11px] text-foreground-muted font-medium truncate">
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                    <Link
                      href="/login"
                      className="mt-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest transition-colors group/link"
                      style={{ color: accent }}
                    >
                      Access {role} panel
                      <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      <ProjectFlowSection />

      <section className="border-t border-outline py-20 px-6 bg-surface-low">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              What each role can do
            </h2>
            <p className="mt-3 text-foreground-muted text-sm">
              A clear breakdown of permissions across all panels.
            </p>
          </div>
          <div className="border border-outline overflow-hidden">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr] bg-surface-container border-b border-outline">
              <div className="px-6 py-4 text-[10px] tracking-[0.15em] uppercase text-foreground-muted font-bold">
                Feature
              </div>
              {PANELS.map(({ role, accent, icon: Icon }) => (
                <div key={role} className="px-4 py-4 text-center">
                  <Icon
                    className="w-4 h-4 mx-auto mb-1"
                    style={{ color: accent }}
                  />
                  <p
                    className="text-[10px] tracking-[0.12em] uppercase font-bold"
                    style={{ color: accent }}
                  >
                    {role}
                  </p>
                </div>
              ))}
            </div>
            {COMPARISON.map(({ feature, admin, deptHead, employee }, i) => (
              <div
                key={feature}
                className={`grid grid-cols-[2fr_1fr_1fr_1fr] border-b border-outline last:border-0 ${i % 2 === 0 ? "bg-surface-low" : "bg-surface"}`}
              >
                <div className="px-6 py-3.5 text-[12px] text-foreground-muted">
                  {feature}
                </div>
                <div className="px-4 py-3.5 flex items-center justify-center">
                  <Cell value={admin} accent="#adc6ff" />
                </div>
                <div className="px-4 py-3.5 flex items-center justify-center">
                  <Cell value={deptHead} accent="#e8a847" />
                </div>
                <div className="px-4 py-3.5 flex items-center justify-center">
                  <Cell value={employee} accent="#47ff8a" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-outline py-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex flex-col gap-4 bg-surface-low border border-outline p-8 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)] transition-all duration-300"
            >
              <div className="w-10 h-10 bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-[13px] font-extrabold text-foreground uppercase tracking-wide">
                {title}
              </h3>
              <p className="text-[13px] text-foreground-muted leading-relaxed">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="border-t border-outline py-28 px-6 bg-surface-container relative overflow-hidden">
        {/* Subtle gradient accent */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 100%, rgba(37,115,230,0.06) 0%, transparent 70%)",
          }}
        />
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 border border-outline bg-surface-container px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-foreground-muted mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
            Start today — it's free
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight mb-5 leading-tight">
            Ready to ship with clarity?
          </h2>
          <p className="text-foreground-muted text-base sm:text-lg leading-relaxed mb-12 max-w-xl mx-auto">
            Join teams already using Task Tracker to stay aligned, remove
            blockers, and deliver on time — every time.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="flex items-center gap-2 bg-primary text-on-primary font-bold px-12 py-4 hover:opacity-90 transition-all group text-sm"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/pricing"
              className="flex items-center gap-2 border border-outline px-12 py-4 text-sm font-semibold text-foreground hover:bg-surface-high transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Footer moved to page.js */}
    </div>
  );
}
