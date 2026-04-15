"use client";
import {
  CheckSquare,
  BookCheck,
  AlertCircle,
  Users,
  FolderKanban,
  FileText,
  BarChart3,
  Shield,
} from "lucide-react";

const FEATURES = [
  {
    icon: CheckSquare,
    accent: "#2573e6",
    tag: "Tasks",
    title: "Smart Task Management",
    desc: "Create, assign, and prioritize tasks with deadlines, statuses, and reviewer tracking. Nothing slips through the cracks.",
  },
  {
    icon: BookCheck,
    accent: "#47c8ff",
    tag: "Logs",
    title: "Daily Progress Logs",
    desc: "Every team member logs their daily work. Managers get a real-time pulse on team progress without micromanaging.",
  },
  {
    icon: AlertCircle,
    accent: "#ff6b6b",
    tag: "Issues",
    title: "Issue & Bug Tracking",
    desc: "Report issues directly against projects and tasks. Track severity, resolution, and history all in one place.",
  },
  {
    icon: Users,
    accent: "#e8a847",
    tag: "Roles",
    title: "Role-Based Dashboards",
    desc: "Admins, Department Heads, and Employees each get a tailored view. No noise — just the data and actions that matter.",
  },
  {
    icon: FolderKanban,
    accent: "#47ff8a",
    tag: "Projects",
    title: "Projects & Milestones",
    desc: "Organize work into projects with clear lifecycle stages. Track every deliverable from initiation to completion.",
  },
  {
    icon: FileText,
    accent: "#c847ff",
    tag: "KT Docs",
    title: "Knowledge Transfer Docs",
    desc: "Capture and store KT documents so knowledge flows freely across teams. Nothing is lost when people move on.",
  },
  {
    icon: BarChart3,
    accent: "#ff9f47",
    tag: "Analytics",
    title: "Progress Analytics",
    desc: "Department-level scoreboard and project reports keep leadership informed without chasing status updates.",
  },
  {
    icon: Shield,
    accent: "#adc6ff",
    tag: "Security",
    title: "Secure by Design",
    desc: "Per-company data isolation, short-lived JWT tokens, and role-based access control out of the box.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="border-t border-outline py-28 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <div className="inline-flex items-center gap-2 border border-outline bg-surface-container px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-foreground-muted mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
            Everything you need
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight max-w-2xl">
            Built for how modern teams actually work
          </h2>
          <p className="mt-4 text-foreground-muted max-w-xl mx-auto text-base leading-relaxed">
            Every feature is designed to reduce friction and keep your team
            focused on delivery — not on tools.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map(({ icon: Icon, accent, tag, title, desc }) => (
            <div
              key={title}
              className="group relative flex flex-col gap-4 bg-surface-low border border-outline p-7 hover:-translate-y-1.5 transition-all duration-300 overflow-hidden"
            >
              {/* Hover border overlay */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ boxShadow: `inset 0 0 0 1px ${accent}40` }}
              />
              {/* Top accent line */}
              <div
                className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: accent }}
              />

              {/* Icon */}
              <div
                className="w-10 h-10 flex items-center justify-center border shrink-0"
                style={{
                  background: `${accent}14`,
                  borderColor: `${accent}35`,
                }}
              >
                <Icon className="w-4.5 h-4.5" style={{ color: accent }} />
              </div>

              {/* Tag */}
              <span
                className="text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 border self-start"
                style={{
                  color: accent,
                  background: `${accent}12`,
                  borderColor: `${accent}30`,
                }}
              >
                {tag}
              </span>

              <h3 className="text-[13px] font-extrabold text-foreground tracking-tight leading-snug">
                {title}
              </h3>
              <p className="text-[12px] text-foreground-muted leading-relaxed">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
