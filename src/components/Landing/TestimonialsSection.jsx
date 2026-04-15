"use client";
import { Star } from "lucide-react";

const TESTIMONIALS = [
  {
    quote:
      "Task Tracker transformed how our engineering team operates. Daily logs alone saved us hours of status meetings every week.",
    name: "Sarah Chen",
    title: "VP Engineering",
    company: "NexBuild",
    avatar: "SC",
    accent: "#adc6ff",
    stars: 5,
  },
  {
    quote:
      "Having separate dashboards for admins, department heads, and employees means everyone sees exactly what they need. Zero noise.",
    name: "Marcus Rivera",
    title: "Operations Manager",
    company: "CoreFlow",
    avatar: "MR",
    accent: "#e8a847",
    stars: 5,
  },
  {
    quote:
      "The project lifecycle view is exceptional. We can trace every deliverable from kickoff to completion in one place.",
    name: "Priya Mehta",
    title: "Project Manager",
    company: "Synctera",
    avatar: "PM",
    accent: "#47ff8a",
    stars: 5,
  },
];

export default function TestimonialsSection() {
  return (
    <section className="border-t border-outline py-28 px-6 bg-surface-low">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <div className="inline-flex items-center gap-2 border border-outline bg-surface-container px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-foreground-muted mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
            Customer stories
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Loved by teams of all sizes
          </h2>
          <p className="mt-4 text-foreground-muted max-w-lg mx-auto text-base leading-relaxed">
            See how teams use Task Tracker to stay aligned and ship reliably.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map(
            ({ quote, name, title, company, avatar, accent, stars }) => (
              <div
                key={name}
                className="group relative flex flex-col gap-6 bg-surface border border-outline p-8 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                {/* Top gradient line */}
                <div
                  className="absolute top-0 left-0 right-0 h-px"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
                  }}
                />

                {/* Stars */}
                <div className="flex gap-1">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-3.5 h-3.5 fill-current"
                      style={{ color: accent }}
                    />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-[14px] text-foreground leading-loose flex-1">
                  &ldquo;{quote}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 flex items-center justify-center text-[12px] font-bold border shrink-0"
                    style={{
                      background: `${accent}20`,
                      borderColor: `${accent}40`,
                      color: accent,
                    }}
                  >
                    {avatar}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-foreground">
                      {name}
                    </p>
                    <p className="text-[11px] text-foreground-muted">
                      {title} · {company}
                    </p>
                  </div>
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
