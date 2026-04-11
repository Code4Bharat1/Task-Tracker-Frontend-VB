"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Layers,
  Users,
  Calendar,
  AlertCircle,
  Plus,
  X,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Bug,
  Circle,
  Loader2,
  FileText,
  Eye,
  Send,
  Pencil,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import AuthLoader from "@/components/AuthLoader";
import { TableSkeleton } from "@/components/skeletons";
import {
  getProject,
  updateProject,
  updateTestingPhase,
} from "@/services/projectService";
import { DatePicker } from "@/components/DatePicker";
import {
  getModules,
  createModule,
  updateModule,
  advanceModuleStatus,
  deleteModule,
  MODULE_STATUS_META,
} from "@/services/moduleService";
import { createBug, BUG_SEVERITIES } from "@/services/bugService";
import { getUsers } from "@/services/userService";

/* ── Status Colors ─────────────────────────────────────────── */
const MODULE_COLOR = {
  TODO: "text-foreground-muted border-foreground/10 bg-foreground/10",
  IN_PROGRESS: "text-[#47c8ff] border-[#47c8ff]/20 bg-[#47c8ff]/10",
  DEV_COMPLETE: "text-primary border-primary/20 bg-primary/10",
  CODE_REVIEW: "text-[#c847ff] border-[#c847ff]/20 bg-[#c847ff]/10",
  QA_TESTING: "text-[#e8a847] border-[#e8a847]/20 bg-[#e8a847]/10",
  APPROVED: "text-[#47ff8a] border-[#47ff8a]/20 bg-[#47ff8a]/10",
  REJECTED: "text-[#ff4747] border-[#ff4747]/20 bg-[#ff4747]/10",
  DEPLOYED: "text-[#47ff8a] border-[#47ff8a]/20 bg-[#47ff8a]/10",
};

const DEFAULT_TESTING_PHASES = [
  { name: "Frontend Testing", weight: 25, status: "PENDING" },
  { name: "Backend Testing", weight: 25, status: "PENDING" },
  { name: "Cybersecurity Testing", weight: 25, status: "PENDING" },
  { name: "SEO / Performance", weight: 25, status: "PENDING" },
];

function StatusBadge({ status }) {
  const c =
    MODULE_COLOR[status] ||
    "text-foreground-muted border-outline bg-foreground/5";
  return (
    <span
      className={`inline-flex px-2 py-0.5 text-[10px] tracking-[0.1em] uppercase font-bold border ${c}`}
    >
      {status?.replace(/_/g, " ")}
    </span>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-[10px] tracking-[0.15em] uppercase text-foreground-muted mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="text-[10px] text-[#ff4747] mt-1">{error}</p>}
    </div>
  );
}

function ModalShell({
  title,
  icon: Icon,
  iconColor,
  onClose,
  saving,
  children,
}) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handleKey = (e) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose, saving]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={!saving ? onClose : undefined}
      />
      <div className="relative w-full max-w-lg bg-surface-low border border-outline shadow-2xl z-10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline">
          <div className="flex items-center gap-3">
            {Icon && (
              <Icon className={`w-4 h-4 ${iconColor || "text-primary"}`} />
            )}
            <span className="text-[11px] tracking-[0.2em] uppercase font-bold text-foreground">
              {title}
            </span>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-foreground-muted hover:text-foreground transition-colors disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── Create / Edit Module Modal (PM) ──────────────────────── */
