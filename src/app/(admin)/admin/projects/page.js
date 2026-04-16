"use client";

import { useState, useEffect } from "react";
import {
  FolderKanban,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Check,
  ChevronDown,
  Users,
  ArrowLeft,
  LayoutList,
  LayoutGrid,
  Circle,
} from "lucide-react";
import { ProjectsSkeleton, CardGridSkeleton } from "@/components/skeletons";
import { DatePicker } from "@/components/DatePicker";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from "@/services/projectService";
import { getUsers } from "@/services/userService";
import { getAllBugs } from "@/services/bugService";

// Projects are fetched from the backend via `getProjects`

const MOCK_EMPLOYEES = [
  { id: 1, name: "Mudassir Markania", department: "Engineering" },
  { id: 2, name: "Sarah Khan", department: "Design" },
  { id: 3, name: "Ali Hassan", department: "Engineering" },
  { id: 4, name: "Fatima Noor", department: "HR" },
  { id: 5, name: "Usman Tariq", department: "Engineering" },
  { id: 6, name: "Ayesha Malik", department: "Design" },
  { id: 7, name: "Bilal Ahmed", department: "DevOps" },
  { id: 8, name: "Zara Siddiqui", department: "Engineering" },
  { id: 9, name: "Hassan Raza", department: "HR" },
  { id: 10, name: "Nadia Iqbal", department: "Finance" },
];

const DEPARTMENTS = [
  "Engineering",
  "Design",
  "HR",
  "DevOps",
  "Marketing",
  "Finance",
];

const STATUSES = ["IN_PROGRESS", "COMPLETED"];

const STATUS_META = {
  IN_PROGRESS: {
    label: "In Progress",
    color: "text-[#47c8ff]",
    bg: "bg-[#47c8ff]/10",
    border: "border-[#47c8ff]/20",
  },
  COMPLETED: {
    label: "Completed",
    color: "text-[#47ff8a]",
    bg: "bg-[#47ff8a]/10",
    border: "border-[#47ff8a]/20",
  },
};

const EMPTY_FORM = {
  name: "",
  department: "Engineering",
  manager: "",
  managerId: null,
  tester: "",
  testerId: null,
  status: "IN_PROGRESS",
  deadline: "",
};

