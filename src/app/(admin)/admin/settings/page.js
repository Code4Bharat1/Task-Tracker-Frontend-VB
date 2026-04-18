"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth/context";
import api, { getTokenPayload } from "@/lib/api";
import Avatar from "@/components/Avatar";
import { updateMe, uploadProfilePic } from "@/services/userService";
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
  Trophy,
  User,
  Camera,
  Mail,
  Building2,
  Crown,
  Edit3,
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
  defaultTaskDeadline: "20:00",
  missedTaskGracePeriod: 24,
  scoringRules: {
    taskOnTime: 2,
    taskEarly: 3,
    taskOverdue: -1,
    taskMissed: -5,
    dailyLogOnTime: 1,
    dailyLogMissed: -2,
    absentees: -5,
    discipline: -10,
  },
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

// ─── Profile Section Component ─────────────────────────────────
function ProfileSection({ user, setUser }) {
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPreview(user.profilePic?.url || null);
    }
  }, [user]);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }
    setError(null);
    setFile(f);
    if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    const url = URL.createObjectURL(f);
    setPreview(url);
    setIsEditing(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Please drop an image file");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }
    setError(null);
    setFile(f);
    if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    const url = URL.createObjectURL(f);
    setPreview(url);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await updateMe({ name });
      let finalUser = updated;
      if (file) {
        finalUser = await uploadProfilePic(user._id, file);
      }
      if (setUser) {
        setUser({ ...finalUser, role: finalUser.globalRole || finalUser.role });
      }
      setSaved(true);
      setIsEditing(false);
      setFile(null);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to save profile changes");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(user?.name || "");
    setPreview(user?.profilePic?.url || null);
    setFile(null);
    setError(null);
    setIsEditing(false);
    if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
  };

  const roleLabel = user?.globalRole || user?.role;
  const roleDisplay = roleLabel
    ?.replace(/_/g, " ")
    ?.replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div className="border border-outline bg-surface-low overflow-hidden">
      {/* Header Banner */}
      <div className="relative h-24 bg-linear-to-r from-primary/20 via-primary/10 to-surface-container">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] animate-pulse" />
      </div>

      <div className="px-6 pb-6 -mt-12">
        {/* Avatar and Main Info Row */}
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          {/* Avatar with Upload */}
          <div
            className={`relative group cursor-pointer transition-all duration-300 ${
              isDragging ? "scale-105" : ""
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div
              className={`relative w-24 h-24 rounded-full overflow-hidden ring-4 ring-surface-low transition-all duration-300 ${
                isDragging
                  ? "ring-primary ring-offset-2 ring-offset-primary/20"
                  : "hover:ring-primary/50"
              }`}
            >
              <Avatar name={name} src={preview} size={24} />
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
              {/* Drag Overlay */}
              {isDragging && (
                <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">Drop Image</span>
                </div>
              )}
            </div>
            {/* Edit Badge */}
            <button
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFile}
            />
          </div>

          {/* User Info */}
          <div className="flex-1 pt-14 sm:pt-2 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <h2 className="text-xl font-bold text-foreground truncate">
                {user?.name || "Admin User"}
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider rounded-full w-fit">
                <Crown className="w-3 h-3" />
                {roleDisplay}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 mt-2 text-sm text-foreground-muted">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                {user?.email || "No email"}
              </span>
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                {user?.companyId?.companyName || "Your Company"}
              </span>
            </div>
          </div>

          {/* Edit Button */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded transition-all duration-200 ${
              isEditing
                ? "bg-surface-container text-foreground-muted hover:text-foreground"
                : "bg-primary/10 text-primary hover:bg-primary/20"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            {isEditing ? "Close" : "Edit Profile"}
          </button>
        </div>

        {/* Expanded Edit Form */}
        <div
          className={`mt-6 transition-all duration-300 overflow-hidden ${
            isEditing ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="border-t border-outline pt-4 space-y-4">
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-xs">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {error}
              </div>
            )}

            {/* Success Message */}
            {saved && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded text-green-400 text-xs">
                <Check className="w-3.5 h-3.5 shrink-0" />
                Profile updated successfully
              </div>
            )}

            {/* Name Field */}
            <div>
              <label className="block text-[10px] tracking-[0.15em] uppercase text-foreground-muted mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-surface-container border border-outline px-3 py-2.5 text-sm text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary transition-colors rounded"
                placeholder="Enter your full name"
              />
            </div>

            {/* Photo Upload Hint */}
            <div className="flex items-start gap-2 text-xs text-foreground-muted">
              <Camera className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                Click on your avatar or drag and drop an image to upload a new profile photo.
                Supports JPG, PNG up to 5MB.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleSave}
                disabled={saving || !name.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary text-xs font-bold uppercase tracking-wider rounded hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    Save Changes
                  </>
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2 border border-outline text-foreground-muted text-xs font-bold uppercase tracking-wider rounded hover:border-foreground-muted hover:text-foreground transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function SettingsPage() {
  const { user, setUser } = useAuth();
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
        defaultTaskDeadline: normalizeTimeTo24(
          c.defaultTaskDeadline || "20:00",
        ),
        missedTaskGracePeriod: c.missedTaskGracePeriod ?? 24,
        scoringRules: { ...DEFAULT_FORM.scoringRules, ...c.scoringRules },
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
        defaultTaskDeadline: form.defaultTaskDeadline,
        missedTaskGracePeriod: form.missedTaskGracePeriod,
        scoringRules: form.scoringRules,
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
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* My Profile Section */}
      <ProfileSection user={user} setUser={setUser} />

      {/* Company Settings Header */}
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
                className={`flex-1 py-2 text-[10px] tracking-[0.1em] uppercase font-bold border transition-colors ${form.workingDays.includes(full)
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
                    updated[i] = e.target.value;
                    setForm({ ...form, logDeadlines: updated });
                  }}
                  className="appearance-auto bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground focus:outline-none focus:border-primary transition-colors" />
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

      {/* Scoring & Deadlines */}
      <Section icon={Trophy} title="Scoring Rules">
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Default Task Deadline"
            hint="Auto-applied when a task has no explicit deadline."
          >
            <input
              type="time"
              value={form.defaultTaskDeadline}
              onChange={(e) =>
                setForm({ ...form, defaultTaskDeadline: e.target.value })
              }
              className="appearance-auto bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </Field>
          <Field
            label="Missed Task Grace Period (hours)"
            hint="Hours after deadline before a task counts as missed."
          >
            <input
              type="number"
              min={0}
              value={form.missedTaskGracePeriod}
              onChange={(e) =>
                setForm({
                  ...form,
                  missedTaskGracePeriod: Number(e.target.value),
                })
              }
              className="w-full bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </Field>
        </div>

        <div>
          <p className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted mb-3 font-bold">
            Points Per Action
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                key: "taskEarly",
                label: "Task Completed Early",
                color: "text-[#47ff8a]",
              },
              {
                key: "taskOnTime",
                label: "Task On Time",
                color: "text-primary",
              },
              {
                key: "taskOverdue",
                label: "Task Overdue",
                color: "text-[#e8a847]",
              },
              {
                key: "taskMissed",
                label: "Task Missed",
                color: "text-[#ff4747]",
              },
              {
                key: "dailyLogOnTime",
                label: "Daily Log On Time",
                color: "text-primary",
              },
              {
                key: "dailyLogMissed",
                label: "Daily Log Missed",
                color: "text-[#ff4747]",
              },
              {
                key: "absentees",
                label: "Absentees",
                color: "text-[#ff4747]",
              },
              {
                key: "discipline",
                label: "Discipline",
                color: "text-[#ff4747]",
              },
            ].map(({ key, label, color }) => (
              <div
                key={key}
                className="flex items-center justify-between px-3 py-2.5 border border-outline bg-surface-container"
              >
                <span className={`text-[11px] font-semibold ${color}`}>
                  {label}
                </span>
                <input
                  type="number"
                  value={form.scoringRules[key]}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      scoringRules: {
                        ...form.scoringRules,
                        [key]: Number(e.target.value),
                      },
                    })
                  }
                  className="w-16 bg-surface-low border border-outline px-2 py-1 text-[12px] text-foreground text-center focus:outline-none focus:border-primary transition-colors input-number-themed"
                />
              </div>
            ))}
          </div>
        </div>
      </Section>
    </div>
  );
}
