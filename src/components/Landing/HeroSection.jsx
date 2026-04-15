"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckSquare,
  Users,
  BarChart2,
  Zap,
  Shield,
} from "lucide-react";
import TypeWriter from "@/UI/TypeWriter.jsx";
import RequestAccessModal from "@/components/RequestAccessModal";

const DEMO_VIDEO_ID = "QsfRrsish18";

const STATS = [
  { value: "150+", label: "Teams" },
  { value: "10K+", label: "Tasks tracked" },
  { value: "3", label: "Role dashboards" },
  { value: "98%", label: "On-time delivery" },
];

const TRUST_BADGES = [
  { icon: Shield, label: "Secure by design" },
  { icon: Zap, label: "5-min onboarding" },
  { icon: Users, label: "Any team size" },
];

const HeroSection = () => {
  const [isRequestOpen, setIsRequestOpen] = useState(false);

  return (
    <>
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-20 pb-24 w-full">
        <div className="max-w-5xl mx-auto w-full flex flex-col items-center">
          {/* Announcement badge */}
          <div className="mb-8 inline-flex items-center gap-2 border border-outline bg-surface-container px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-foreground-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
            Now in Early Access — Request yours today
          </div>

          {/* Main headline */}
          <h1 className="font-extrabold text-4xl sm:text-6xl lg:text-[72px] tracking-tight text-foreground leading-[1.04] mb-6">
            Where Code Meets
            <span className="block text-primary mt-2">
              <TypeWriter />
            </span>
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-foreground-muted max-w-2xl leading-relaxed mb-10">
            A unified project management platform for teams that value clarity
            and velocity — plan work, remove blockers, and ship on time. Every
            role gets a tailored experience.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-14">
            <button
              type="button"
              onClick={() => setIsRequestOpen(true)}
              className="flex items-center gap-2 bg-primary text-on-primary font-bold px-10 py-4 text-sm hover:opacity-90 transition-all group"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <Link
              href="/pricing"
              className="flex items-center gap-2 border border-outline px-10 py-4 text-sm font-semibold text-foreground hover:bg-surface-high transition-colors"
            >
              View Pricing
            </Link>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 mb-6">
            {STATS.map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center gap-0.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-foreground">
                  {value}
                </span>
                <span className="text-[11px] uppercase tracking-widest text-foreground-muted">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
            {TRUST_BADGES.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 text-[12px] text-foreground-muted font-medium"
              >
                <Icon className="w-3.5 h-3.5 text-primary" />
                {label}
              </div>
            ))}
          </div>

          {/* Product video preview with browser chrome */}
          <div className="w-full">
            <div className="relative border border-outline overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.18)] dark:shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 h-9 bg-surface-container border-b border-outline shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400/80 dark:bg-red-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80 dark:bg-yellow-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-400/80 dark:bg-green-500/60" />
                <span className="mx-auto text-[11px] text-foreground-muted tracking-wide">
                  tasktracker.io · Dashboard
                </span>
              </div>
              <div className="aspect-video bg-black">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${DEMO_VIDEO_ID}?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&loop=1&playlist=${DEMO_VIDEO_ID}&playsinline=1`}
                  title="Task Tracker product demo"
                  allow="autoplay; encrypted-media; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <RequestAccessModal
        open={isRequestOpen}
        onClose={() => setIsRequestOpen(false)}
      />
    </>
  );
};

export default HeroSection;