function ModuleModal({ module, developers, onClose, onSave }) {
  const isEdit = !!module;
  const [form, setForm] = useState({
    title: module?.title || "",
    description: module?.description || "",
    assignedTo: module?.assignedTo || "",
    deadline: module?.deadline ? module.deadline.slice(0, 10) : "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!form.title.trim()) e.title = "Title required";
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    try {
      setSaving(true);
      const dev = developers.find((d) => d._id === form.assignedTo);
      const payload = {
        ...form,
        assignedName: dev?.name || "",
      };
      await onSave(payload, isEdit ? module._id : null);
      onClose();
    } catch {
      /* */
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell
      title={isEdit ? "Edit Module" : "Create Module"}
      icon={Layers}
      onClose={onClose}
      saving={saving}
    >
      <div className="px-6 py-5 space-y-4">
        <Field label="Module Title *" error={errors.title}>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g., User Authentication"
            className="w-full bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary transition-colors"
          />
        </Field>
        <Field label="Description">
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            placeholder="Module description..."
            className="w-full bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary transition-colors resize-none"
          />
        </Field>
        <Field label="Assign Developer">
          <div className="relative">
            <select
              value={form.assignedTo}
              onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
              className="w-full appearance-none bg-surface-container border border-outline px-3 py-2.5 pr-8 text-[12px] text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
            >
              <option value="">Unassigned</option>
              {developers.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground-muted pointer-events-none" />
          </div>
        </Field>
        <Field label="Deadline">
          <DatePicker
            value={form.deadline}
            onChange={(deadline) => setForm({ ...form, deadline })}
          />
        </Field>
      </div>
      <div className="flex gap-2 px-6 pb-5 pt-2">
        <button
          onClick={onClose}
          disabled={saving}
          className="flex-1 py-2.5 text-[11px] tracking-[0.15em] uppercase font-bold border border-outline text-foreground-muted hover:text-foreground transition-colors disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 py-2.5 text-[11px] tracking-[0.15em] uppercase font-bold bg-primary text-on-primary hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Plus className="w-3.5 h-3.5" />
          )}
          {isEdit ? "Update" : "Create"} Module
        </button>
      </div>
    </ModalShell>
  );
}

/* ── Review Module Modal (PM reviews DEV_COMPLETE) ──────────── */
function ReviewModal({ module, onClose, onAction }) {
  const [saving, setSaving] = useState(false);
  const [action, setAction] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectReason, setShowRejectReason] = useState(false);

  async function handleAction(nextAction) {
    try {
      setSaving(true);
      setAction(nextAction);
      await onAction(module._id, nextAction, rejectReason.trim());
      onClose();
    } catch {
      /* */
    } finally {
      setSaving(false);
      setAction(null);
    }
  }

  return (
    <ModalShell
      title="Review Module"
      icon={Eye}
      iconColor="text-[#c847ff]"
      onClose={onClose}
      saving={saving}
    >
      <div className="px-6 py-5 space-y-4">
        <div className="border border-outline bg-surface-container p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-foreground font-semibold">
              {module.title}
            </span>
            <StatusBadge status={module.status} />
          </div>
          {module.assignedName && (
            <p className="text-[11px] text-foreground-muted">
              Assigned to:{" "}
              <span className="text-foreground">{module.assignedName}</span>
            </p>
          )}
          {module.description && (
            <p className="text-[12px] text-foreground-muted">
              {module.description}
            </p>
          )}
        </div>

        {module.completionNote && (
          <div className="border border-primary/20 bg-primary/5 p-4">
            <p className="text-[10px] tracking-[0.15em] uppercase text-primary font-bold mb-2">
              Developer&apos;s Completion Note
            </p>
            <p className="text-[12px] text-foreground leading-relaxed">
              {module.completionNote}
            </p>
          </div>
        )}

        <div className="border border-outline bg-surface-container/50 p-3">
          <p className="text-[10px] tracking-[0.1em] uppercase text-foreground-muted mb-1">
            Status Flow
          </p>
          <p className="text-[11px] text-foreground-muted">
            DEV_COMPLETE →{" "}
            <span className="text-[#c847ff] font-bold">CODE_REVIEW</span> →
            QA_TESTING
          </p>
        </div>

        {/* Reject reason — shown only when reject is clicked */}
        {showRejectReason && (
          <div className="border border-[#ff4747]/30 bg-[#ff4747]/5 p-4 space-y-2">
            <p className="text-[10px] tracking-[0.15em] uppercase text-[#ff4747] font-bold">
              Reject Reason (optional)
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Explain what needs to be fixed before resubmission..."
              className="w-full bg-surface-container border border-[#ff4747]/30 px-3 py-2.5 text-[12px] text-foreground placeholder-foreground-muted focus:outline-none focus:border-[#ff4747] transition-colors resize-none"
            />
            <p className="text-[10px] text-foreground-muted">
              Module will be moved back to{" "}
              <span className="text-[#47c8ff] font-bold">IN_PROGRESS</span>.
            </p>
          </div>
        )}
      </div>
      <div className="flex gap-2 px-6 pb-5 pt-2">
        <button
          onClick={onClose}
          disabled={saving}
          className="py-2.5 px-4 text-[11px] tracking-[0.15em] uppercase font-bold border border-outline text-foreground-muted hover:text-foreground transition-colors disabled:opacity-40"
        >
          Cancel
        </button>
        {!showRejectReason ? (
          <button
            onClick={() => setShowRejectReason(true)}
            disabled={saving}
            className="flex-1 py-2.5 text-[11px] tracking-[0.15em] uppercase font-bold border border-[#ff4747]/40 text-[#ff4747] hover:bg-[#ff4747]/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <X className="w-3.5 h-3.5" /> Reject
          </button>
        ) : (
          <button
            onClick={() => handleAction("IN_PROGRESS")}
            disabled={saving}
            className="flex-1 py-2.5 text-[11px] tracking-[0.15em] uppercase font-bold bg-[#ff4747] text-white hover:bg-[#ff4747]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {saving && action === "IN_PROGRESS" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <X className="w-3.5 h-3.5" />
            )}{" "}
            Confirm Reject
          </button>
        )}
        <button
          onClick={() => handleAction("CODE_REVIEW")}
          disabled={saving}
          className="flex-1 py-2.5 text-[11px] tracking-[0.15em] uppercase font-bold bg-[#c847ff] text-white hover:bg-[#c847ff]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {saving && action === "CODE_REVIEW" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Eye className="w-3.5 h-3.5" />
          )}{" "}
          Start Review
        </button>
      </div>
    </ModalShell>
  );
}

/* ── Submit for Testing Modal (PM moves CODE_REVIEW→QA_TESTING) */
function SubmitTestingModal({ module, onClose, onAction }) {
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    try {
      setSaving(true);
      await onAction(module._id, "QA_TESTING");
      onClose();
    } catch {
      /* */
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell
      title="Submit for Testing"
      icon={Send}
      iconColor="text-[#e8a847]"
      onClose={onClose}
      saving={saving}
    >
      <div className="px-6 py-5 space-y-4">
        <div className="border border-outline bg-surface-container p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-foreground font-semibold">
              {module.title}
            </span>
            <StatusBadge status={module.status} />
          </div>
          {module.assignedName && (
            <p className="text-[11px] text-foreground-muted">
              Assigned to:{" "}
              <span className="text-foreground">{module.assignedName}</span>
            </p>
          )}
        </div>
        <div className="border border-[#e8a847]/20 bg-[#e8a847]/5 p-3">
          <p className="text-[11px] text-[#e8a847]">
            This will move the module from{" "}
            <span className="font-bold">CODE_REVIEW</span> →{" "}
            <span className="font-bold">QA_TESTING</span> for the tester to
            verify.
          </p>
        </div>
      </div>
      <div className="flex gap-2 px-6 pb-5 pt-2">
        <button
          onClick={onClose}
          disabled={saving}
          className="flex-1 py-2.5 text-[11px] tracking-[0.15em] uppercase font-bold border border-outline text-foreground-muted hover:text-foreground transition-colors disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 py-2.5 text-[11px] tracking-[0.15em] uppercase font-bold bg-[#e8a847] text-white hover:bg-[#e8a847]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}{" "}
          Submit for Testing
        </button>
      </div>
    </ModalShell>
  );
}

