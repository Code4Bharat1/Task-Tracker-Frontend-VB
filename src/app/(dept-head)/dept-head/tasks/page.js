"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ListTodo,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Check,
  ChevronDown,
  Loader2,
  AlertCircle,
  Circle,
  Calendar,
  Filter,
  Users,
} from "lucide-react";
import { ProjectsSkeleton } from "@/components/skeletons";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  TASK_STATUS_META,
  TASK_PRIORITY_META,
  TASK_STATUSES,
} from "@/services/taskService";
import { getProjects } from "@/services/projectService";
import { getUsers } from "@/services/userService";
// DatePicker removed — using native datetime-local inputs

// ─── Helpers ─────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatusBadge({ status }) {
  const m = TASK_STATUS_META[status] || TASK_STATUS_META.TODO;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] tracking-[0.1em] uppercase font-bold border ${m.bg} ${m.border} ${m.color}`}
    >
      <Circle className="w-1.5 h-1.5 fill-current" />
      {m.label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const m = TASK_PRIORITY_META[priority] || TASK_PRIORITY_META.LOW;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] tracking-[0.1em] uppercase font-bold border ${m.bg} ${m.border} ${m.color}`}
    >
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

// ─── Task Modal ─────────────────────────────────────────────
function TaskModal({
  mode,
  initial,
  projects,
  users,
  departments,
  onClose,
  onSave,
  saving,
}) {
  const [form, setForm] = useState(
    initial
      ? {
          title: initial.title,
          description: initial.description || "",
          projectId: initial.projectId?._id || initial.projectId || "",
          priority: initial.priority || "MEDIUM",
          status: initial.status || "TODO",
          reviewers: (initial.reviewers || []).map(
            (r) => r.userId?._id || r.userId || r,
          ),
          startTime: initial.startTime || initial.start_time || "",
          endTime: initial.endTime || initial.end_time || "",
          photoRequired: initial.photoRequired || false,
          proofRequired: initial.proofRequired || false,
        }
      : {
          title: "",
          description: "",
          projectId: "",
          priority: "MEDIUM",
          status: "TODO",
          reviewers: [],
          startTime: "",
          endTime: "",
          photoRequired: false,
          proofRequired: false,
        },
  );
  const [errors, setErrors] = useState({});
  const [userSearch, setUserSearch] = useState("");

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

  function validate() {
    const e = {};
    if (!form.title.trim()) e.title = "Task title is required";
    // Validate start/end times if provided
    if (
      (form.startTime && !form.endTime) ||
      (!form.startTime && form.endTime)
    ) {
      if (!form.startTime)
        e.startTime = "Start time is required when end time is set";
      if (!form.endTime)
        e.endTime = "End time is required when start time is set";
    } else if (form.startTime && form.endTime) {
      const s = new Date(form.startTime);
      const en = new Date(form.endTime);
      if (
        !isNaN(s.getTime()) &&
        !isNaN(en.getTime()) &&
        s.getTime() > en.getTime()
      ) {
        e.startTime = "Start time must be before end time";
      }
    }
    return e;
  }

  function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    onSave(form);
  }

  const filteredUsers = (users || []).filter((u) => {
    const nameMatch = (u?.name || "")
      .toLowerCase()
      .includes(userSearch.toLowerCase());
    return nameMatch;
  });

  function toggleUser(userId, field) {
    const list = form[field];
    if (list.includes(userId)) {
      setForm({ ...form, [field]: list.filter((id) => id !== userId) });
    } else {
      setForm({ ...form, [field]: [...list, userId] });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={!saving ? onClose : undefined}
      />
      <div className="relative w-full max-w-2xl bg-surface-low border border-outline shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline">
          <span className="text-[11px] tracking-[0.2em] uppercase font-bold text-foreground">
            {mode === "add" ? "Assign New Task" : "Edit Task"}
          </span>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-foreground-muted hover:text-foreground transition-colors disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[80vh] overflow-y-auto scrollbar-thin">
          <div className="space-y-4">
            <Field label="Task Title" error={errors.title}>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Implement Login API"
                className="w-full bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </Field>

            <Field label="Project" error={errors.projectId}>
              <select
                value={form.projectId}
                onChange={(e) =>
                  setForm({ ...form, projectId: e.target.value })
                }
                className="w-full bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground focus:outline-none focus:border-primary transition-colors"
              >
                <option value="">Select Project</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Description">
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
                placeholder="Details about the task…"
                className="w-full bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground focus:outline-none focus:border-primary transition-colors resize-none"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Priority">
                <select
                  value={form.priority}
                  onChange={(e) =>
                    setForm({ ...form, priority: e.target.value })
                  }
                  className="w-full bg-surface-container border border-outline px-3 py-2.2 text-[12px] text-foreground focus:outline-none focus:border-primary transition-colors"
                >
                  {Object.keys(TASK_PRIORITY_META).map((p) => (
                    <option key={p} value={p}>
                      {TASK_PRIORITY_META[p].label}
                    </option>
                  ))}
                </select>
              </Field>
              <div>
                <Field label="Start Time" error={errors.startTime}>
                  <input
                    type="datetime-local"
                    value={form.startTime}
                    onChange={(e) =>
                      setForm({ ...form, startTime: e.target.value })
                    }
                    className="w-full bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </Field>
                <Field label="End Time" error={errors.endTime}>
                  <input
                    type="datetime-local"
                    value={form.endTime}
                    onChange={(e) =>
                      setForm({ ...form, endTime: e.target.value })
                    }
                    className="w-full bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground focus:outline-none focus:border-primary transition-colors mt-2"
                  />
                </Field>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Field label="Assign Reviewers">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground-muted" />
                    <input
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search users…"
                      className="w-full bg-surface-container border border-outline pl-7 pr-2 py-1.5 text-[11px] text-foreground focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Field label="Photo required">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setForm({ ...form, photoRequired: true })
                          }
                          className={`px-2 py-1 text-[10px] font-bold uppercase border transition-colors ${form.photoRequired ? "bg-primary border-primary text-on-primary" : "border-outline text-foreground-muted"}`}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setForm({ ...form, photoRequired: false })
                          }
                          className={`px-2 py-1 text-[10px] font-bold uppercase border transition-colors ${!form.photoRequired ? "bg-surface-container border-outline text-foreground-muted" : "border-outline text-foreground-muted hover:border-foreground"}`}
                        >
                          No
                        </button>
                      </div>
                    </Field>
                  </div>
                  <div className="flex-1">
                    <Field label="Proof required">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setForm({ ...form, proofRequired: true })
                          }
                          className={`px-2 py-1 text-[10px] font-bold uppercase border transition-colors ${form.proofRequired ? "bg-primary border-primary text-on-primary" : "border-outline text-foreground-muted"}`}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setForm({ ...form, proofRequired: false })
                          }
                          className={`px-2 py-1 text-[10px] font-bold uppercase border transition-colors ${!form.proofRequired ? "bg-surface-container border-outline text-foreground-muted" : "border-outline text-foreground-muted hover:border-foreground"}`}
                        >
                          No
                        </button>
                      </div>
                    </Field>
                  </div>
                </div>

                <div className="bg-surface-container border border-outline h-64 overflow-y-auto scrollbar-thin divide-y divide-outline">
                  {filteredUsers.length === 0 ? (
                    <p className="text-[11px] text-foreground-muted text-center py-4">
                      No users found
                    </p>
                  ) : (
                    filteredUsers.map((u) => {
                      const id = u._id;
                      const isRev = (form.reviewers || []).includes(id);
                      return (
                        <div
                          key={id}
                          className="p-2 flex items-center justify-between"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="text-[12px] font-medium text-foreground truncate">
                              {u.name}
                            </p>
                            <p className="text-[10px] text-foreground-muted truncate">
                              {u.globalRole}
                            </p>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={isRev}
                              onChange={() => toggleUser(id, "reviewers")}
                              className="w-4 h-4 rounded border border-outline text-primary focus:outline-none"
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </Field>
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
            className="flex-1 py-2.5 text-[11px] tracking-[0.15em] uppercase font-bold bg-primary text-on-primary hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            {mode === "add" ? "Assign Task" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────
function DeleteModal({ task, onClose, onConfirm, saving }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={!saving ? onClose : undefined}
      />
      <div className="relative w-full max-w-sm bg-surface-low border border-outline shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-[#ff4747]/10 border border-[#ff4747]/20 flex items-center justify-center">
            <Trash2 className="w-4 h-4 text-[#ff4747]" />
          </div>
          <span className="text-[11px] tracking-[0.2em] uppercase font-bold text-foreground">
            Delete Task
          </span>
        </div>
        <p className="text-[12px] text-foreground-muted mb-1">
          You are about to delete:
        </p>
        <p className="text-[13px] font-bold text-foreground mb-2">
          {task.title}
        </p>
        <p className="text-[11px] text-foreground-muted mb-5">
          This action cannot be undone.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 text-[11px] tracking-[0.15em] uppercase font-bold border border-outline text-foreground-muted hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={saving}
            className="flex-1 py-2.5 text-[11px] tracking-[0.15em] uppercase font-bold bg-[#ff4747] text-foreground hover:bg-[#e03d3d] transition-colors flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function DeptHeadTasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [modal, setModal] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [allTasks, allProjects, allUsers] = await Promise.all([
        getTasks(null), // Try getting all tasks
        getProjects(),
        getUsers(),
      ]);
      setTasks(Array.isArray(allTasks) ? allTasks : []);
      setProjects(Array.isArray(allProjects) ? allProjects : []);
      setUsers(Array.isArray(allUsers) ? allUsers : allUsers?.users || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load tasks data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = tasks.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "DONE").length,
    pending: tasks.filter((t) => t.status !== "DONE").length,
  };

  async function handleAdd(form) {
    try {
      setSaving(true);
      const created = await createTask(form.projectId, form);
      // Backend might return task with populated project
      setTasks((prev) => [created, ...prev]);
      setModal(null);
    } catch (err) {
      setError("Failed to assign task.");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(form) {
    try {
      setSaving(true);
      const updated = await updateTask(modal.task._id, form);
      setTasks((prev) =>
        prev.map((t) => (t._id === modal.task._id ? updated : t)),
      );
      setModal(null);
    } catch (err) {
      setError("Failed to update task.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      setSaving(true);
      await deleteTask(modal.task._id);
      setTasks((prev) => prev.filter((t) => t._id !== modal.task._id));
      setModal(null);
    } catch (err) {
      setError("Failed to delete task.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <ProjectsSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-y-3">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-foreground-muted mb-1">
            Workflow
          </p>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Tasks
          </h1>
        </div>
        <button
          onClick={() => setModal({ type: "add" })}
          className="flex items-center gap-2 px-4 py-2.5 text-[11px] tracking-[0.15em] uppercase font-bold bg-primary text-on-primary hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Assign Task
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: "Total Tasks",
            value: stats.total,
            accent: "text-foreground",
          },
          {
            label: "Completed",
            value: stats.completed,
            accent: "text-[#47ff8a]",
          },
          { label: "Pending", value: stats.pending, accent: "text-[#e8a847]" },
        ].map(({ label, value, accent }) => (
          <div key={label} className="border border-outline bg-surface-low p-4">
            <p className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted mb-2">
              {label}
            </p>
            <p className={`text-2xl font-bold ${accent}`}>{value}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-3 px-4 py-3 border border-[#ff4747]/30 bg-[#ff4747]/5 text-[#ff4747]">
          <AlertCircle className="w-4 h-4" />
          <span className="text-[12px]">{error}</span>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="w-full bg-surface-container border border-outline pl-9 pr-3 py-2.5 text-[12px] text-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none bg-surface-container border border-outline px-3 py-2.5 pr-8 text-[12px] text-foreground focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="all">All Statuses</option>
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {TASK_STATUS_META[s].label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground-muted pointer-events-none" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="border border-outline bg-surface-low overflow-hidden min-w-145">
          <div className="grid grid-cols-[2fr_1fr_1fr_120px_60px] gap-4 px-6 py-3 border-b border-outline bg-surface-container">
            {["Task", "Project", "Priority", "Deadline", ""].map((h) => (
              <span
                key={h}
                className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted font-bold"
              >
                {h}
              </span>
            ))}
          </div>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-foreground-muted">
              <ListTodo className="w-8 h-8 mb-3 opacity-40" />
              <p className="text-[12px] tracking-[0.1em] uppercase">
                No tasks found
              </p>
            </div>
          ) : (
            <div className="divide-y divide-outline">
              {filtered.map((t) => (
                <div
                  key={t._id}
                  className="grid grid-cols-[2fr_1fr_1fr_120px_60px] gap-4 px-6 py-4 items-center hover:bg-surface-container transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <ListTodo className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-foreground truncate">
                        {t.title}
                      </p>
                      <div className="mt-0.5">
                        <StatusBadge status={t.status} />
                      </div>
                    </div>
                  </div>
                  <div className="text-[12px] text-foreground-muted truncate">
                    {t.projectId?.name || "Global"}
                  </div>
                  <div>
                    <PriorityBadge priority={t.priority} />
                  </div>
                  <div className="flex items-center gap-1.5 text-foreground-muted">
                    <Calendar className="w-3 h-3" />
                    <span className="text-[12px]">
                      {formatDate(t.deadline)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setModal({ type: "edit", task: t })}
                      className="p-1.5 text-foreground-muted hover:text-foreground transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setModal({ type: "delete", task: t })}
                      className="p-1.5 text-foreground-muted hover:text-[#ff4747] transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modal?.type === "add" && (
        <TaskModal
          mode="add"
          projects={projects}
          users={users}
          onClose={() => setModal(null)}
          onSave={handleAdd}
          saving={saving}
        />
      )}
      {modal?.type === "edit" && (
        <TaskModal
          mode="edit"
          initial={modal.task}
          projects={projects}
          users={users}
          onClose={() => setModal(null)}
          onSave={handleEdit}
          saving={saving}
        />
      )}
      {modal?.type === "delete" && (
        <DeleteModal
          task={modal.task}
          onClose={() => setModal(null)}
          onConfirm={handleDelete}
          saving={saving}
        />
      )}
    </div>
  );
}