// ─── Helpers ─────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function progressPct(completed, total) {
  if (!total) return 0;
  return Math.round((completed / total) * 100);
}

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.IN_PROGRESS;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] tracking-[0.1em] uppercase font-bold border ${m.bg} ${m.border} ${m.color}`}
    >
      <Circle className="w-1.5 h-1.5 fill-current" />
      {m.label}
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

// ─── Add / Edit Modal ────────────────────────────────────────
function ProjectModal({ mode, initial, onClose, onSave, saving }) {
  const [form, setForm] = useState(
    initial
      ? {
          name: initial.name,
          department: initial.department,
          manager: initial.manager,
          managerId: initial.managerId,
          tester: initial.tester,
          testerId: initial.testerId ?? null,
          status: initial.status,
          deadline: initial.deadline,
        }
      : EMPTY_FORM,
  );
  const [errors, setErrors] = useState({});
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  useEffect(() => {
    let mounted = true;
    getUsers()
      .then((u) => {
        if (!mounted) return;
        setEmployees(u || []);
      })
      .catch(() => {})
      .finally(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Project name is required";
    if (!form.deadline) e.deadline = "Deadline is required";
    return e;
  }
  function handleManagerChange(id) {
    if (id === "none") {
      setForm({ ...form, manager: "", managerId: null });
      return;
    }
    const emp = employees.find((e) => String(e._id ?? e.id) === String(id));
    if (emp)
      setForm({ ...form, manager: emp.name, managerId: emp._id ?? emp.id });
  }

  function handleTesterChange(id) {
    if (id === "none") {
      setForm({ ...form, tester: "Unassigned", testerId: null });
      return;
    }
    const emp = employees.find((e) => String(e._id ?? e.id) === String(id));
    if (emp)
      setForm({ ...form, tester: emp.name, testerId: emp._id ?? emp.id });
  }

  function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-surface-low border border-outline shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline">
          <span className="text-[11px] tracking-[0.2em] uppercase font-bold text-foreground">
            {mode === "add" ? "Add Project" : "Edit Project"}
          </span>
          <button
            onClick={onClose}
            className="text-foreground-muted hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <Field label="Project Name" error={errors.name}>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Website Redesign"
              className="w-full bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary transition-colors"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Department">
              <div className="relative">
                <select
                  value={form.department}
                  onChange={(e) =>
                    setForm({ ...form, department: e.target.value })
                  }
                  className="w-full appearance-none bg-surface-container border border-outline px-3 py-2.5 pr-8 text-[12px] text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground-muted pointer-events-none" />
              </div>
            </Field>
            <Field label="Status">
              <div className="relative">
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full appearance-none bg-surface-container border border-outline px-3 py-2.5 pr-8 text-[12px] text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_META[s].label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground-muted pointer-events-none" />
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Project Manager">
              <div className="relative">
                <select
                  value={form.managerId ?? "none"}
                  onChange={(e) => handleManagerChange(e.target.value)}
                  className="w-full appearance-none bg-surface-container border border-outline px-3 py-2.5 pr-8 text-[12px] text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  <option value="none">Unassigned</option>
                  {employees.map((e) => (
                    <option key={e._id ?? e.id} value={e._id ?? e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground-muted pointer-events-none" />
              </div>
            </Field>
            <Field label="Tester">
              <div className="relative">
                <select
                  value={form.testerId ?? "none"}
                  onChange={(e) => handleTesterChange(e.target.value)}
                  className="w-full appearance-none bg-surface-container border border-outline px-3 py-2.5 pr-8 text-[12px] text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  <option value="none">Unassigned</option>
                  {employees.map((e) => (
                    <option key={e._id ?? e.id} value={e._id ?? e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground-muted pointer-events-none" />
              </div>
            </Field>
          </div>

          <Field label="Deadline" error={errors.deadline}>
            <DatePicker
              value={form.deadline}
              onChange={(deadline) => setForm({ ...form, deadline })}
            />
          </Field>
        </div>

        <div className="flex gap-2 px-6 pb-5 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-[11px] tracking-[0.15em] uppercase font-bold border border-outline text-foreground-muted hover:text-foreground hover:border-foreground-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-2.5 text-[11px] tracking-[0.15em] uppercase font-bold bg-primary text-on-primary hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <Check className="w-3.5 h-3.5" />
            {mode === "add" ? "Add Project" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Modal ────────────────────────────────────────────
function DeleteModal({ project, onClose, onConfirm }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm bg-surface-low border border-outline shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-[#ff4747]/10 border border-[#ff4747]/20 flex items-center justify-center">
            <Trash2 className="w-4 h-4 text-[#ff4747]" />
          </div>
          <span className="text-[11px] tracking-[0.2em] uppercase font-bold text-foreground">
            Delete Project
          </span>
        </div>
        <p className="text-[12px] text-foreground-muted mb-1">
          You are about to delete:
        </p>
        <p className="text-[13px] font-bold text-foreground mb-2">
          {project.name}
        </p>
        <p className="text-[11px] text-foreground-muted mb-5">
          This project has{" "}
          <span className="text-[#ff4747]">{project.modules} modules</span>.
          This action cannot be undone.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-[11px] tracking-[0.15em] uppercase font-bold border border-outline text-foreground-muted hover:text-foreground hover:border-foreground-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 text-[11px] tracking-[0.15em] uppercase font-bold bg-[#ff4747] text-foreground hover:bg-[#e03d3d] transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Members Drawer ──────────────────────────────────────────
function MembersDrawer({ project, onClose }) {
  const [bugs, setBugs] = useState([]);
  const [bugsLoading, setBugsLoading] = useState(true);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  useEffect(() => {
    const projectId = project?._id ?? project?.id;
    if (!projectId) {
      setBugsLoading(false);
      return;
    }
    setBugsLoading(true);
    getAllBugs({ projectId })
      .then((result) => setBugs(Array.isArray(result) ? result : []))
      .catch((err) => {
        console.error(
          "Failed to load bugs:",
          err?.response?.data || err?.message,
        );
        setBugs([]);
      })
      .finally(() => setBugsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?._id ?? project?.id]);

  const SEVERITY_COLOR = {
    LOW: {
      text: "text-[#47c8ff]",
      border: "border-[#47c8ff]/40",
      bg: "bg-[#47c8ff]/10",
    },
    MEDIUM: {
      text: "text-[#e8a847]",
      border: "border-[#e8a847]/40",
      bg: "bg-[#e8a847]/10",
    },
    HIGH: {
      text: "text-[#f87343]",
      border: "border-[#f87343]/40",
      bg: "bg-[#f87343]/10",
    },
    CRITICAL: {
      text: "text-[#ff4747]",
      border: "border-[#ff4747]/40",
      bg: "bg-[#ff4747]/10",
    },
  };
  const STATUS_COLOR = {
    OPEN: "text-[#ff4747]",
    IN_PROGRESS: "text-[#47c8ff]",
    RESOLVED: "text-[#47ff8a]",
    CLOSED: "text-foreground-muted",
    REOPENED: "text-[#c847ff]",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-4xl bg-surface-low border border-outline flex flex-col shadow-2xl max-h-[88vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline flex items-center justify-between">
          <div>
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-foreground-muted hover:text-foreground transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="text-[10px] tracking-[0.15em] uppercase">
                Back
              </span>
            </button>
            <h2 className="text-[14px] font-bold text-foreground tracking-wide">
              {project.name}
            </h2>
            <p className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted mt-0.5">
              {project.department}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted">
              Issues
            </p>
            <p className="text-2xl font-extrabold text-[#ff4747]">
              {bugsLoading ? "…" : bugs.length}
            </p>
          </div>
        </div>

        {/* Two-column body */}
        <div className="flex-1 overflow-hidden flex min-h-0">
          {/* ── Left: Project Details ── */}
          <div className="w-[45%] border-r border-outline overflow-y-auto p-6 space-y-5 scrollbar-thin">
            {/* Manager */}
            <div>
              <p className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted mb-2">
                Project Manager
              </p>
              <div className="flex items-center gap-3 px-3 py-2.5 border border-outline bg-surface-container">
                <div className="w-7 h-7 bg-primary/10 border border-primary/30 flex items-center justify-center text-[11px] font-bold text-primary shrink-0">
                  {project.manager?.charAt(0) || "?"}
                </div>
                <div>
                  <p className="text-[12px] font-bold text-foreground">
                    {project.manager || "Unassigned"}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-foreground-muted">
                    Project Manager
                  </p>
                </div>
              </div>
            </div>

            {/* Tester */}
            <div>
              <p className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted mb-2">
                Tester
              </p>
              <div className="flex items-center gap-3 px-3 py-2.5 border border-outline bg-surface-container">
                <div className="w-7 h-7 bg-[#c847ff]/10 border border-[#c847ff]/30 flex items-center justify-center text-[11px] font-bold text-[#c847ff] shrink-0">
                  {project.tester?.charAt(0) || "?"}
                </div>
                <div>
                  <p className="text-[12px] font-bold text-foreground">
                    {project.tester || "Unassigned"}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-foreground-muted">
                    Tester
                  </p>
                </div>
              </div>
            </div>

            {/* Developers */}
            <div>
              <p className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted mb-2">
                Developers ({project.members?.length || 0})
              </p>
              <div className="space-y-1.5">
                {project.members?.length > 0 ? (
                  project.members.map((name, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-3 py-2.5 border border-outline bg-surface-container"
                    >
                      <div className="w-7 h-7 bg-[#47c8ff]/10 border border-[#47c8ff]/30 flex items-center justify-center text-[11px] font-bold text-[#47c8ff] shrink-0">
                        {name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-foreground">
                          {name}
                        </p>
                        <p className="text-[10px] uppercase tracking-wider text-foreground-muted">
                          Developer
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-foreground-muted italic">
                    No developers assigned
                  </p>
                )}
              </div>
            </div>

            {/* Module Progress */}
            <div>
              <p className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted mb-2">
                Module Progress
              </p>
              <div className="border border-outline bg-surface-container px-4 py-3">
                <div className="flex justify-between mb-2">
                  <span className="text-[11px] text-foreground-muted">
                    {project.modulesCompleted} / {project.modules} completed
                  </span>
                  <span className="text-[11px] font-bold text-primary">
                    {progressPct(project.modulesCompleted, project.modules)}%
                  </span>
                </div>
                <div className="w-full h-1 bg-surface-highest">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${progressPct(project.modulesCompleted, project.modules)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: Bugs ── */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
            <p className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted mb-4">
              Issue Reports ({bugsLoading ? "…" : bugs.length})
            </p>

            {bugsLoading ? (
              <div className="flex items-center justify-center py-12 text-foreground-muted text-[12px]">
                Loading issues…
              </div>
            ) : bugs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-foreground-muted">
                <p className="text-[12px] tracking-[0.1em] uppercase">
                  No issues reported
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {bugs.map((bug) => {
                  const sev = SEVERITY_COLOR[bug.severity] || {
                    text: "text-foreground-muted",
                    border: "border-outline",
                    bg: "bg-surface-container",
                  };
                  const statusCls =
                    STATUS_COLOR[bug.status] || "text-foreground-muted";
                  return (
                    <div
                      key={bug._id}
                      className="border border-outline bg-surface-container p-4 space-y-3"
                    >
                      {/* Title + status */}
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[12px] font-bold text-foreground leading-snug flex-1">
                          {bug.title}
                        </p>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider shrink-0 ${statusCls}`}
                        >
                          {bug.status?.replace("_", " ")}
                        </span>
                      </div>
                      {/* Meta row */}
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Severity */}
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border ${sev.text} ${sev.border} ${sev.bg}`}
                        >
                          {bug.severity}
                        </span>
                        {/* Assigned by */}
                        {bug.reportedByName && (
                          <span className="text-[11px] text-foreground-muted">
                            <span className="text-foreground-muted/60 uppercase tracking-wider text-[10px]">
                              By{" "}
                            </span>
                            {bug.reportedByName}
                          </span>
                        )}
                        {/* Assigned to */}
                        {bug.assignedToName && (
                          <span className="text-[11px] text-foreground-muted">
                            <span className="text-foreground-muted/60 uppercase tracking-wider text-[10px]">
                              To{" "}
                            </span>
                            {bug.assignedToName}
                          </span>
                        )}
                      </div>
                      {/* Description */}
                      {bug.description && (
                        <p className="text-[11px] text-foreground-muted leading-relaxed line-clamp-2">
                          {bug.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Project Card (Grid View) ─────────────────────────────────
function ProjectCard({ project, onEdit, onDelete, onViewMembers }) {
  const pct = progressPct(project.modulesCompleted, project.modules);
  return (
    <button
      onClick={() => onViewMembers && onViewMembers(project)}
      className="border border-outline bg-surface-low p-5 hover:border-outline transition-colors group flex flex-col gap-4 text-left cursor-pointer"
    >
      {/* Top */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted mb-1">
            {project.department}
          </p>
          <h3 className="text-[13px] font-bold text-foreground tracking-wide leading-snug">
            {project.name}
          </h3>
        </div>
        <StatusBadge status={project.status} />
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between mb-1.5">
          <span className="text-[10px] text-foreground-muted uppercase tracking-wider">
            Modules
          </span>
          <span className="text-[10px] font-bold text-primary">{pct}%</span>
        </div>
        <div className="w-full h-1 bg-surface-container">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-[10px] text-foreground-muted mt-1">
          {project.modulesCompleted}/{project.modules} done
        </p>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <p className="text-foreground-muted mb-0.5 text-[10px] uppercase tracking-wider">
            Manager
          </p>
          <p className="text-foreground font-bold truncate">
            {project.manager || "—"}
          </p>
        </div>
        <div>
          <p className="text-foreground-muted mb-0.5 text-[10px] uppercase tracking-wider">
            Deadline
          </p>
          <p className="text-foreground font-bold">
            {formatDate(project.deadline)}
          </p>
        </div>
      </div>

      {/* Footer: show members count only; card click opens members drawer */}
      <div className="flex items-center justify-between pt-2 border-t border-outline">
        <div className="flex items-center gap-1.5 text-foreground-muted">
          <Users className="w-3.5 h-3.5" />
          <span className="text-[12px] font-bold text-[#47c8ff]">
            {project.members?.length || 0}
          </span>
        </div>
        <span className="text-[11px] text-foreground-muted opacity-60">
          &nbsp;
        </span>
      </div>
    </button>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function ProjectsOverview() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDept, setFilterDept] = useState("all");
  const [view, setView] = useState("list");
  const [modal, setModal] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getProjects()
      .then((data) => {
        if (!mounted) return;
        // Normalise backend project shape to the UI-friendly fields used below
        const mapped = (data || []).map((p) => {
          const id = p._id ?? p.id;
          const name = p.name ?? p.title ?? p.projectName ?? "";
          const department =
            p.department || p.departmentName || p.department_id || "";
          const manager =
            (p.managerNames && p.managerNames[0]) ||
            p.manager ||
            p.managerName ||
            "";
          const managerId =
            (p.managerIds && p.managerIds[0]) || p.managerId || null;
          const tester = (p.testerNames && p.testerNames[0]) || p.tester || "";
          const members = p.developerNames || p.members || [];
          const modules = p.modulesTotal ?? p.modules ?? 0;
          const modulesCompleted = p.modulesCompleted ?? 0;
          const status = p.status ?? "IN_PROGRESS";
          const deadline = p.deadline ?? p.deadlineAt ?? null;
          const created = p.created_at ?? p.createdAt ?? p.created;
          return {
            id,
            name,
            department,
            manager,
            managerId,
            tester,
            members,
            modules,
            modulesCompleted,
            status,
            deadline,
            created,
            raw: p,
          };
        });
        setProjects(mapped);
      })
      .catch((err) => {
        console.error("getProjects failed:", err);
        if (mounted)
          setError("Failed to load projects. Check network or authentication.");
      })
      .finally(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <ProjectsSkeleton />;

  if (error)
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-4 py-3 border border-[#ff4747]/30 bg-[#ff4747]/10">
          <p className="text-[11px] text-[#ff4747] flex-1">{error}</p>
        </div>
      </div>
    );

  const filtered = projects.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.manager.toLowerCase().includes(search.toLowerCase()) ||
      p.department.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    const matchDept = filterDept === "all" || p.department === filterDept;
    return matchSearch && matchStatus && matchDept;
  });

  async function handleAdd(form) {
    try {
      setSaving(true);
      // Transform UI form shape to backend payload shape
      const payload = {
        name: form.name,
        description: form.description ?? "",
        status: form.status,
        managerIds: form.managerId ? [form.managerId] : [],
        testerIds: form.testerId ? [form.testerId] : [],
        developerIds: [],
        deadline: form.deadline || null,
      };
      const created = await createProject(payload);
      // Normalize created project shape
      const id = (created && (created._id ?? created.id)) || Date.now();
      const name = created?.name ?? created?.title ?? "";
      const department = created?.department || created?.departmentName || "";
      const manager =
        (created?.managerNames && created.managerNames[0]) ||
        created?.manager ||
        "";
      const managerId =
        (created?.managerIds && created.managerIds[0]) ||
        created?.managerId ||
        null;
      const tester =
        (created?.testerNames && created.testerNames[0]) ||
        created?.tester ||
        "";
      const members = created?.developerNames || created?.members || [];
      const modules = created?.modulesTotal ?? created?.modules ?? 0;
      const modulesCompleted = created?.modulesCompleted ?? 0;
      const status = created?.status ?? "IN_PROGRESS";
      const deadline = created?.deadline ?? null;
      const mapped = {
        id,
        name,
        department,
        manager,
        managerId,
        tester,
        members,
        modules,
        modulesCompleted,
        status,
        deadline,
        created: created?.created_at ?? created?.createdAt,
        raw: created,
      };
      setProjects((prev) => [...prev, mapped]);
      setModal(null);
    } catch (err) {
      // ignore for now — UI can show errors later
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(form) {
    try {
      setSaving(true);
      const id = modal.project.raw?._id ?? modal.project.id;
      // Transform UI form shape to backend payload shape
      const payload = {
        name: form.name,
        description: form.description ?? "",
        status: form.status,
        managerIds: form.managerId ? [form.managerId] : [],
        testerIds: form.testerId ? [form.testerId] : [],
        deadline: form.deadline || null,
      };
      const updated = await updateProject(id, payload);
      const name = updated?.name ?? updated?.title ?? "";
      const department = updated?.department || updated?.departmentName || "";
      const manager =
        (updated?.managerNames && updated.managerNames[0]) ||
        updated?.manager ||
        "";
      const managerId =
        (updated?.managerIds && updated.managerIds[0]) ||
        updated?.managerId ||
        null;
      const tester =
        (updated?.testerNames && updated.testerNames[0]) ||
        updated?.tester ||
        "";
      const members = updated?.developerNames || updated?.members || [];
      const modules = updated?.modulesTotal ?? updated?.modules ?? 0;
      const modulesCompleted = updated?.modulesCompleted ?? 0;
      const status = updated?.status ?? "IN_PROGRESS";
      const deadline = updated?.deadline ?? null;
      const mapped = {
        id: id,
        name,
        department,
        manager,
        managerId,
        tester,
        members,
        modules,
        modulesCompleted,
        status,
        deadline,
        created: updated?.created_at ?? updated?.createdAt,
        raw: updated,
      };
      setProjects((prev) =>
        prev.map((p) => (p.id === (modal.project.id || id) ? mapped : p)),
      );
      setModal(null);
    } catch (err) {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      setSaving(true);
      const id = modal.project.raw?._id ?? modal.project.id;
      await deleteProject(id);
      setProjects((prev) =>
        prev.filter((p) => p.id !== (modal.project.id || id)),
      );
      setModal(null);
    } catch (err) {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  // Stats
  const stats = [
    { label: "Total Projects", value: projects.length },
    {
      label: "In Progress",
      value: projects.filter((p) => p.status === "IN_PROGRESS").length,
    },
    {
      label: "Completed",
      value: projects.filter((p) => p.status === "COMPLETED").length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header */}
      <div className="flex flex-wrap items-center justify-between gap-y-3">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-foreground-muted mb-1">
            Admin / Projects
          </p>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Projects <span className="text-primary"></span>
          </h1>
        </div>
      </div>

      {/* ── Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(({ label, value }) => (
          <div
            key={label}
            className="border border-outline bg-surface-low px-5 py-4"
          >
            <p className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted mb-1">
              {label}
            </p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, manager, department..."
            className="w-full bg-surface-low border border-outline pl-9 pr-4 py-2.5 text-[12px] text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none bg-surface-low border border-outline px-4 py-2.5 pr-8 text-[11px] tracking-[0.12em] uppercase text-foreground-muted focus:outline-none focus:border-primary transition-colors cursor-pointer"
          >
            <option value="all">All Status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground-muted pointer-events-none" />
        </div>

        {/* Dept filter */}
        <div className="relative">
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="appearance-none bg-surface-low border border-outline px-4 py-2.5 pr-8 text-[11px] tracking-[0.12em] uppercase text-foreground-muted focus:outline-none focus:border-primary transition-colors cursor-pointer"
          >
            <option value="all">All Depts</option>
            {DEPARTMENTS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground-muted pointer-events-none" />
        </div>

        {/* View toggle */}
        <div className="flex border border-outline ml-auto">
          <button
            onClick={() => setView("list")}
            className={`p-2.5 transition-colors ${view === "list" ? "bg-primary text-on-primary" : "text-foreground-muted hover:text-foreground"}`}
          >
            <LayoutList className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setView("grid")}
            className={`p-2.5 transition-colors ${view === "grid" ? "bg-primary text-on-primary" : "text-foreground-muted hover:text-foreground"}`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Content */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 border border-outline bg-surface-low">
          <FolderKanban className="w-8 h-8 text-foreground" />
          <p className="text-[11px] tracking-[0.15em] uppercase text-foreground-muted">
            No projects found
          </p>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onEdit={(proj) => setModal({ type: "edit", project: proj })}
              onDelete={(proj) => setModal({ type: "delete", project: proj })}
              onViewMembers={(proj) =>
                setModal({ type: "members", project: proj })
              }
            />
          ))}
        </div>
      ) : (
        /* List View */
        <div className="overflow-x-auto">
          <div className="border border-outline bg-surface-low overflow-hidden min-w-195">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_80px] gap-4 px-6 py-3 border-b border-outline bg-surface-container">
              {[
                "Project",
                "Dept",
                "Manager",
                "Progress",
                "Deadline",
                "Status",
                "Members",
              ].map((h) => (
                <span
                  key={h}
                  className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted font-bold"
                >
                  {h}
                </span>
              ))}
            </div>
            <div className="divide-y divide-[#161616]">
              {filtered.map((p) => {
                const pct = progressPct(p.modulesCompleted, p.modules);
                return (
                  <button
                    key={p.id}
                    onClick={() => setModal({ type: "members", project: p })}
                    className="w-full text-left grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_80px] gap-4 px-6 py-4 items-center hover:bg-surface-container transition-colors cursor-pointer"
                  >
                    {/* Name */}
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-surface-container border border-outline flex items-center justify-center shrink-0">
                        <FolderKanban className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="text-[12px] font-bold text-foreground tracking-wide truncate">
                        {p.name}
                      </span>
                    </div>

                    {/* Dept */}
                    <span className="text-[12px] text-foreground-muted uppercase">
                      {p.department}
                    </span>

                    {/* Manager */}
                    <span className="text-[12px] text-foreground truncate">
                      {p.manager || "—"}
                    </span>

                    {/* Progress */}
                    <div className="pr-6">
                      <div className="flex justify-between mb-1">
                        <span className="text-[10px] text-foreground-muted">
                          {p.modulesCompleted}/{p.modules}
                        </span>
                        <span className="text-[10px] text-primary font-bold">
                          {pct}%
                        </span>
                      </div>
                      <div className="w-full h-1 bg-surface-container">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Deadline */}
                    <span className="text-[11px] text-foreground-muted">
                      {formatDate(p.deadline)}
                    </span>

                    {/* Status */}
                    <StatusBadge status={p.status} />

                    {/* Members count */}
                    <div className="flex items-center gap-1.5 text-foreground-muted">
                      <Users className="w-3.5 h-3.5" />
                      <span className="text-[12px] font-bold text-[#47c8ff]">
                        {p.members?.length || 0}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Modals */}
      {modal?.type === "add" && (
        <ProjectModal
          mode="add"
          onClose={() => setModal(null)}
          onSave={handleAdd}
          saving={saving}
        />
      )}
      {modal?.type === "edit" && (
        <ProjectModal
          mode="edit"
          initial={modal.project}
          onClose={() => setModal(null)}
          onSave={handleEdit}
          saving={saving}
        />
      )}
      {modal?.type === "delete" && (
        <DeleteModal
          project={modal.project}
          onClose={() => setModal(null)}
          onConfirm={handleDelete}
        />
      )}
      {modal?.type === "members" && (
        <MembersDrawer project={modal.project} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