/* ── Developer Completion Note Modal ──────────────────────── */
function CompletionNoteModal({ module, onClose, onSave }) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    try {
      setSaving(true);
      await onSave(module._id, note);
      onClose();
    } catch {
      /* */
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell
      title="Submit for Review"
      icon={Send}
      iconColor="text-primary"
      onClose={onClose}
      saving={saving}
    >
      <div className="px-6 py-5 space-y-4">
        <div className="border border-outline bg-surface-container p-4">
          <span className="text-[13px] text-foreground font-semibold">
            {module.title}
          </span>
          <p className="text-[11px] text-foreground-muted mt-1">
            IN_PROGRESS → awaiting PM review
          </p>
        </div>
        <Field label="Note for Reviewer (optional)">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder="Describe what was done, any notes for the reviewer..."
            className="w-full bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary transition-colors resize-none"
          />
        </Field>
      </div>
      <div className="flex gap-2 px-6 pb-5 pt-2">
        <button
          onClick={onClose}
          disabled={saving}
          className="flex-1 py-2.5 text-[11px] tracking-[0.15em] uppercase font-bold border border-outline text-foreground-muted hover:text-foreground transition-colors disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 py-2.5 text-[11px] tracking-[0.15em] uppercase font-bold bg-primary text-on-primary hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}{" "}
          Submit for Review
        </button>
      </div>
    </ModalShell>
  );
}

/* ── Delete Confirmation Modal (PM) ─────────────────────────── */
function DeleteModal({ module, onClose, onDelete }) {
  const [saving, setSaving] = useState(false);

  async function handleDelete() {
    try {
      setSaving(true);
      await onDelete(module._id);
      onClose();
    } catch {
      /* */
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell
      title="Delete Module"
      icon={Trash2}
      iconColor="text-[#ff4747]"
      onClose={onClose}
      saving={saving}
    >
      <div className="px-6 py-5">
        <p className="text-[12px] text-foreground-muted">
          Are you sure you want to delete{" "}
          <span className="text-foreground font-semibold">{module.title}</span>?
          This action cannot be undone.
        </p>
      </div>
      <div className="flex gap-2 px-6 pb-5 pt-2">
        <button
          onClick={onClose}
          disabled={saving}
          className="flex-1 py-2.5 text-[11px] tracking-[0.15em] uppercase font-bold border border-outline text-foreground-muted hover:text-foreground transition-colors disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={saving}
          className="flex-1 py-2.5 text-[11px] tracking-[0.15em] uppercase font-bold bg-[#ff4747] text-white hover:bg-[#ff4747]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Trash2 className="w-3.5 h-3.5" />
          )}{" "}
          Delete
        </button>
      </div>
    </ModalShell>
  );
}

