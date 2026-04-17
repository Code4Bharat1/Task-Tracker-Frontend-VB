"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckSquare,
  Users,
  Calendar,
  AlertCircle,
  Plus,
  X,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Bug,
  Loader2,
  FileText,
  Send,
  Pencil,
  Trash2,
  Upload,
  Paperclip,
  Clock,
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
  getTasks,
  createTask,
  updateTask,
  advanceTaskStatus,
  deleteTask,
  uploadTaskAttachment,
  deleteTaskAttachment,
  TASK_PRIORITY_META,
} from "@/services/taskService";
import { createBug, BUG_SEVERITIES } from "@/services/bugService";
import { getUsers } from "@/services/userService";

/* ── Status Colors ─────────────────────────────────────────── */
const TASK_COLOR = {
  TODO: "text-foreground-muted border-foreground/10 bg-foreground/10",
  IN_PROGRESS: "text-[#47c8ff] border-[#47c8ff]/20 bg-[#47c8ff]/10",
  IN_REVIEW: "text-[#e8a847] border-[#e8a847]/20 bg-[#e8a847]/10",
  DONE: "text-[#47ff8a] border-[#47ff8a]/20 bg-[#47ff8a]/10",
  REJECTED: "text-[#ff4747] border-[#ff4747]/20 bg-[#ff4747]/10",
};

const DEFAULT_TESTING_PHASES = [
  { name: "Frontend Testing", weight: 25, status: "PENDING" },
  { name: "Backend Testing", weight: 25, status: "PENDING" },
  { name: "Cybersecurity Testing", weight: 25, status: "PENDING" },
  { name: "SEO / Performance", weight: 25, status: "PENDING" },
];

