"use client";
import { useEffect, useRef, useState } from "react";
import {
  FolderPlus,
  Users,
  Code2,
  Bug,
  CheckSquare,
  CheckCircle2,
  Calendar,
  UserCheck,
  Tag,
  ClipboardList,
  AlertCircle,
  BookCheck,
  Trophy,
  ChevronDown,
} from "lucide-react";

const STEPS = [
  {
    number: "01",
    title: "Project Initiation",
    subtitle: "Sponsor · Admin",
    accent: "#adc6ff",
    icon: FolderPlus,
    headline: "Set scope and stakeholders",
    body: "A project begins when a sponsor defines objectives, scope and timeline, then assigns a Project Manager and key stakeholders.",
    items: [
      { icon: Tag, label: "Define scope & objectives" },
      { icon: UserCheck, label: "Sponsor & PM assigned" },
      { icon: Tag, label: "High-level timeline set" },
      { icon: FolderPlus, label: "Project registered" },
    ],
  },
  {
    number: "02",
    title: "Planning & Team Formation",
    subtitle: "Project Manager",
    accent: "#e8a847",
    icon: Users,
    headline: "Build the plan & assemble the team",
    body: "The Project Manager develops the plan, breaks work into tasks, assigns responsibilities, and establishes milestones and deadlines.",
    items: [
      { icon: Users, label: "Team assembled" },
      { icon: Tag, label: "Work breakdown & milestones" },
      { icon: UserCheck, label: "Roles assigned" },
      { icon: Calendar, label: "Schedule & deadlines" },
    ],
  },
  {
    number: "03",
    title: "Execution",
    subtitle: "Team Members",
    accent: "#47c8ff",
    icon: ClipboardList,
    headline: "Deliver the work",
    body: "Team members execute assigned work, update progress, and surface blockers; the Project Manager tracks milestones and status.",
    items: [
      { icon: ClipboardList, label: "Work in progress" },
      { icon: BookCheck, label: "Daily updates & logs" },
      { icon: CheckSquare, label: "Milestones tracked" },
      { icon: AlertCircle, label: "Blockers flagged" },
    ],
  },
  {
    number: "04",
    title: "Issues & Risks",
    subtitle: "All Roles",
    accent: "#ff6b6b",
    icon: AlertCircle,
    headline: "Identify and resolve blockers",
    body: "Any team member can report issues or risks linked to work items; the team triages and resolves them to keep delivery on track.",
    items: [
      { icon: AlertCircle, label: "Issues & risks reported" },
      { icon: Users, label: "Stakeholders notified" },
      { icon: CheckSquare, label: "Actions assigned" },
      { icon: ClipboardList, label: "Issue history" },
    ],
  },
  {
    number: "05",
    title: "Quality Assurance & Review",
    subtitle: "Quality",
    accent: "#c847ff",
    icon: CheckSquare,
    headline: "Validate and verify",
    body: "Completed work undergoes reviews and checks — functionality, integration, and performance — until acceptance criteria are satisfied.",
    items: [
      { icon: CheckSquare, label: "Review & verification" },
      { icon: CheckSquare, label: "Integration checks" },
      { icon: CheckSquare, label: "Performance & security checks" },
      { icon: UserCheck, label: "Approval for delivery" },
    ],
  },
  {
    number: "06",
    title: "Delivery & Closeout",
    subtitle: "Sponsor · PM · Quality",
    accent: "#47ff8a",
    icon: CheckCircle2,
    headline: "Deliver, archive, and learn",
    body: "After acceptance, the project is closed: deliverables are handed over, documentation archived, and lessons recorded for future improvements.",
    items: [
      { icon: CheckCircle2, label: "Final acceptance" },
      { icon: Trophy, label: "Project closed" },
      { icon: ClipboardList, label: "Archive deliverables" },
      { icon: BookCheck, label: "Document lessons learned" },
    ],
  },
];