/* ── Bug Report Modal ──────────────────────────────────────── */
function BugModal({
  moduleId,
  projectId,
  projectName,
  reporterId,
  reporterName,
  modules,
  developers,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    severity: "MEDIUM",
    moduleId: moduleId || "",
    assignedTo: "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handleKey = (e) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose, saving]);

  function validate() {
    const e = {};
    if (!form.title.trim()) e.title = "Title required";
    if (!form.description.trim()) e.description = "Description required";
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    try {
      setSaving(true);
      const mod = modules.find((m) => m._id === form.moduleId);
      const dev = developers.find((d) => d._id === form.assignedTo);
      await createBug({
        projectId,
        projectName,
        moduleId: form.moduleId || null,
        moduleTitle: mod?.title || "",
        title: form.title,
        description: form.description,
        severity: form.severity,
        reportedBy: reporterId,
        reportedByName: reporterName,
        assignedTo: form.assignedTo || "",
        assignedToName: dev?.name || "",
      });
      onSave();
      onClose();
    } catch {
      /* */
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell
      title="Report Bug"
      icon={Bug}
      iconColor="text-[#ff4747]"
      onClose={onClose}
      saving={saving}
    >
      <div className="px-6 py-5 space-y-4">
        <Field label="Bug Title *" error={errors.title}>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Short description"
            className="w-full bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary transition-colors"
          />
        </Field>
        <Field label="Description *" error={errors.description}>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            placeholder="Steps to reproduce..."
            className="w-full bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary transition-colors resize-none"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Module">
            <div className="relative">
              <select
                value={form.moduleId}
                onChange={(e) => setForm({ ...form, moduleId: e.target.value })}
                className="w-full appearance-none bg-surface-container border border-outline px-3 py-2.5 pr-8 text-[12px] text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
              >
                <option value="">General</option>
                {modules.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground-muted pointer-events-none" />
            </div>
          </Field>
          <Field label="Severity">
            <div className="relative">
              <select
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
                className="w-full appearance-none bg-surface-container border border-outline px-3 py-2.5 pr-8 text-[12px] text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
              >
                {(BUG_SEVERITIES || ["LOW", "MEDIUM", "HIGH", "CRITICAL"]).map(
                  (s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ),
                )}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground-muted pointer-events-none" />
            </div>
          </Field>
        </div>
        <Field label="Assign To">
          <div className="relative">
            <select
              value={form.assignedTo}
              onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
              className="w-full appearance-none bg-surface-container border border-outline px-3 py-2.5 pr-8 text-[12px] text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
            >
              <option value="">Unassigned</option>
              {developers.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground-muted pointer-events-none" />
          </div>
        </Field>
      </div>
      <div className="flex gap-2 px-6 pb-5 pt-2">
        <button
          onClick={onClose}
          disabled={saving}
          className="flex-1 py-2.5 text-[11px] tracking-[0.15em] uppercase font-bold border border-outline text-foreground-muted hover:text-foreground transition-colors disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 py-2.5 text-[11px] tracking-[0.15em] uppercase font-bold bg-[#ff4747] text-white hover:bg-[#ff4747]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Bug className="w-3.5 h-3.5" />
          )}{" "}
          Report Bug
        </button>
      </div>
    </ModalShell>
  );
}

/* ── Tester Approval Modal (Tester verifies QA_TESTING → APPROVED) ───────── */
function TesterApprovalModal({ module, onClose, onApprove }) {
  const [testingType, setTestingType] = useState("FUNCTIONAL");
  const [weightage, setWeightage] = useState(100);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handleKey = (e) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose, saving]);

  function validate() {
    const e = {};
    if (!testingType) e.testingType = "Select a testing type";
    const n = Number(weightage);
    if (!Number.isFinite(n) || n <= 0 || n > 100)
      e.weightage = "Weightage must be 1-100";
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    try {
      setSaving(true);
      await onApprove(module._id, {
        testingType,
        weightage: Number(weightage),
      });
      onClose();
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell
      title="Approve Module"
      icon={CheckCircle2}
      iconColor="text-[#47ff8a]"
      onClose={onClose}
      saving={saving}
    >
      <div className="px-6 py-5 space-y-4">
        <div className="border border-outline bg-surface-container p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-foreground font-semibold">
              {module.title}
            </span>
            <StatusBadge status={module.status} />
          </div>
          {module.assignedName && (
            <p className="text-[11px] text-foreground-muted">
              Assigned to:{" "}
              <span className="text-foreground">{module.assignedName}</span>
            </p>
          )}
        </div>

        <Field label="Testing Type" error={errors.testingType}>
          <div className="relative">
            <select
              value={testingType}
              onChange={(e) => setTestingType(e.target.value)}
              className="w-full appearance-none bg-surface-container border border-outline px-3 py-2.5 pr-8 text-[12px] text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
            >
              <option value="SMOKE">SMOKE</option>
              <option value="SANITY">SANITY</option>
              <option value="FUNCTIONAL">FUNCTIONAL</option>
              <option value="REGRESSION">REGRESSION</option>
              <option value="INTEGRATION">INTEGRATION</option>
              <option value="OTHER">OTHER</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground-muted pointer-events-none" />
          </div>
        </Field>
        <Field label="Weightage (%)" error={errors.weightage}>
          <input
            type="number"
            value={weightage}
            onChange={(e) => setWeightage(e.target.value)}
            min={1}
            max={100}
            className="w-full bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary transition-colors"
          />
        </Field>
      </div>
      <div className="flex gap-2 px-6 pb-5 pt-2">
        <button
          onClick={onClose}
          disabled={saving}
          className="flex-1 py-2.5 text-[11px] tracking-[0.15em] uppercase font-bold border border-outline text-foreground-muted hover:text-foreground transition-colors disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 py-2.5 text-[11px] tracking-[0.15em] uppercase font-bold bg-[#47ff8a] text-black hover:bg-[#47ff8a]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5" />
          )}{" "}
          Approve
        </button>
      </div>
    </ModalShell>
  );
}