function StatusBadge({ status }) {
  const c =
    TASK_COLOR[status] ||
    "text-foreground-muted border-outline bg-foreground/5";
  return (
    <span
      className={`inline-flex px-2 py-0.5 text-[10px] tracking-[0.1em] uppercase font-bold border ${c}`}
    >
      {status?.replace(/_/g, " ")}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const m = TASK_PRIORITY_META?.[priority];
  if (!m) return null;
  return (
    <span
      className={`inline-flex px-2 py-0.5 text-[10px] tracking-[0.1em] uppercase font-bold border ${m.bg || ""} ${m.border || ""} ${m.color || ""}`}
    >
      {m.label || priority}
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
    const handler = (e) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handler);
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

function UserMultiSelect({ label, users, selected, onChange }) {
  function toggle(id) {
    onChange(
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id],
    );
  }
  return (
    <Field label={label}>
      <div className="border border-outline bg-surface-container max-h-36 overflow-y-auto divide-y divide-outline">
        {users.length === 0 ? (
          <p className="px-3 py-2 text-[11px] text-foreground-muted">
            No users available
          </p>
        ) : (
          users.map((u) => (
            <label
              key={u._id}
              className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-surface-high transition-colors"
            >
              <input
                type="checkbox"
                checked={selected.includes(u._id)}
                onChange={() => toggle(u._id)}
                className="accent-primary w-3.5 h-3.5"
              />
              <span className="text-[12px] text-foreground">{u.name}</span>
              <span className="text-[10px] text-foreground-muted ml-auto">
                {u.role || u.globalRole}
              </span>
            </label>
          ))
        )}
      </div>
    </Field>
  );
}

/* ── Task Modal (Create / Edit) ─────────────────────────────── */
function TaskModal({ task, allUsers, onClose, onSave }) {
  const isEdit = !!task;
  const [form, setForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    priority: task?.priority || "MEDIUM",
    deadline: task?.deadline ? task.deadline.slice(0, 10) : "",
    startTime: task?.startTime || "",
    endTime: task?.endTime || "",
  });
  const [contributors, setContributors] = useState(
    (task?.contributors || []).map((c) => c.userId?._id || c.userId),
  );
  const [reviewers, setReviewers] = useState(
    (task?.reviewers || []).map((r) => r.userId?._id || r.userId),
  );
  const [attachments, setAttachments] = useState(task?.attachments || []);
  const [uploading, setUploading] = useState(false);
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
      await onSave(
        { ...form, contributors, reviewers },
        isEdit ? task._id : null,
      );
      onClose();
    } catch {
      /* */
    } finally {
      setSaving(false);
    }
  }

  const devUsers = allUsers.filter(
    (u) => u.role === "developer" || u.globalRole === "developer",
  );
  const testerUsers = allUsers.filter(
    (u) => u.role === "tester" || u.globalRole === "tester",
  );

  return (
    <ModalShell
      title={isEdit ? "Edit Task" : "Create Task"}
      icon={CheckSquare}
      onClose={onClose}
      saving={saving}
    >
      <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
        <Field label="Task Title *" error={errors.title}>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g., Implement login flow"
            className="w-full bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary transition-colors"
          />
        </Field>
        <Field label="Description">
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            placeholder="Task description..."
            className="w-full bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary transition-colors resize-none"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Priority">
            <div className="relative">
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full appearance-none bg-surface-container border border-outline px-3 py-2.5 pr-8 text-[12px] text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
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
        <div className="grid grid-cols-2 gap-4">
          <Field label="Start Time">
            <input
              type="time"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              className="w-full bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground focus:outline-none focus:border-primary transition-colors [color-scheme:dark]"
            />
          </Field>
          <Field label="End Time">
            <input
              type="time"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              className="w-full bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground focus:outline-none focus:border-primary transition-colors [color-scheme:dark]"
            />
          </Field>
        </div>
        {isEdit && (
          <Field label="Attachments">
            <div className="space-y-2">
              {attachments.map((att) => (
                <div
                  key={att.publicId}
                  className="flex items-center justify-between px-3 py-2 border border-outline bg-surface-container"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Paperclip className="w-3 h-3 text-foreground-muted shrink-0" />
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[12px] text-primary hover:underline truncate"
                    >
                      {att.fileName}
                    </a>
                    <span className="text-[10px] text-foreground-muted shrink-0">
                      {att.fileType}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await deleteTaskAttachment(task._id, att.publicId);
                        setAttachments((prev) =>
                          prev.filter((a) => a.publicId !== att.publicId),
                        );
                      } catch {
                        /* */
                      }
                    }}
                    className="text-foreground-muted hover:text-[#ff4747] transition-colors shrink-0 ml-2"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {attachments.length < 5 && (
                <label className="flex items-center justify-center gap-2 py-3 border border-dashed border-outline hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors">
                  <input
                    type="file"
                    accept="image/*,.pdf,.docx"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        setUploading(true);
                        const res = await uploadTaskAttachment(task._id, file);
                        setAttachments(
                          res.attachments || [...attachments, res],
                        );
                      } catch {
                        /* */
                      } finally {
                        setUploading(false);
                        e.target.value = "";
                      }
                    }}
                  />
                  {uploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 text-foreground-muted" />
                  )}
                  <span className="text-[10px] tracking-[0.1em] uppercase font-bold text-foreground-muted">
                    {uploading ? "Uploading..." : "Attach file"}
                  </span>
                </label>
              )}
            </div>
          </Field>
        )}
        <UserMultiSelect
          label="Contributors (Developers)"
          users={devUsers}
          selected={contributors}
          onChange={setContributors}
        />
        <UserMultiSelect
          label="Reviewers (Testers)"
          users={testerUsers}
          selected={reviewers}
          onChange={setReviewers}
        />
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
          {isEdit ? "Update" : "Create"} Task
        </button>
      </div>
    </ModalShell>
  );
}

/* ── Submit for Review Modal (Contributor) ─────────────────── */
function SubmitReviewModal({ task, onClose, onSave }) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    try {
      setSaving(true);
      await onSave(task._id, note.trim());
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
          <p className="text-[13px] text-foreground font-semibold">
            {task.title}
          </p>
          <p className="text-[11px] text-foreground-muted mt-1">
            Status will change: IN_PROGRESS → IN_REVIEW
          </p>
        </div>
        <Field label="Note for Reviewer (optional)">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder="Describe what was done, or anything the reviewer should know..."
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
          )}
          Submit for Review
        </button>
      </div>
    </ModalShell>
  );
}

