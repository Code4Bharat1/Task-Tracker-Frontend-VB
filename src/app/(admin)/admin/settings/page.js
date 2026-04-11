"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth/context";
import api, { getTokenPayload } from "@/lib/api";
import {
  Clock,
  Globe,
  Check,
  Loader2,
  AlertCircle,
  Shield,
  Save,
  Plus,
  X,
  Sunrise,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────
/**
 * Normalise any time string to the HH:MM 24-hour format that
 * <input type="time"> requires as its value.
 * Handles: "22:00", "08:00 pm", "08:00 PM", "8:00pm", "20:00:00"
 */
function normalizeTimeTo24(t) {
  if (!t || typeof t !== "string") return "00:00";
  const clean = t.trim();
  // Already HH:MM or HH:MM:SS in 24-hour format (no am/pm)
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(clean)) return clean.slice(0, 5);
  // 12-hour format with am/pm  e.g. "08:00 pm" or "8:00pm"
  const match = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)?$/i);
  if (!match) return "00:00";
  let hh = parseInt(match[1], 10);
  const mm = match[2];
  const period = (match[3] || "").toLowerCase();
  if (period === "pm" && hh !== 12) hh += 12;
  if (period === "am" && hh === 12) hh = 0;
  return String(hh).padStart(2, "0") + ":" + mm;
}

// ─── Constants ────────────────────────────────────────────────
const DAYS = [
  { short: "Mon", full: "Monday" },
  { short: "Tue", full: "Tuesday" },
  { short: "Wed", full: "Wednesday" },
  { short: "Thu", full: "Thursday" },
  { short: "Fri", full: "Friday" },
  { short: "Sat", full: "Saturday" },
  { short: "Sun", full: "Sunday" },
];

const DEFAULT_FORM = {
  companyName: "",
  workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  shiftStart: "09:00",
  shiftEnd: "18:00",
  logDeadlines: ["22:00"],
};

