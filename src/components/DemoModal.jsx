"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";

const DEMO_VIDEO_ID = "QsfRrsish18";

export default function DemoModal({ open, onClose }) {
  const closeBtnRef = useRef(null);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", handleKey);
      closeBtnRef.current?.focus();
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-hidden={!open}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative z-10 max-w-4xl w-full mx-4 bg-surface-container border border-outline rounded-lg p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-modal-title"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3
              id="demo-modal-title"
              className="text-lg font-bold text-foreground"
            >
              Demo — Task Management Workflow
            </h3>
            <p className="mt-1 text-sm text-foreground-muted">
              See how teams use a task tracker to plan, assign, and ship work —
              the same flows our app is built around.
            </p>
          </div>
          <button
            ref={closeBtnRef}
            className="text-foreground-muted hover:text-foreground"
            onClick={onClose}
            aria-label="Close demo"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Two-column: content left, video right */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left — content */}
          <div className="flex flex-col gap-4">
            <div className="rounded-md bg-surface-high border border-outline p-4 text-sm text-foreground">
              <strong className="block mb-2 text-base">What you'll see</strong>
              <ul className="space-y-2 text-foreground-muted">
                <li>— Create and break down tasks instantly</li>
                <li>— Assign team members and set due dates</li>
                <li>— Visualise progress with dashboards</li>
                <li>— Automate repetitive workflows</li>
                <li>— Track blockers before they slow you down</li>
              </ul>
            </div>

            <div className="flex flex-wrap gap-3 mt-auto">
              <Link
                href="/login"
                className="bg-primary text-on-primary px-5 py-2.5 rounded font-semibold text-sm"
                onClick={onClose}
              >
                Get Started Free
              </Link>
              <a
                href="/demo"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-outline px-5 py-2.5 rounded font-semibold text-sm text-foreground"
              >
                Try Interactive Demo
              </a>
            </div>

            <button
              className="self-start text-xs text-foreground-muted hover:text-foreground underline"
              onClick={onClose}
            >
              Close
            </button>
          </div>

          {/* Right — YouTube embed */}
          <div className="mt-5 w-full h-64 md:h-96 video-shadow rounded-2xl">
            <div className="w-full h-full overflow-hidden rounded-2xl border border-outline bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${DEMO_VIDEO_ID}?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&loop=1&playlist=${DEMO_VIDEO_ID}&playsinline=1`}
                title="Task management workflow demo"
                allow="autoplay; encrypted-media; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