/* ── Review Modal (Reviewer) ────────────────────────────────── */
function ReviewModal({ task, onClose, onAction }) {
  const [saving, setSaving] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const [showReject, setShowReject] = useState(false);
  const [rejectNote, setRejectNote] = useState("");

  async function handleAction(nextStatus) {
    try {
      setSaving(true);
      setActiveAction(nextStatus);
      await onAction(task._id, nextStatus, rejectNote.trim());
      onClose();
    } catch {
      /* */
    } finally {
      setSaving(false);
      setActiveAction(null);
    }
  }

  return (
    <ModalShell
      title="Review Task"
      icon={CheckCircle2}
      iconColor="text-[#e8a847]"
      onClose={onClose}
      saving={saving}
    >
      <div className="px-6 py-5 space-y-4">
        <div className="border border-outline bg-surface-container p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-foreground">
              {task.title}
            </p>
            <StatusBadge status={task.status} />
          </div>
          {task.completionNote && (
            <div className="border border-primary/20 bg-primary/5 p-3">
              <p className="text-[10px] tracking-[0.15em] uppercase text-primary font-bold mb-1">
                Contributor Note
              </p>
              <p className="text-[12px] text-foreground leading-relaxed">
                {task.completionNote}
              </p>
            </div>
          )}
        </div>
        {showReject && (
          <div className="border border-[#ff4747]/30 bg-[#ff4747]/5 p-4 space-y-2">
            <p className="text-[10px] tracking-[0.15em] uppercase text-[#ff4747] font-bold">
              Reject Reason (optional)
            </p>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={3}
              placeholder="Explain what needs to be changed..."
              className="w-full bg-surface-container border border-[#ff4747]/30 px-3 py-2.5 text-[12px] text-foreground placeholder-foreground-muted focus:outline-none focus:border-[#ff4747] transition-colors resize-none"
            />
            <p className="text-[10px] text-foreground-muted">
              Task will move back to{" "}
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
        {!showReject ? (
          <button
            onClick={() => setShowReject(true)}
            disabled={saving}
            className="flex-1 py-2.5 text-[11px] tracking-[0.15em] uppercase font-bold border border-[#ff4747]/40 text-[#ff4747] hover:bg-[#ff4747]/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <X className="w-3.5 h-3.5" /> Reject
          </button>
        ) : (
          <button
            onClick={() => handleAction("REJECTED")}
            disabled={saving}
            className="flex-1 py-2.5 text-[11px] tracking-[0.15em] uppercase font-bold bg-[#ff4747] text-white hover:bg-[#ff4747]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {saving && activeAction === "REJECTED" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <X className="w-3.5 h-3.5" />
            )}
            Confirm Reject
          </button>
        )}
        <button
          onClick={() => handleAction("DONE")}
          disabled={saving}
          className="flex-1 py-2.5 text-[11px] tracking-[0.15em] uppercase font-bold bg-[#47ff8a] text-black hover:bg-[#47ff8a]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {saving && activeAction === "DONE" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5" />
          )}
          Approve
        </button>
      </div>
    </ModalShell>
  );
}

/* ── Delete Modal ──────────────────────────────────────────── */
function DeleteModal({ task, onClose, onDelete }) {
  const [saving, setSaving] = useState(false);

  async function handleDelete() {
    try {
      setSaving(true);
      await onDelete(task._id);
      onClose();
    } catch {
      /* */
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell
      title="Delete Task"
      icon={Trash2}
      iconColor="text-[#ff4747]"
      onClose={onClose}
      saving={saving}
    >
      <div className="px-6 py-5">
        <p className="text-[12px] text-foreground-muted">
          Delete{" "}
          <span className="text-foreground font-semibold">{task.title}</span>?
          This cannot be undone.
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
          )}
          Delete
        </button>
      </div>
    </ModalShell>
  );
}