// ─── Field wrapper ────────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div>
      <p className="block text-[10px] tracking-[0.15em] uppercase text-foreground-muted mb-1.5">
        {label}
      </p>
      {children}
      {hint && <p className="text-[10px] text-foreground-muted mt-1">{hint}</p>}
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────
function Section({ icon: Icon, title, children }) {
  return (
    <div className="border border-outline bg-surface-low">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-outline">
        <Icon className="w-4 h-4 text-primary" />
        <span className="text-[11px] tracking-[0.2em] uppercase font-bold text-foreground">
          {title}
        </span>
      </div>
      <div className="px-6 py-5 space-y-5">{children}</div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function SettingsPage() {
  const { user } = useAuth();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [loadError, setLoadError] = useState(null);

  // companyId from user object (after backend fix) or decoded from JWT token
  const companyId = user?.companyId ?? getTokenPayload()?.companyId ?? null;

  const loadCompany = useCallback(async () => {
    if (!companyId) return;
    try {
      const { data } = await api.get(`/companies/${companyId}`);
      const c = data.company;
      setForm({
        companyName: c.companyName || "",
        workingDays: c.workingDays || DEFAULT_FORM.workingDays,
        shiftStart: c.shiftStart || "09:00",
        shiftEnd: c.shiftEnd || "18:00",
        logDeadlines: (c.logDeadlines?.length ? c.logDeadlines : ["22:00"]).map(
          normalizeTimeTo24,
        ),
      });
    } catch {
      setLoadError("Failed to load company settings.");
    }
  }, [companyId]);

  useEffect(() => {
    loadCompany();
  }, [loadCompany]);

  function toggleDay(fullName) {
    setForm((prev) => ({
      ...prev,
      workingDays: prev.workingDays.includes(fullName)
        ? prev.workingDays.filter((d) => d !== fullName)
        : [...prev.workingDays, fullName],
    }));
  }

  async function handleSave() {
    if (!companyId) {
      setError("Company ID not found. Please refresh and try again.");
      return;
    }
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await api.patch(`/companies/${companyId}`, {
        companyName: form.companyName,
        workingDays: form.workingDays,
        shiftStart: form.shiftStart,
        shiftEnd: form.shiftEnd,
        logDeadlines: form.logDeadlines,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-y-3">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-foreground-muted mb-1">
            Configuration
          </p>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Company Settings
          </h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 text-[11px] tracking-[0.15em] uppercase font-bold bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : saved ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          {saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      {/* Alerts */}
      {(error || loadError) && (
        <div className="flex items-center gap-3 px-4 py-3 border border-[#ff4747]/30 bg-[#ff4747]/5 text-[#ff4747]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-[12px]">{error || loadError}</span>
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-3 px-4 py-3 border border-[#47ff8a]/30 bg-[#47ff8a]/5 text-[#47ff8a]">
          <Check className="w-4 h-4 shrink-0" />
          <span className="text-[12px]">Settings saved successfully.</span>
        </div>
      )}

      {/* Company Info */}
      <Section icon={Shield} title="Company Information">
        <Field label="Company Name">
          <input
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            className="w-full bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary transition-colors"
          />
        </Field>
      </Section>

      {/* Work Policy */}
      <Section icon={Globe} title="Work Policy">
        <Field label="Working Days">
          <div className="flex flex-wrap gap-2">
            {DAYS.map(({ short, full }) => (
              <button
                key={full}
                onClick={() => toggleDay(full)}
                className={`flex-1 py-2 text-[10px] tracking-[0.1em] uppercase font-bold border transition-colors ${
                  form.workingDays.includes(full)
                    ? "bg-primary/10 border-primary/40 text-primary"
                    : "border-outline text-foreground-muted hover:border-foreground-muted"
                }`}
              >
                {short}
              </button>
            ))}
          </div>
        </Field>
      </Section>

      {/* Shift Timings — temporarily commented out */}
      {/* <Section icon={Sunrise} title="Shift Timings">
        <Field
          label="Shift Hours"
          hint="Define the standard working hours for your company."
        >
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-[10px] tracking-[0.1em] uppercase text-foreground-muted mb-1.5">
                Start Time
              </p>
              <input
                type="time"
                value={form.shiftStart}
                onChange={(e) => setForm({ ...form, shiftStart: e.target.value })}
                className="w-full bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="text-foreground-muted text-[12px] mt-5">→</div>
            <div className="flex-1">
              <p className="text-[10px] tracking-[0.1em] uppercase text-foreground-muted mb-1.5">
                End Time
              </p>
              <input
                type="time"
                value={form.shiftEnd}
                onChange={(e) => setForm({ ...form, shiftEnd: e.target.value })}
                className="w-full bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
        </Field>
      </Section> */}

      {/* Daily Log Policy */}
      <Section icon={Clock} title="Daily Log Policy">
        <Field
          label="Log Submission Deadlines"
          hint="Employees must submit their work log before one of these times each day."
        >
          <div className="space-y-2">
            {form.logDeadlines.map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="time"
                  id={`log-deadline-${i}`}
                  value={t}
                  onChange={(e) => {
                    const updated = [...form.logDeadlines];
                    // Native <input type="time"> already emits HH:MM (24-hour).
                    // Don't normalize here — it would reset the field to "00:00"
                    // while the user is mid-edit (value is briefly "").
                    updated[i] = e.target.value;
                    setForm({ ...form, logDeadlines: updated });
                  }}
                  className="appearance-auto bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground focus:outline-none focus:border-primary transition-colors [color-scheme:dark]"
                />
                {form.logDeadlines.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        logDeadlines: form.logDeadlines.filter(
                          (_, j) => j !== i,
                        ),
                      })
                    }
                    className="text-foreground-muted hover:text-[#ff4747] transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            {/* + Add Deadline — temporarily commented out */}
            {/* <button
              type="button"
              onClick={() =>
                setForm({ ...form, logDeadlines: [...form.logDeadlines, "22:00"] })
              }
              className="flex items-center gap-1.5 text-[11px] text-primary hover:text-primary/80 transition-colors font-bold"
            >
              <Plus className="w-3 h-3" /> Add Deadline
            </button> */}
          </div>
        </Field>
      </Section>
    </div>
  );
}