/* ── Main Page ──────────────────────────────────────────────── */
export default function EmployeeProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading } = useAuth();
  const [project, setProject] = useState(null);
  const [modules, setModules] = useState([]);
  const [users, setUsers] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Modal state
  const [moduleModal, setModuleModal] = useState(null);
  const [reviewModal, setReviewModal] = useState(null);
  const [testingModal, setTestingModal] = useState(null);
  const [completionModal, setCompletionModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [bugModal, setBugModal] = useState(null);
  const [testerModal, setTesterModal] = useState(null);
  const [submittingProject, setSubmittingProject] = useState(false);
  const [phaseUpdating, setPhaseUpdating] = useState(null);
  const [deploying, setDeploying] = useState(false);

  useEffect(() => {
    if (
      !loading &&
      (!user ||
        !["employee", "project_manager", "developer", "tester"].includes(
          user?.role,
        ))
    )
      router.replace("/login");
  }, [user, loading, router]);

  const loadData = useCallback(async () => {
    if (!user || !params.id) return;
    try {
      setDataLoading(true);
      const [projR, modsR, usrsR] = await Promise.allSettled([
        getProject(params.id),
        getModules(params.id),
        getUsers(),
      ]);
      if (projR.status === "fulfilled") setProject(projR.value);
      else {
        setError("Failed to load project details.");
        return;
      }
      setModules(modsR.status === "fulfilled" ? modsR.value : []);
      setUsers(usrsR.status === "fulfilled" ? usrsR.value : []);
    } catch {
      setError("Failed to load project details.");
    } finally {
      setDataLoading(false);
    }
  }, [user, params.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading || !user) return <AuthLoader />;

  const myRole = project?.managerIds?.includes(user._id)
    ? "Project Manager"
    : project?.testerIds?.includes(user._id)
      ? "Tester"
      : project?.developerIds?.includes(user._id)
        ? "Developer"
        : "Member";

  const isPM = myRole === "Project Manager";
  const isDev = myRole === "Developer";
  const isTester = myRole === "Tester";

  const projectDevs = users.filter((u) =>
    project?.developerIds?.includes(u._id),
  );

  /* ── PM Actions ── */
  async function handleSaveModule(payload, moduleId) {
    if (moduleId) {
      await updateModule(moduleId, payload);
    } else {
      await createModule(params.id, payload);
    }
    const fresh = await getModules(params.id);
    setModules(fresh);
  }

  async function handleDeleteModule(moduleId) {
    await deleteModule(moduleId);
    const fresh = await getModules(params.id);
    setModules(fresh);
  }

  async function handlePMAction(moduleId, nextStatus, rejectReason) {
    const payload = { status: nextStatus };
    if (nextStatus === "IN_PROGRESS" && rejectReason) {
      payload.completionNote = `[REJECTED] ${rejectReason}`;
    }
    await updateModule(moduleId, payload);
    const fresh = await getModules(params.id);
    setModules(fresh);
  }

  /* ── Developer Actions ── */
  async function handleAdvance(moduleId) {
    try {
      setActionLoading(moduleId);
      await advanceModuleStatus(moduleId);
      const fresh = await getModules(params.id);
      setModules(fresh);
    } catch {
      /* */
    } finally {
      setActionLoading(null);
    }
  }

  async function handleMarkComplete(moduleId, note) {
    await updateModule(moduleId, {
      status: "DEV_COMPLETE",
      completionNote: note,
    });
    const fresh = await getModules(params.id);
    setModules(fresh);
  }

  /* ── Tester Actions ── */
  async function handleApprove(moduleId) {
    try {
      setActionLoading(moduleId);
      await updateModule(moduleId, { status: "APPROVED" });
      const fresh = await getModules(params.id);
      setModules(fresh);
    } catch {
      /* */
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRejectModule(moduleId) {
    try {
      setActionLoading(moduleId);
      await updateModule(moduleId, { status: "REJECTED" });
      const fresh = await getModules(params.id);
      setModules(fresh);
    } catch {
      /* ignore */
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUpdateTestingPhase(phaseIndex, status) {
    try {
      setPhaseUpdating(phaseIndex);
      const updated = await updateTestingPhase(params.id, phaseIndex, status);
      setProject(updated);
    } catch (err) {
      console.error("Failed to update testing phase:", err);
    } finally {
      setPhaseUpdating(null);
    }
  }

  async function handleSubmitProjectForTesting() {
    if (!project) return;
    const previousStatus = project.status;
    try {
      setSubmittingProject(true);
      // optimistic update so UI hides the button immediately
      setProject({ ...project, status: "QA_TESTING" });
      await updateProject(params.id, { status: "QA_TESTING" });
      const proj = await getProject(params.id);
      setProject(proj);
    } catch (err) {
      console.error("Submit project for testing failed:", err);
      // revert optimistic status
      setProject((p) => ({ ...(p || {}), status: previousStatus }));
      const msg =
        (err &&
          err.response &&
          err.response.data &&
          err.response.data.message) ||
        (err && err.message) ||
        "Failed to submit project for testing";
      setError(msg);
      // clear after a short delay so page doesn't stay in error state
      setTimeout(() => setError(null), 5000);
    } finally {
      setSubmittingProject(false);
    }
  }

  async function handleDeployProject() {
    if (!project) return;
    try {
      setDeploying(true);
      await updateProject(params.id, { status: "DEPLOYED" });
      const proj = await getProject(params.id);
      setProject(proj);
      const freshModules = await getModules(params.id);
      setModules(freshModules);
    } catch (err) {
      console.error("Deploy project failed:", err);
      const msg =
        (err &&
          err.response &&
          err.response.data &&
          err.response.data.message) ||
        (err && err.message) ||
        "Failed to deploy project";
      setError(msg);
      setTimeout(() => setError(null), 5000);
    } finally {
      setDeploying(false);
    }
  }

  if (dataLoading)
    return (
      <div className="space-y-6">
        <div className="h-6 w-48 bg-surface-high animate-pulse" />
        <TableSkeleton rows={4} cols={5} />
      </div>
    );

  if (error)
    return (
      <div className="flex items-center gap-3 px-4 py-3 border border-[#ff4747]/30 bg-[#ff4747]/5 text-[#ff4747]">
        <AlertCircle className="w-4 h-4" />
        <span className="text-[12px]">{error}</span>
      </div>
    );

  if (!project) return null;

  const completedCount = modules.filter((m) =>
    ["APPROVED", "DEPLOYED"].includes(m.status),
  ).length;
  const progress =
    modules.length > 0
      ? Math.round((completedCount / modules.length) * 100)
      : 0;

  const allPhasesPassed =
    Array.isArray(project?.testingPhases) &&
    project.testingPhases.length > 0 &&
    project.testingPhases.every((p) => p.status === "PASSED");

  const ROLE_BADGE = {
    "Project Manager": "text-[#e8a847] border-[#e8a847]/30 bg-[#e8a847]/10",
    Tester: "text-[#c847ff] border-[#c847ff]/30 bg-[#c847ff]/10",
    Developer: "text-primary border-primary/30 bg-primary/10",
    Member: "text-foreground-muted border-foreground/15 bg-foreground/10",
  };

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push("/employee/projects")}
        className="flex items-center gap-2 text-foreground-muted hover:text-foreground transition-colors text-[11px] tracking-[0.12em] uppercase font-bold"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects
      </button>

      {/* Project Header */}
      <div className="border border-outline bg-surface-low p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-foreground-muted mb-1">
              Project
            </p>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {project.name}
            </h1>
            {project.description && (
              <p className="text-[13px] text-foreground-muted mt-1">
                {project.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`inline-flex px-2.5 py-0.5 text-[10px] tracking-[0.1em] uppercase font-bold border ${
                project.status === "DEPLOYED"
                  ? "text-[#47ff8a] border-[#47ff8a]/30 bg-[#47ff8a]/10"
                  : project.status === "IN_PROGRESS"
                    ? "text-[#47c8ff] border-[#47c8ff]/30 bg-[#47c8ff]/10"
                    : "text-foreground-muted border-foreground/15 bg-foreground/10"
              }`}
            >
              {project.status?.replace(/_/g, " ")}
            </span>
            <span
              className={`px-2.5 py-0.5 text-[10px] tracking-[0.1em] uppercase font-bold border ${ROLE_BADGE[myRole]}`}
            >
              {myRole}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 text-[12px]">
          <div>
            <p className="text-[10px] text-foreground-muted uppercase tracking-[0.12em] mb-1">
              Modules
            </p>
            <p className="text-foreground font-semibold">
              {completedCount}/{modules.length} complete
            </p>
            <div className="mt-1.5 h-1 bg-surface-high w-full">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div>
            <p className="text-[10px] text-foreground-muted uppercase tracking-[0.12em] mb-1">
              Deadline
            </p>
            <div className="flex items-center gap-1.5 text-foreground">
              <Calendar className="w-3.5 h-3.5 text-foreground-muted" />
              <span className="font-semibold">
                {project.deadline
                  ? new Date(project.deadline).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "—"}
              </span>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-foreground-muted uppercase tracking-[0.12em] mb-1">
              Team Size
            </p>
            <div className="flex items-center gap-1.5 text-foreground">
              <Users className="w-3.5 h-3.5 text-foreground-muted" />
              <span className="font-semibold">
                {(project.developerIds?.length || 0) +
                  (project.managerIds?.length || 0) +
                  (project.testerIds?.length || 0)}{" "}
                members
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modules Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <h2 className="text-[11px] tracking-[0.15em] uppercase font-bold text-foreground-muted">
              Modules
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {isTester && (
              <button
                onClick={() => setBugModal("global")}
                className="flex items-center gap-2 px-3 py-2 border border-[#ff4747]/30 text-[#ff4747] hover:bg-[#ff4747]/10 text-[11px] tracking-[0.15em] uppercase font-bold transition-colors"
              >
                <Bug className="w-3.5 h-3.5" /> Report Bug
              </button>
            )}
            {isPM && (
              <button
                onClick={() => setModuleModal({ mode: "create" })}
                className="flex items-center gap-2 px-3 py-2 bg-primary text-on-primary hover:bg-primary/90 text-[11px] tracking-[0.15em] uppercase font-bold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Create Module
              </button>
            )}
          </div>
        </div>

        <div className="border border-outline bg-surface-low">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 border-b border-outline bg-surface-container">
            {["Module", "Status", "Assigned To", "Deadline", "Actions"].map((h) => (
              <span
                key={h}
                className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted font-bold"
              >
                {h}
              </span>
            ))}
          </div>

          {modules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-foreground-muted">
              <Layers className="w-8 h-8" />
              <p className="text-[12px] tracking-[0.1em] uppercase">
                No modules added yet
              </p>
              {isPM && (
                <p className="text-[11px] text-foreground-muted">
                  Click &quot;Create Module&quot; to add one.
                </p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-outline">
              {modules.map((m) => {
                const assignee = users.find((u) => u._id === m.assignedTo);
                const isMyModule = m.assignedTo === user._id;

                return (
                  <div
                    key={m._id}
                    className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3.5 items-center hover:bg-surface-container transition-colors"
                  >
                    {/* Module Info */}
                    <div>
                      <p
                        className={`text-[13px] font-semibold ${isMyModule ? "text-foreground" : "text-foreground-muted"}`}
                      >
                        {m.title}
                      </p>
                      {isMyModule && (
                        <p className="text-[10px] tracking-[0.1em] text-[#47c8ff] uppercase mt-0.5">
                          Your module
                        </p>
                      )}
                      {isMyModule &&
                        m.completionNote?.startsWith("[REJECTED]") && (
                          <p className="text-[10px] text-[#ff4747] mt-0.5 flex items-center gap-1">
                            <span className="font-bold">Rejected: </span>
                            {/* <X className="w-3 h-3 shrink-0" />{" "} */}
                            {m.completionNote
                              .replace("[REJECTED]", "")
                              .trim() ||
                              "Rejected by PM — please fix and resubmit."}
                          </p>
                        )}
                      {m.completionNote && isPM && (
                        <p className="text-[10px] text-foreground-muted mt-0.5 flex items-center gap-1">
                          <FileText className="w-3 h-3" /> Has completion note
                        </p>
                      )}
                    </div>

                    {/* Status */}
                    <StatusBadge status={m.status} />

                    {/* Assigned */}
                    <p className="text-[12px] text-foreground-muted">
                      {assignee?.name || "Unassigned"}
                    </p>

                    {/* Deadline */}
                    <p className="text-[12px] text-foreground-muted">
                      {m.deadline
                        ? new Date(m.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : "—"}
                    </p>

                    {/* Actions — Role-Specific */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* PM Actions */}
                      {isPM && (
                        <>
                          {m.status === "DEV_COMPLETE" && (
                            <button
                              onClick={() => setReviewModal(m)}
                              className="flex items-center gap-1 px-2 py-1.5 border border-[#c847ff]/30 text-[#c847ff] hover:bg-[#c847ff]/10 text-[9px] tracking-[0.1em] uppercase font-bold transition-colors"
                            >
                              <Eye className="w-3 h-3" /> Review
                            </button>
                          )}
                          {m.status === "CODE_REVIEW" && (
                            <button
                              onClick={() => setTestingModal(m)}
                              className="flex items-center gap-1 px-2 py-1.5 border border-[#e8a847]/30 text-[#e8a847] hover:bg-[#e8a847]/10 text-[9px] tracking-[0.1em] uppercase font-bold transition-colors"
                            >
                              <Eye className="w-3 h-3" /> Review Module
                            </button>
                          )}
                          <button
                            onClick={() =>
                              setModuleModal({ mode: "edit", module: m })
                            }
                            className="p-1.5 text-foreground-muted hover:text-foreground hover:bg-surface-container transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setDeleteModal(m)}
                            className="p-1.5 text-foreground-muted hover:text-[#ff4747] hover:bg-[#ff4747]/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}

                      {/* Developer Actions */}
                      {isDev && isMyModule && (
                        <>
                          {m.status === "DEV_COMPLETE" && (
                            <span className="text-[9px] tracking-[0.1em] uppercase font-bold text-[#e8a847] border border-[#e8a847]/30 bg-[#e8a847]/10 px-2 py-1.5">
                              Pending Review
                            </span>
                          )}
                          {m.status === "CODE_REVIEW" && (
                            <span className="text-[9px] tracking-[0.1em] uppercase font-bold text-[#c847ff] border border-[#c847ff]/30 bg-[#c847ff]/10 px-2 py-1.5">
                              In Code Review
                            </span>
                          )}
                          {m.status === "QA_TESTING" && (
                            <span className="text-[9px] tracking-[0.1em] uppercase font-bold text-[#47c8ff] border border-[#47c8ff]/30 bg-[#47c8ff]/10 px-2 py-1.5">
                              In QA Testing
                            </span>
                          )}
                          {m.status === "APPROVED" && (
                            <span className="text-[9px] tracking-[0.1em] uppercase font-bold text-[#47ff8a] border border-[#47ff8a]/30 bg-[#47ff8a]/10 px-2 py-1.5">
                              Approved
                            </span>
                          )}
                          {m.status === "TODO" && (
                            <button
                              disabled={actionLoading === m._id}
                              onClick={() => handleAdvance(m._id)}
                              className="flex items-center gap-1 px-2 py-1.5 border border-[#47c8ff]/30 text-[#47c8ff] hover:bg-[#47c8ff]/10 text-[9px] tracking-[0.1em] uppercase font-bold transition-colors disabled:opacity-50"
                            >
                              {actionLoading === m._id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <ChevronRight className="w-3 h-3" />
                              )}{" "}
                              Start Work
                            </button>
                          )}
                          {m.status === "IN_PROGRESS" && (
                            <button
                              onClick={() => setCompletionModal(m)}
                              className="flex items-center gap-1 px-2 py-1.5 border border-primary/30 text-primary hover:bg-primary/10 text-[9px] tracking-[0.1em] uppercase font-bold transition-colors"
                            >
                              <Send className="w-3 h-3" /> Submit for Review
                            </button>
                          )}
                        </>
                      )}

                      {/* Tester Actions */}
                      {isTester && (
                        <>
                          {m.status === "QA_TESTING" && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleApprove(m._id)}
                                disabled={actionLoading === m._id}
                                className="flex items-center gap-1 px-2 py-1.5 border border-[#47ff8a]/30 text-[#47ff8a] hover:bg-[#47ff8a]/10 text-[9px] tracking-[0.1em] uppercase font-bold transition-colors disabled:opacity-50"
                              >
                                {actionLoading === m._id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-3 h-3" />
                                )}{" "}
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectModule(m._id)}
                                disabled={actionLoading === m._id}
                                className="flex items-center gap-1 px-2 py-1.5 border border-[#ff4747]/30 text-[#ff4747] hover:bg-[#ff4747]/10 text-[9px] tracking-[0.1em] uppercase font-bold transition-colors disabled:opacity-50"
                              >
                                <X className="w-3 h-3" /> Reject
                              </button>
                            </div>
                          )}
                          {m.status === "APPROVED" && (
                            <span className="text-[9px] tracking-[0.1em] uppercase font-bold text-[#47ff8a] border border-[#47ff8a]/30 bg-[#47ff8a]/10 px-2 py-1.5">
                              Approved
                            </span>
                          )}
                          {m.status === "REJECTED" && (
                            <span className="text-[9px] tracking-[0.1em] uppercase font-bold text-[#ff4747] border border-[#ff4747]/30 bg-[#ff4747]/10 px-2 py-1.5">
                              Rejected
                            </span>
                          )}
                          <button
                            onClick={() => setBugModal(m._id)}
                            className="flex items-center gap-1 px-2 py-1.5 border border-[#ff4747]/30 text-[#ff4747] hover:bg-[#ff4747]/10 text-[9px] tracking-[0.1em] uppercase font-bold transition-colors"
                          >
                            <Bug className="w-3 h-3" /> Bug
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* PM: Submit Project for Testing (when all modules complete) */}
      {isPM &&
        modules.length > 0 &&
        completedCount === modules.length &&
        project?.status === "IN_PROGRESS" && (
          <div className="flex">
            <button
              disabled={submittingProject}
              onClick={handleSubmitProjectForTesting}
              className="flex items-center gap-2 px-4 py-2.5 border border-[#e8a847]/30 text-[#e8a847] hover:bg-[#e8a847]/10 text-[11px] tracking-[0.15em] uppercase font-bold transition-colors disabled:opacity-60"
            >
              {submittingProject ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              Submit Project for Testing
            </button>
          </div>
        )}

      {/* Testing Phases — visible when project is in QA_TESTING */}
      {project?.status === "QA_TESTING" && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 text-[#e8a847]" />
            <h2 className="text-[11px] tracking-[0.15em] uppercase font-bold text-foreground-muted">
              Testing Phases
            </h2>
            <span className="text-[10px] text-foreground-muted">
              &mdash; each phase carries 25% of total test coverage
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(project.testingPhases?.length
              ? project.testingPhases
              : DEFAULT_TESTING_PHASES
            ).map((phase, idx) => (
              <div
                key={phase.name}
                className={`border p-4 space-y-3 ${
                  phase.status === "PASSED"
                    ? "border-[#47ff8a]/30 bg-[#47ff8a]/5"
                    : phase.status === "FAILED"
                      ? "border-[#ff4747]/30 bg-[#ff4747]/5"
                      : "border-outline bg-surface-low"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-foreground">
                    {phase.name}
                  </span>
                  <span className="text-[10px] font-bold text-foreground-muted">
                    {phase.weight}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] tracking-[0.1em] uppercase font-bold px-2 py-0.5 border ${
                      phase.status === "PASSED"
                        ? "text-[#47ff8a] border-[#47ff8a]/30 bg-[#47ff8a]/10"
                        : phase.status === "FAILED"
                          ? "text-[#ff4747] border-[#ff4747]/30 bg-[#ff4747]/10"
                          : "text-foreground-muted border-outline bg-foreground/5"
                    }`}
                  >
                    {phase.status}
                  </span>
                  {isTester && (
                    <div className="flex gap-1.5">
                      {phase.status !== "PASSED" && (
                        <button
                          onClick={() =>
                            handleUpdateTestingPhase(idx, "PASSED")
                          }
                          disabled={phaseUpdating === idx}
                          className="flex items-center gap-1 px-2 py-1 border border-[#47ff8a]/30 text-[#47ff8a] hover:bg-[#47ff8a]/10 text-[9px] tracking-[0.1em] uppercase font-bold transition-colors disabled:opacity-50"
                        >
                          {phaseUpdating === idx ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3" />
                          )}{" "}
                          Pass
                        </button>
                      )}
                      {phase.status !== "FAILED" && (
                        <button
                          onClick={() =>
                            handleUpdateTestingPhase(idx, "FAILED")
                          }
                          disabled={phaseUpdating === idx}
                          className="flex items-center gap-1 px-2 py-1 border border-[#ff4747]/30 text-[#ff4747] hover:bg-[#ff4747]/10 text-[9px] tracking-[0.1em] uppercase font-bold transition-colors disabled:opacity-50"
                        >
                          <X className="w-3 h-3" /> Fail
                        </button>
                      )}
                      {phase.status !== "PENDING" && (
                        <button
                          onClick={() =>
                            handleUpdateTestingPhase(idx, "PENDING")
                          }
                          disabled={phaseUpdating === idx}
                          className="px-2 py-1 border border-outline text-foreground-muted hover:text-foreground text-[9px] tracking-[0.1em] uppercase font-bold transition-colors disabled:opacity-50"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {isPM && allPhasesPassed && project?.status === "QA_TESTING" && (
            <div className="mt-4">
              <button
                disabled={deploying}
                onClick={handleDeployProject}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#47ff8a] text-black border border-[#47ff8a]/30 hover:bg-[#47ff8a]/90 text-[11px] tracking-[0.15em] uppercase font-bold transition-colors disabled:opacity-60"
              >
                {deploying ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Deploy Project
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {moduleModal && (
        <ModuleModal
          module={moduleModal.mode === "edit" ? moduleModal.module : null}
          developers={
            projectDevs.length
              ? projectDevs
              : users.filter((u) => u.globalRole === "employee")
          }
          onClose={() => setModuleModal(null)}
          onSave={handleSaveModule}
        />
      )}
      {reviewModal && (
        <ReviewModal
          module={reviewModal}
          onClose={() => setReviewModal(null)}
          onAction={handlePMAction}
        />
      )}
      {testingModal && (
        <SubmitTestingModal
          module={testingModal}
          onClose={() => setTestingModal(null)}
          onAction={handlePMAction}
        />
      )}
      {completionModal && (
        <CompletionNoteModal
          module={completionModal}
          onClose={() => setCompletionModal(null)}
          onSave={handleMarkComplete}
        />
      )}
      {deleteModal && (
        <DeleteModal
          module={deleteModal}
          onClose={() => setDeleteModal(null)}
          onDelete={handleDeleteModule}
        />
      )}
      {
        testerModal &&
          null /* TesterApprovalModal retired; tester now uses inline approve/reject buttons */
      }
      {bugModal && (
        <BugModal
          moduleId={bugModal === "global" ? null : bugModal}
          projectId={params.id}
          projectName={project.name}
          reporterId={user._id}
          reporterName={user.name}
          modules={modules}
          developers={
            projectDevs.length
              ? projectDevs
              : users.filter((u) => u.globalRole === "employee")
          }
          onClose={() => setBugModal(null)}
          onSave={loadData}
        />
      )}
    </div>
  );
}
