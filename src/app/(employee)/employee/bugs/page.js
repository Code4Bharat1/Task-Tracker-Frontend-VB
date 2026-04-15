"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bug,
  Plus,
  Search,
  AlertCircle,
  CheckCircle2,
  X,
  Users,
  FolderKanban,
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import AuthLoader from "@/components/AuthLoader";
import { TableSkeleton } from "@/components/skeletons";
import {
  getMyBugs,
  getBugsReportedByMe,
  createBug,
  updateBug,
  BUG_SEVERITY_META,
  BUG_STATUS_META,
} from "@/services/bugService";
import { getMyProjects } from "@/services/projectService";
import { getTasks } from "@/services/taskService";
import { getUsers } from "@/services/userService";

// ─── Badge Components ─────────────────────────────────────────
function SeverityBadge({ severity }) {
  const meta = BUG_SEVERITY_META[severity] || {
    label: severity,
    color: "text-foreground-muted",
    bg: "bg-foreground/5",
    border: "border-outline",
  };
  return (
    <span
      className={`inline-flex px-2 py-0.5 text-[10px] tracking-[0.1em] uppercase font-bold border ${meta.bg} ${meta.border} ${meta.color}`}
    >
      {meta.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const meta = BUG_STATUS_META[status] || {
    label: status,
    color: "text-foreground-muted",
    bg: "bg-foreground/5",
    border: "border-outline",
  };
  return (
    <span
      className={`inline-flex px-2 py-0.5 text-[10px] tracking-[0.1em] uppercase font-bold border ${meta.bg} ${meta.border} ${meta.color}`}
    >
      {meta.label}
    </span>
  );
}

// ─── Report Bug Modal ─────────────────────────────────────────
function ReportModal({ reporterId, projects, users, onClose, onSave }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    severity: "MEDIUM",
    projectId: "",
    taskId: "",
    assignedTo: "",
  });
  const [tasks, setTasks] = useState([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (form.projectId)
      getTasks(form.projectId)
        .then(setTasks)
        .catch(() => setTasks([]));
    else setTasks([]);
  }, [form.projectId]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    function handleKey(e) {
      if (e.key === "Escape" && !saving) onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose, saving]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    if (!form.title.trim() || !form.projectId) {
      setErr("Title and project are required.");
      return;
    }
    try {
      setSaving(true);
      await createBug({ ...form, reportedBy: reporterId });
      onSave();
      onClose();
    } catch {
      setErr("Failed to report bug.");
    } finally {
      setSaving(false);
    }
  }

  const devUsers = users.filter((u) => u.globalRole === "employee");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-lg border border-outline bg-surface-low shadow-2xl z-10"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline">
          <div className="flex items-center gap-3">
            <Bug className="w-4 h-4 text-[#ff4747]" />
            <p className="text-[11px] tracking-[0.15em] uppercase font-bold text-foreground">
              Report New Bug
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-foreground-muted hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {err && (
            <div className="flex items-center gap-2 text-[#ff4747] text-[12px]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {err}
            </div>
          )}
          <div>
            <label className="block text-[10px] tracking-[0.15em] uppercase text-foreground-muted mb-1.5">
              Bug Title *
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Brief description of the bug"
              className="w-full bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-[10px] tracking-[0.15em] uppercase text-foreground-muted mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
              placeholder="Steps to reproduce, expected vs actual..."
              className="w-full bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] tracking-[0.15em] uppercase text-foreground-muted mb-1.5">
                Project *
              </label>
              <select
                value={form.projectId}
                onChange={(e) =>
                  setForm({ ...form, projectId: e.target.value, taskId: "" })
                }
                className="w-full bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground focus:outline-none focus:border-primary"
              >
                <option value="">Select project...</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] tracking-[0.15em] uppercase text-foreground-muted mb-1.5">
                Task
              </label>
              <select
                value={form.taskId}
                onChange={(e) => setForm({ ...form, taskId: e.target.value })}
                disabled={!form.projectId}
                className="w-full bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground focus:outline-none focus:border-primary disabled:opacity-50"
              >
                <option value="">No task</option>
                {tasks.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] tracking-[0.15em] uppercase text-foreground-muted mb-1.5">
                Severity *
              </label>
              <select
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
                className="w-full bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground focus:outline-none focus:border-primary"
              >
                {Object.entries(BUG_SEVERITY_META).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] tracking-[0.15em] uppercase text-foreground-muted mb-1.5">
                Assign To
              </label>
              <select
                value={form.assignedTo}
                onChange={(e) =>
                  setForm({ ...form, assignedTo: e.target.value })
                }
                className="w-full bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground focus:outline-none focus:border-primary"
              >
                <option value="">Unassigned</option>
                {devUsers.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-outline">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-outline text-foreground-muted hover:text-foreground hover:border-foreground-muted text-[11px] tracking-[0.15em] uppercase font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-[#ff4747] text-foreground hover:bg-[#e03d3d] text-[11px] tracking-[0.15em] uppercase font-bold transition-colors disabled:opacity-50"
          >
            {saving ? "Reporting..." : "Report Bug"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Bug Row ──────────────────────────────────────────────────
function BugRow({ bug, projects, users, canUpdateStatus, onStatusChange }) {
  const [updating, setUpdating] = useState(false);
  const proj = projects.find((p) => p._id === bug.projectId);
  const assignee = users.find((u) => u._id === bug.assignedTo);

  async function handleStatusChange(newStatus) {
    try {
      setUpdating(true);
      await updateBug(bug._id, { status: newStatus });
      if (onStatusChange) onStatusChange();
    } catch {
      /* ignore */
    } finally {
      setUpdating(false);
    }
  }

  const nextStatus =
    bug.status === "OPEN"
      ? "IN_PROGRESS"
      : bug.status === "IN_PROGRESS"
        ? "RESOLVED"
        : null;

  return (
    <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3.5 items-center hover:bg-surface-container transition-colors">
      <div>
        <p className="text-[13px] text-foreground font-semibold">{bug.title}</p>
        <p className="text-[11px] text-foreground-muted mt-0.5">
          {proj?.name || bug.projectId}
        </p>
      </div>
      <SeverityBadge severity={bug.severity} />
      <StatusBadge status={bug.status} />
      <p className="text-[12px] text-foreground-muted">
        {assignee?.name || "Unassigned"}
      </p>
      {canUpdateStatus && nextStatus ? (
        <button
          disabled={updating}
          onClick={() => handleStatusChange(nextStatus)}
          className="flex items-center gap-1 px-2.5 py-1.5 border border-primary/30 text-primary hover:bg-primary/10 text-[10px] tracking-[0.1em] uppercase font-bold transition-colors disabled:opacity-50"
        >
          {updating
            ? "..."
            : nextStatus === "IN_PROGRESS"
              ? "Start"
              : "Resolve"}
        </button>
      ) : (
        <span />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function EmployeeBugsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [assignedBugs, setAssignedBugs] = useState([]);
  const [reportedBugs, setReportedBugs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("assigned");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);

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
    if (!user) return;
    try {
      setDataLoading(true);
      const [assignedR, reportedR, projsR, usrsR] = await Promise.allSettled([
        getMyBugs(),
        getBugsReportedByMe(),
        getMyProjects(),
        getUsers(),
      ]);
      setAssignedBugs(assignedR.status === "fulfilled" ? assignedR.value : []);
      setReportedBugs(reportedR.status === "fulfilled" ? reportedR.value : []);
      setProjects(projsR.status === "fulfilled" ? projsR.value : []);
      setAllUsers(usrsR.status === "fulfilled" ? usrsR.value : []);
    } catch {
      setError("Failed to load bugs.");
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading || !user) return <AuthLoader />;

  const bugs = activeTab === "assigned" ? assignedBugs : reportedBugs;
  const filtered = bugs.filter((b) => {
    const proj = projects.find((p) => p._id === b.projectId);
    const matchSearch =
      !search ||
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      proj?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openCount = assignedBugs.filter((b) => b.status === "OPEN").length;
  const inProgCount = assignedBugs.filter(
    (b) => b.status === "IN_PROGRESS",
  ).length;
  const resolvedCount = assignedBugs.filter(
    (b) => b.status === "RESOLVED",
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-y-3">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-foreground-muted mb-1">
            Employee
          </p>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Bugs
          </h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 border border-[#ff4747]/30 text-[#ff4747] hover:bg-[#ff4747]/10 text-[11px] tracking-[0.15em] uppercase font-bold transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Report Bug
        </button>
      </div>

      {/* Stats */}
      {!dataLoading && (
        <div className="grid grid-cols-3 gap-4">
          <div className="border border-outline bg-surface-low px-5 py-4">
            <p className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted font-bold mb-2">
              Open
            </p>
            <p className="text-2xl font-bold text-[#ff4747]">{openCount}</p>
          </div>
          <div className="border border-outline bg-surface-low px-5 py-4">
            <p className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted font-bold mb-2">
              In Progress
            </p>
            <p className="text-2xl font-bold text-[#e8a847]">{inProgCount}</p>
          </div>
          <div className="border border-outline bg-surface-low px-5 py-4">
            <p className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted font-bold mb-2">
              Resolved
            </p>
            <p className="text-2xl font-bold text-[#47ff8a]">{resolvedCount}</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 border border-[#ff4747]/30 bg-[#ff4747]/5 text-[#ff4747]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-[12px]">{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-outline">
        {[
          {
            key: "assigned",
            label: "Assigned to Me",
            count: assignedBugs.length,
          },
          {
            key: "reported",
            label: "Reported by Me",
            count: reportedBugs.length,
          },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 text-[11px] tracking-[0.12em] uppercase font-bold border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-foreground-muted hover:text-foreground"
            }`}
          >
            {tab.label}
            <span
              className={`text-[10px] ${activeTab === tab.key ? "text-primary/60" : "text-foreground-muted"}`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bugs..."
            className="w-full bg-surface-container border border-outline pl-9 pr-3 py-2.5 text-[12px] text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground focus:outline-none focus:border-primary"
        >
          <option value="all">All Statuses</option>
          {Object.entries(BUG_STATUS_META).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        {(search || statusFilter !== "all") && (
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
            }}
            className="flex items-center gap-1.5 px-3 py-2.5 border border-outline text-foreground-muted hover:text-foreground hover:border-foreground-muted text-[11px] transition-colors"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      {dataLoading ? (
        <TableSkeleton rows={4} cols={5} />
      ) : (
        <div className="overflow-x-auto">
          <div className="border border-outline bg-surface-low min-w-150">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 border-b border-outline bg-surface-container">
              {["Bug / Project", "Severity", "Status", "Assignee", ""].map(
                (h) => (
                  <span
                    key={h}
                    className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted font-bold"
                  >
                    {h}
                  </span>
                ),
              )}
            </div>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-foreground-muted">
                <CheckCircle2 className="w-8 h-8 text-[#47ff8a]" />
                <p className="text-[12px] tracking-[0.1em] uppercase">
                  No bugs found
                </p>
              </div>
            ) : (
              <div className="divide-y divide-outline">
                {filtered.map((bug) => (
                  <BugRow
                    key={bug._id}
                    bug={bug}
                    projects={projects}
                    users={allUsers}
                    canUpdateStatus={activeTab === "assigned"}
                    onStatusChange={loadData}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showModal && (
        <ReportModal
          reporterId={user._id}
          projects={projects}
          users={allUsers}
          onClose={() => setShowModal(false)}
          onSave={loadData}
        />
      )}
    </div>
  );
}