/* ── Bug Modal ─────────────────────────────────────────────── */
function BugModal({
  taskId,
  projectId,
  projectName,
  reporterId,
  reporterName,
  tasks,
  allUsers,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    severity: "MEDIUM",
    taskId: taskId || "",
    assignedTo: "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handler = (e) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handler);
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
      const t = tasks.find((x) => x._id === form.taskId);
      const dev = allUsers.find((u) => u._id === form.assignedTo);
      await createBug({
        projectId,
        projectName,
        taskId: form.taskId || null,
        taskTitle: t?.title || "",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={!saving ? onClose : undefined}
      />
      <div className="relative w-full max-w-lg bg-surface-low border border-outline shadow-2xl z-10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline">
          <div className="flex items-center gap-3">
            <Bug className="w-4 h-4 text-[#ff4747]" />
            <span className="text-[11px] tracking-[0.2em] uppercase font-bold text-foreground">
              Report Bug
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
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
              placeholder="Steps to reproduce..."
              className="w-full bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Related Task">
              <div className="relative">
                <select
                  value={form.taskId}
                  onChange={(e) => setForm({ ...form, taskId: e.target.value })}
                  className="w-full appearance-none bg-surface-container border border-outline px-3 py-2.5 pr-8 text-[12px] text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  <option value="">General</option>
                  {tasks.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.title}
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
                  onChange={(e) =>
                    setForm({ ...form, severity: e.target.value })
                  }
                  className="w-full appearance-none bg-surface-container border border-outline px-3 py-2.5 pr-8 text-[12px] text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  {(
                    BUG_SEVERITIES || ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
                  ).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground-muted pointer-events-none" />
              </div>
            </Field>
          </div>
          <Field label="Assign To">
            <div className="relative">
              <select
                value={form.assignedTo}
                onChange={(e) =>
                  setForm({ ...form, assignedTo: e.target.value })
                }
                className="w-full appearance-none bg-surface-container border border-outline px-3 py-2.5 pr-8 text-[12px] text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
              >
                <option value="">Unassigned</option>
                {allUsers.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
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
            )}
            Report Bug
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────── */
export default function EmployeeProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Modals
  const [taskModal, setTaskModal] = useState(null); // null | { mode: "create" | "edit", task? }
  const [submitReviewModal, setSubmitReviewModal] = useState(null);
  const [reviewModal, setReviewModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [bugModal, setBugModal] = useState(null); // null | "global" | taskId
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
      const [projR, tasksR, usrsR] = await Promise.allSettled([
        getProject(params.id),
        getTasks(params.id),
        getUsers(),
      ]);
      if (projR.status === "fulfilled") setProject(projR.value);
      else {
        setError("Failed to load project details.");
        return;
      }
      setTasks(tasksR.status === "fulfilled" ? tasksR.value : []);
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

  const isPM = user?.role === "project_manager";
  const isDev = user?.role === "developer";
  const isTester = user?.role === "tester";

  async function handleSaveTask(payload, taskId) {
    if (taskId) await updateTask(taskId, payload);
    else await createTask(params.id, payload);
    setTasks(await getTasks(params.id));
  }

  async function handleDeleteTask(taskId) {
    await deleteTask(taskId);
    setTasks(await getTasks(params.id));
  }

  async function handleAdvance(taskId) {
    try {
      setActionLoading(taskId);
      await advanceTaskStatus(taskId);
      setTasks(await getTasks(params.id));
    } catch {
      /* */
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSubmitForReview(taskId, note) {
    await updateTask(taskId, { status: "IN_REVIEW", completionNote: note });
    setTasks(await getTasks(params.id));
  }

  async function handleReviewAction(taskId, nextStatus, rejectNote) {
    const payload = { status: nextStatus };
    if (nextStatus === "REJECTED" && rejectNote)
      payload.completionNote = `[REJECTED] ${rejectNote}`;
    await updateTask(taskId, payload);
    setTasks(await getTasks(params.id));
  }

  async function handleUpdateTestingPhase(phaseIndex, status) {
    try {
      setPhaseUpdating(phaseIndex);
      const updated = await updateTestingPhase(params.id, phaseIndex, status);
      setProject(updated);
    } catch (err) {
      console.error("Phase update failed:", err);
    } finally {
      setPhaseUpdating(null);
    }
  }

  async function handleSubmitProjectForTesting() {
    if (!project) return;
    const prev = project.status;
    try {
      setSubmittingProject(true);
      setProject({ ...project, status: "IN_PROGRESS" });
      await updateProject(params.id, { status: "IN_PROGRESS" });
      setProject(await getProject(params.id));
    } catch (err) {
      setProject((p) => ({ ...(p || {}), status: prev }));
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to submit project for testing",
      );
      setTimeout(() => setError(null), 5000);
    } finally {
      setSubmittingProject(false);
    }
  }

  async function handleDeployProject() {
    if (!project) return;
    try {
      setDeploying(true);
      await updateProject(params.id, { status: "COMPLETED" });
      setProject(await getProject(params.id));
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to deploy project",
      );
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

  if (error && !project)
    return (
      <div className="flex items-center gap-3 px-4 py-3 border border-[#ff4747]/30 bg-[#ff4747]/5 text-[#ff4747]">
        <AlertCircle className="w-4 h-4" />
        <span className="text-[12px]">{error}</span>
      </div>
    );

  if (!project) return null;

  const doneCount = tasks.filter((t) => t.status === "DONE").length;
  const progress =
    tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;
  const allPhasesPassed =
    Array.isArray(project?.testingPhases) &&
    project.testingPhases.length > 0 &&
    project.testingPhases.every((p) => p.status === "PASSED");

  const ROLE_BADGE = {
    project_manager: "text-[#e8a847] border-[#e8a847]/30 bg-[#e8a847]/10",
    tester: "text-[#c847ff] border-[#c847ff]/30 bg-[#c847ff]/10",
    developer: "text-primary border-primary/30 bg-primary/10",
    employee: "text-foreground-muted border-foreground/15 bg-foreground/10",
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push("/employee/projects")}
        className="flex items-center gap-2 text-foreground-muted hover:text-foreground transition-colors text-[11px] tracking-[0.12em] uppercase font-bold"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects
      </button>

      {error && (
        <div className="flex items-center gap-3 px-4 py-3 border border-[#ff4747]/30 bg-[#ff4747]/5 text-[#ff4747]">
          <AlertCircle className="w-4 h-4" />
          <span className="text-[12px]">{error}</span>
        </div>
      )}

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
              className={`inline-flex px-2.5 py-0.5 text-[10px] tracking-[0.1em] uppercase font-bold border ${project.status === "COMPLETED" ? "text-[#47ff8a] border-[#47ff8a]/30 bg-[#47ff8a]/10" : project.status === "IN_PROGRESS" ? "text-[#47c8ff] border-[#47c8ff]/30 bg-[#47c8ff]/10" : "text-foreground-muted border-foreground/15 bg-foreground/10"}`}
            >
              {project.status?.replace(/_/g, " ")}
            </span>
            <span
              className={`px-2.5 py-0.5 text-[10px] tracking-[0.1em] uppercase font-bold border ${ROLE_BADGE[user.role] || ROLE_BADGE.employee}`}
            >
              {user.role?.replace(/_/g, " ")}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-6 text-[12px]">
          <div>
            <p className="text-[10px] text-foreground-muted uppercase tracking-[0.12em] mb-1">
              Tasks
            </p>
            <p className="text-foreground font-semibold">
              {doneCount}/{tasks.length} done
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
              Team
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

      {/* Tasks Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-primary" />
            <h2 className="text-[11px] tracking-[0.15em] uppercase font-bold text-foreground-muted">
              Tasks
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
                onClick={() => setTaskModal({ mode: "create" })}
                className="flex items-center gap-2 px-3 py-2 bg-primary text-on-primary hover:bg-primary/90 text-[11px] tracking-[0.15em] uppercase font-bold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Create Task
              </button>
            )}
          </div>
        </div>

        <div className="border border-outline bg-surface-low">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 border-b border-outline bg-surface-container">
            {["Task", "Status", "Assignees", "Deadline", "Actions"].map((h) => (
              <span
                key={h}
                className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted font-bold"
              >
                {h}
              </span>
            ))}
          </div>

          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-foreground-muted">
              <CheckSquare className="w-8 h-8" />
              <p className="text-[12px] tracking-[0.1em] uppercase">
                No tasks yet
              </p>
              {isPM && (
                <p className="text-[11px] text-foreground-muted">
                  Click &quot;Create Task&quot; to get started.
                </p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-outline">
              {tasks.map((t) => {
                const cNames = (t.contributors || []).map(
                  (c) =>
                    c.userId?.name ||
                    users.find((u) => u._id === (c.userId?._id || c.userId))
                      ?.name ||
                    "—",
                );
                const rNames = (t.reviewers || []).map(
                  (r) =>
                    r.userId?.name ||
                    users.find((u) => u._id === (r.userId?._id || r.userId))
                      ?.name ||
                    "—",
                );
                const isMyContrib = (t.contributors || []).some(
                  (c) => (c.userId?._id || c.userId) === user._id,
                );
                const isMyReviewer = (t.reviewers || []).some(
                  (r) => (r.userId?._id || r.userId) === user._id,
                );

                return (
                  <div
                    key={t._id}
                    className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3.5 items-center hover:bg-surface-container transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p
                          className={`text-[13px] font-semibold ${isMyContrib || isMyReviewer ? "text-foreground" : "text-foreground-muted"}`}
                        >
                          {t.title}
                        </p>
                        <PriorityBadge priority={t.priority} />
                      </div>
                      {(isMyContrib || isMyReviewer) && (
                        <p className="text-[10px] tracking-[0.1em] text-[#47c8ff] uppercase">
                          {isMyContrib ? "Your task" : "You are reviewer"}
                        </p>
                      )}
                      {isMyContrib &&
                        t.completionNote?.startsWith("[REJECTED]") && (
                          <p className="text-[10px] text-[#ff4747] mt-0.5">
                            <span className="font-bold">Rejected: </span>
                            {t.completionNote
                              .replace("[REJECTED]", "")
                              .trim() || "Please fix and resubmit."}
                          </p>
                        )}
                      {t.completionNote &&
                        isPM &&
                        !t.completionNote.startsWith("[REJECTED]") && (
                          <p className="text-[10px] text-foreground-muted mt-0.5 flex items-center gap-1">
                            <FileText className="w-3 h-3" /> Has completion note
                          </p>
                        )}
                      {t.attachments?.length > 0 && (
                        <p className="text-[10px] text-foreground-muted mt-0.5 flex items-center gap-1">
                          <Paperclip className="w-3 h-3" />{" "}
                          {t.attachments.length} file
                          {t.attachments.length > 1 ? "s" : ""}
                        </p>
                      )}
                      {(t.startTime || t.endTime) && (
                        <p className="text-[10px] text-foreground-muted mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {t.startTime || "—"} →{" "}
                          {t.endTime || "—"}
                        </p>
                      )}
                    </div>

                    <StatusBadge status={t.status} />

                    <div className="space-y-0.5">
                      {cNames.length > 0 && (
                        <p className="text-[11px] text-foreground-muted">
                          <span className="text-[9px] uppercase tracking-wider">
                            C:{" "}
                          </span>
                          {cNames.join(", ")}
                        </p>
                      )}
                      {rNames.length > 0 && (
                        <p className="text-[11px] text-foreground-muted">
                          <span className="text-[9px] uppercase tracking-wider">
                            R:{" "}
                          </span>
                          {rNames.join(", ")}
                        </p>
                      )}
                      {cNames.length === 0 && rNames.length === 0 && (
                        <p className="text-[11px] text-foreground-muted">
                          Unassigned
                        </p>
                      )}
                    </div>

                    <p className="text-[12px] text-foreground-muted">
                      {t.deadline
                        ? new Date(t.deadline).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </p>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isPM && (
                        <>
                          <button
                            onClick={() =>
                              setTaskModal({ mode: "edit", task: t })
                            }
                            className="p-1.5 text-foreground-muted hover:text-foreground hover:bg-surface-container transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setDeleteModal(t)}
                            className="p-1.5 text-foreground-muted hover:text-[#ff4747] hover:bg-[#ff4747]/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                      {isDev && isMyContrib && (
                        <>
                          {t.status === "TODO" && (
                            <button
                              disabled={actionLoading === t._id}
                              onClick={() => handleAdvance(t._id)}
                              className="flex items-center gap-1 px-2 py-1.5 border border-[#47c8ff]/30 text-[#47c8ff] hover:bg-[#47c8ff]/10 text-[9px] tracking-[0.1em] uppercase font-bold transition-colors disabled:opacity-50"
                            >
                              {actionLoading === t._id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <ChevronRight className="w-3 h-3" />
                              )}{" "}
                              Start
                            </button>
                          )}
                          {t.status === "IN_PROGRESS" && (
                            <button
                              onClick={() => setSubmitReviewModal(t)}
                              className="flex items-center gap-1 px-2 py-1.5 border border-primary/30 text-primary hover:bg-primary/10 text-[9px] tracking-[0.1em] uppercase font-bold transition-colors"
                            >
                              <Send className="w-3 h-3" /> Submit
                            </button>
                          )}
                          {t.status === "IN_REVIEW" && (
                            <span className="text-[9px] tracking-[0.1em] uppercase font-bold text-[#e8a847] border border-[#e8a847]/30 bg-[#e8a847]/10 px-2 py-1.5">
                              In Review
                            </span>
                          )}
                          {t.status === "DONE" && (
                            <span className="text-[9px] tracking-[0.1em] uppercase font-bold text-[#47ff8a] border border-[#47ff8a]/30 bg-[#47ff8a]/10 px-2 py-1.5">
                              Done
                            </span>
                          )}
                        </>
                      )}
                      {isTester && isMyReviewer && (
                        <>
                          {t.status === "IN_REVIEW" && (
                            <button
                              onClick={() => setReviewModal(t)}
                              className="flex items-center gap-1 px-2 py-1.5 border border-[#e8a847]/30 text-[#e8a847] hover:bg-[#e8a847]/10 text-[9px] tracking-[0.1em] uppercase font-bold transition-colors"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Review
                            </button>
                          )}
                          {t.status === "DONE" && (
                            <span className="text-[9px] tracking-[0.1em] uppercase font-bold text-[#47ff8a] border border-[#47ff8a]/30 bg-[#47ff8a]/10 px-2 py-1.5">
                              Approved
                            </span>
                          )}
                          <button
                            onClick={() => setBugModal(t._id)}
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

      {/* Submit project for testing */}
      {isPM &&
        tasks.length > 0 &&
        doneCount === tasks.length &&
        project?.status === "IN_PROGRESS" && (
          <div>
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
      {isPM && allPhasesPassed && (
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

      {/* Modals */}
      {taskModal && (
        <TaskModal
          task={taskModal.mode === "edit" ? taskModal.task : null}
          allUsers={users}
          onClose={() => setTaskModal(null)}
          onSave={handleSaveTask}
        />
      )}
      {submitReviewModal && (
        <SubmitReviewModal
          task={submitReviewModal}
          onClose={() => setSubmitReviewModal(null)}
          onSave={handleSubmitForReview}
        />
      )}
      {reviewModal && (
        <ReviewModal
          task={reviewModal}
          onClose={() => setReviewModal(null)}
          onAction={handleReviewAction}
        />
      )}
      {deleteModal && (
        <DeleteModal
          task={deleteModal}
          onClose={() => setDeleteModal(null)}
          onDelete={handleDeleteTask}
        />
      )}
      {bugModal && (
        <BugModal
          taskId={bugModal === "global" ? null : bugModal}
          projectId={params.id}
          projectName={project.name}
          reporterId={user._id}
          reporterName={user.name}
          tasks={tasks}
          allUsers={users}
          onClose={() => setBugModal(null)}
          onSave={loadData}
        />
      )}
    </div>
  );
}
