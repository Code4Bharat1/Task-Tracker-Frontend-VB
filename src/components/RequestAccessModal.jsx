"use client";

import { useState, useEffect, useRef } from "react";
import { X, CheckCircle } from "lucide-react";

export default function RequestAccessModal({ open, onClose }) {
  const closeBtnRef = useRef(null);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", company: "", role: "" });
  const [errors, setErrors] = useState({});

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

  // Reset state when modal is reopened
  useEffect(() => {
    if (open) {
      setSubmitted(false);
      setForm({ name: "", email: "", company: "", role: "" });
      setErrors({});
    }
  }, [open]);

  if (!open) return null;

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email.";
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    // TODO: wire to real API endpoint
    setSubmitted(true);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" aria-hidden={!open}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-md mx-4 bg-surface-container border border-outline rounded-xl p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-access-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 id="request-access-title" className="text-lg font-bold text-foreground">
              Request Early Access
            </h2>
            <p className="mt-1 text-sm text-foreground-muted">
              Join the waitlist — we&apos;ll reach out when your spot is ready.
            </p>
          </div>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Close"
            className="text-foreground-muted hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <CheckCircle className="w-12 h-12 text-primary" />
            <h3 className="text-base font-bold text-foreground">You&apos;re on the list!</h3>
            <p className="text-sm text-foreground-muted max-w-xs">
              Thanks, <span className="font-semibold text-foreground">{form.name}</span>. We&apos;ll be in touch at{" "}
              <span className="font-semibold text-foreground">{form.email}</span>.
            </p>
            <button
              onClick={onClose}
              className="mt-2 bg-primary text-on-primary font-semibold px-6 py-2.5 rounded hover:opacity-90 transition-opacity text-sm"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {/* Name */}
            <div>
              <label htmlFor="ra-name" className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
                Full Name <span className="text-primary">*</span>
              </label>
              <input
                id="ra-name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Jane Doe"
                autoComplete="name"
                className="w-full bg-surface-high border border-outline rounded px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="ra-email" className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
                Work Email <span className="text-primary">*</span>
              </label>
              <input
                id="ra-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="jane@company.com"
                autoComplete="email"
                className="w-full bg-surface-high border border-outline rounded px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            {/* Company + Role row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="ra-company" className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
                  Company
                </label>
                <input
                  id="ra-company"
                  name="company"
                  type="text"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="Acme Inc."
                  autoComplete="organization"
                  className="w-full bg-surface-high border border-outline rounded px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label htmlFor="ra-role" className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
                  Role
                </label>
                <select
                  id="ra-role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="w-full bg-surface-high border border-outline rounded px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="">Select…</option>
                  <option value="engineer">Engineer</option>
                  <option value="manager">Manager</option>
                  <option value="designer">Designer</option>
                  <option value="founder">Founder</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="mt-1 w-full bg-primary text-on-primary font-bold py-3 rounded hover:opacity-90 transition-opacity text-sm"
            >
              Request Access
            </button>

            <p className="text-center text-xs text-foreground-muted">
              No spam. Unsubscribe at any time.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