export default function ProjectFlowSection() {
  const sectionRef = useRef(null);
  const [raw, setRaw] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [visibleStep, setVisibleStep] = useState(0);
  const [fading, setFading] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function onResize() {
      setIsMobile(typeof window !== "undefined" && window.innerWidth < 768);
    }
    onResize();
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const onScroll = () => {
      const { top, height } = el.getBoundingClientRect();
      const viewH = window.innerHeight;
      const denom = Math.max(1, height - viewH);
      const ratio = Math.max(0, Math.min(1, -top / denom));
      const rawVal = ratio * (STEPS.length - 1);
      const clamped = Math.max(0, Math.min(STEPS.length - 1, rawVal));
      setRaw(clamped);
      // Use rounding so the rotation triggers at halfway between steps
      setActiveStep(
        Math.max(0, Math.min(STEPS.length - 1, Math.round(clamped))),
      );
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (activeStep === visibleStep) return;
    setFading(true);
    const t = setTimeout(() => {
      setVisibleStep(activeStep);
      setFading(false);
    }, 160);
    return () => clearTimeout(t);
  }, [activeStep, visibleStep]);

  const step = STEPS[visibleStep];
  const lineH = `${((raw + 0.5) / STEPS.length) * 100}%`;
  const activeAccent =
    STEPS[Math.min(Math.round(raw), STEPS.length - 1)].accent;

  // Mobile: render a simple vertical card list — no sticky scroll
  if (isMobile) {
    return (
      <section className="border-t border-outline py-16 px-4 bg-surface">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 border border-outline bg-surface-container px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-foreground-muted mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
              Project lifecycle
            </div>
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
              From creation to completion
            </h2>
          </div>
          <div className="flex flex-col gap-4">
            {STEPS.map((s) => (
              <div
                key={s.number}
                className="border bg-surface-low overflow-hidden"
                style={{ borderColor: `${s.accent}35` }}
              >
                <div className="h-1 w-full" style={{ background: s.accent }} />
                <div className="p-5 flex gap-4">
                  <div
                    className="w-10 h-10 flex items-center justify-center border-2 shrink-0"
                    style={{
                      background: `${s.accent}20`,
                      borderColor: `${s.accent}45`,
                    }}
                  >
                    <s.icon className="w-4 h-4" style={{ color: s.accent }} />
                  </div>
                  <div>
                    <p
                      className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1"
                      style={{ color: s.accent }}
                    >
                      Step {s.number} · {s.subtitle}
                    </p>
                    <h3 className="text-[14px] font-extrabold text-foreground tracking-tight mb-1.5">
                      {s.headline}
                    </h3>
                    <p className="text-[12px] text-foreground-muted leading-relaxed">
                      {s.body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      style={{ height: `${STEPS.length * 100}vh` }}
      className="relative"
    >
      <div className="sticky top-0 h-screen border-t border-outline bg-surface flex flex-col overflow-hidden">
        {/* ── Header ── */}
        <div className="text-center pt-10 pb-3 shrink-0 px-4">
          <div className="inline-flex items-center gap-2 border border-outline bg-surface-container px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-foreground-muted mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
            Project lifecycle
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            From creation to completion
          </h2>
          <p className="mt-2 text-sm text-foreground-muted max-w-md mx-auto leading-relaxed">
            Scroll to trace how every project moves through Task Tracker — step
            by step.
          </p>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 flex items-center max-w-6xl mx-auto w-full px-6 gap-10 min-h-0 py-4">
          {/* Step timeline */}
          <div className="w-64 shrink-0 relative self-center">
            {/* Track */}
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-outline" />
            {/* Progress fill */}
            <div
              className="absolute left-[19px] top-0 w-px transition-all duration-500 ease-in-out"
              style={{ height: lineH, background: STEPS[activeStep].accent }}
            />

            <div className="relative flex flex-col gap-6">
              {STEPS.map((s, i) => {
                const isActive = i === activeStep;
                const isPast = i < activeStep;
                return (
                  <div key={s.number} className="flex items-center gap-3.5">
                    <div
                      className={`w-[38px] h-[38px] flex items-center justify-center text-[11px] font-extrabold tracking-wide border-2 shrink-0 z-10 transition-all duration-300 ${
                        !isActive && !isPast
                          ? "border-outline bg-transparent text-foreground-muted opacity-30"
                          : ""
                      }`}
                      style={
                        isActive || isPast
                          ? {
                              background: isActive ? s.accent : `${s.accent}20`,
                              borderColor: s.accent,
                              color: isActive ? "#000" : s.accent,
                              boxShadow: isActive
                                ? `0 0 18px ${s.accent}55`
                                : "none",
                              opacity: 1,
                            }
                          : {}
                      }
                    >
                      {s.number}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-[12px] font-bold tracking-wide leading-tight truncate transition-colors duration-300 ${
                          isActive
                            ? "text-foreground"
                            : isPast
                              ? "text-foreground-muted"
                              : "text-foreground-muted opacity-30"
                        }`}
                      >
                        {s.title}
                      </p>
                      <p
                        className={`text-[10px] uppercase tracking-[0.15em] font-semibold mt-0.5 transition-colors duration-300 ${
                          !isActive ? "text-foreground-muted opacity-25" : ""
                        }`}
                        style={isActive ? { color: s.accent } : {}}
                      >
                        {s.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detail stack: all cards absolutely stacked and moved by scroll */}
          <div className="flex-1 min-h-0 flex items-center">
            <div
              className="w-full relative overflow-hidden"
              style={{ height: 360 }}
            >
              {STEPS.map((s, i) => {
                const n = STEPS.length;
                // position in stack relative to current active step (0 = top)
                const pos = (i - activeStep + n) % n;
                const spacingX = 18; // horizontal inset per card (px)
                const spacingY = 12; // vertical inset per card (px)
                const translateX = pos * spacingX;
                const translateY = pos * spacingY;
                const scale = 1 - Math.min(0.06, pos * 0.015);
                const opacity = 1; // keep cards fully opaque per request
                const zIndex = n - pos + 1000;
                const isActive = pos === 0;
                const isHovered = hoveredIndex === i;
                const boxShadow = isHovered
                  ? `0 30px 60px ${s.accent}44, 0 8px 24px ${s.accent}22`
                  : "none";
                return (
                  <div
                    key={s.number}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className="absolute left-0 right-0 top-0 w-full border shadow-sm bg-surface-low"
                    style={{
                      transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
                      opacity,
                      zIndex,
                      borderColor: `${s.accent}35`,
                      willChange: "transform, opacity",
                      pointerEvents: "auto",
                      padding: 0,
                      transition:
                        "transform 0.45s cubic-bezier(.2,.9,.2,1), opacity 0.35s ease, box-shadow 0.25s ease",
                      boxShadow,
                    }}
                  >
                    <div
                      className="h-1 w-full transition-colors duration-500"
                      style={{ background: s.accent }}
                    />
                    <div className="p-8 relative overflow-hidden">
                      <div
                        className="absolute -right-4 top-0 text-[130px] font-black leading-none pointer-events-none select-none"
                        style={{ color: `${s.accent}0e` }}
                      >
                        {s.number}
                      </div>
                      <div className="relative z-10 space-y-5">
                        <div className="flex items-start gap-4">
                          <div
                            className="w-12 h-12 flex items-center justify-center border-2 shrink-0"
                            style={{
                              background: `${s.accent}20`,
                              borderColor: `${s.accent}45`,
                            }}
                          >
                            <s.icon
                              className="w-5 h-5"
                              style={{ color: s.accent }}
                            />
                          </div>
                          <div>
                            <p
                              className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1"
                              style={{ color: s.accent }}
                            >
                              Step {s.number} · {s.subtitle}
                            </p>
                            <h3
                              className={`text-xl font-extrabold tracking-tight ${isActive ? "text-foreground" : "text-foreground-muted"}`}
                            >
                              {s.headline}
                            </h3>
                          </div>
                        </div>
                        <p
                          className={`${isActive ? "text-foreground" : "text-foreground-muted"} text-[13px] leading-relaxed`}
                        >
                          {s.body}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {s.items.map(({ icon: Icon, label }) => (
                            <div
                              key={label}
                              className="flex items-center gap-2.5 px-3.5 py-2.5 border"
                              style={{
                                borderColor: `${s.accent}22`,
                                background: `${s.accent}07`,
                              }}
                            >
                              <Icon
                                className="w-3.5 h-3.5 shrink-0"
                                style={{ color: s.accent }}
                              />
                              <span
                                className={`${isActive ? "text-foreground" : "text-foreground-muted"} text-[11px] font-medium`}
                              >
                                {label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Bottom: progress dots + scroll hint ── */}
        <div className="flex items-center justify-center gap-1.5 pb-5 shrink-0">
          {STEPS.map((s, i) => (
            <div
              key={i}
              className="h-[3px] transition-all duration-300"
              style={{
                width: i === activeStep ? 28 : 6,
                background:
                  i <= activeStep ? s.accent : "rgba(255,255,255,0.10)",
              }}
            />
          ))}
          {activeStep < STEPS.length - 1 && (
            <div className="ml-3 flex items-center gap-1 text-[10px] text-foreground-muted uppercase tracking-widest opacity-50">
              <ChevronDown className="w-3 h-3 animate-bounce" />
              scroll
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
