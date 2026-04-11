import React, { useState } from 'react'
import Link from "next/link";
import { ArrowRight, CheckSquare, Users, BarChart2 } from "lucide-react";
import TypeWriter from "@/UI/TypeWriter.jsx";
import RequestAccessModal from "@/components/RequestAccessModal";
const DEMO_VIDEO_ID = "QsfRrsish18";
const HeroSection = () => {
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const features = [
    {
      icon: CheckSquare,
      label: "Task Management"
    },
    {
      icon: Users,
      label: "Team Collaboration"
    },
    {
      icon: BarChart2,
      label: "Progress Tracking"
    },
  ];
  return (
    <main className="relative z-10 flex-1 min-h-0 flex flex-col px-6 py-8 max-w-7xl mx-auto w-full overflow-hidden">
      {/* Two-column hero */}
      <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-12 flex-1 min-h-0 h-full">
        {/* Left — content */}
        <div className="flex-1 flex flex-col items-start text-left justify-center max-w-lg">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 border border-outline bg-surface-container px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-foreground-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
            Now in Early Access
          </div>

          {/* Headline */}
          <h1 className="font-sans font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight text-foreground max-w-xl leading-[1.08]">
            Where Code Meets
            <span className="block mt-3 text-primary">
              <TypeWriter />
            </span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-foreground-muted max-w-md leading-relaxed">
            A unified task-tracking platform for teams that prioritize clarity
            and velocity — plan work, remove blockers, and ship reliably.
          </p>

          {/* CTAs */}
          <div className="mt-6 flex flex-col sm:flex-row items-start gap-4">
            <button
              type="button"
              onClick={() => setIsRequestOpen(true)}
              className="flex items-center gap-2 bg-primary text-on-primary font-sans font-bold px-8 py-3.5 hover:opacity-90 transition-all group"
            >
              Request Access
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <Link
              href="/pricing"
              className="flex items-center gap-2 border border-outline px-8 py-3.5 text-sm font-semibold text-foreground hover:bg-surface-high transition-colors"
            >
              View Pricing
            </Link>
          </div>

          {/* Feature pills */}
          <div className="mt-8 flex flex-wrap gap-3">
            {features.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 bg-surface-container border border-outline px-3 py-1.5 text-xs font-semibold text-foreground-muted uppercase tracking-wider rounded-sm"
              >
                <Icon className="w-3.5 h-3.5 text-primary" />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Request Access Modal */}
        <RequestAccessModal open={isRequestOpen} onClose={() => setIsRequestOpen(false)} />

        {/* Right — video thumbnail */}
        <div className="flex-1 w-full lg:max-w-[52%] h-full">
          <div className="video-shadow rounded-2xl w-full h-full">
            <div className="w-full h-full overflow-hidden rounded-2xl border border-outline bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${DEMO_VIDEO_ID}?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&loop=1&playlist=${DEMO_VIDEO_ID}&playsinline=1`}
                title="Task management workflow demo preview"
                allow="autoplay; encrypted-media; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default HeroSection
