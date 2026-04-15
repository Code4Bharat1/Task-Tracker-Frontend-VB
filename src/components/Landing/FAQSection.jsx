"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "How does role-based access work?",
    a: "Task Tracker has three roles: Admin, Department Head, and Employee. Admins manage the company, departments, and all users. Department Heads oversee their team's projects, performance, and daily logs. Employees manage their own tasks, submit daily logs, and report issues — each seeing only what's relevant to them.",
  },
  {
    q: "Can I try Task Tracker before purchasing?",
    a: "Yes. Request early access via our sign-up form and our team will onboard you with a free trial period so you can explore the full platform before committing to a plan.",
  },
  {
    q: "How secure is our company data?",
    a: "Data is fully isolated per company — no cross-organization access is possible. We use short-lived JWT tokens, role-based access control, and encrypted storage to keep your data safe.",
  },
  {
    q: "What is the difference between a Task and a Daily Log?",
    a: "Tasks are discrete work items assigned to team members with deadlines and statuses. Daily Logs are time-stamped entries employees submit each working day describing what they worked on — a lightweight progress journal that gives managers a real-time pulse.",
  },
  {
    q: "Can managers review daily logs in real time?",
    a: "Yes. Department Heads have a dedicated view showing all daily log submissions from their team members. Admins can see logs company-wide, giving leadership full visibility without constant status meetings.",
  },
  {
    q: "Is Task Tracker mobile-friendly?",
    a: "Task Tracker is fully responsive and works on any device — desktop, tablet, or mobile. Your team can log work, review statuses, and manage tasks from anywhere.",
  },
  {
    q: "How long does onboarding take?",
    a: "Most teams are fully onboarded in under 5 minutes. Register your company, invite team members via email, assign roles, and start creating projects immediately — no complicated setup required.",
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState(null);

  return (
    <section className="border-t border-outline py-28 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <div className="inline-flex items-center gap-2 border border-outline bg-surface-container px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-foreground-muted mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
            FAQ
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-foreground-muted max-w-lg mx-auto text-base leading-relaxed">
            Everything you need to know about Task Tracker.
          </p>
        </div>

        {/* Accordion */}
        <div className="flex flex-col divide-y divide-outline border border-outline">
          {FAQS.map(({ q, a }, i) => (
            <div key={i} className="bg-surface-low">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left gap-6 group"
              >
                <span className="text-[14px] font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                  {q}
                </span>
                <ChevronDown
                  className="w-4 h-4 shrink-0 text-foreground-muted transition-transform duration-300"
                  style={{
                    transform: open === i ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                />
              </button>
              <div
                className="overflow-hidden transition-all duration-300"
                style={{ maxHeight: open === i ? 300 : 0 }}
              >
                <p className="px-6 pb-6 text-[13px] text-foreground-muted leading-relaxed">
                  {a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
