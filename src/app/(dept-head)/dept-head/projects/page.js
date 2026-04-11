"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  FolderKanban,
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
  ArrowRight,
  Users,
  Calendar,
} from "lucide-react";
import { ProjectsSkeleton } from "@/components/skeletons";
import { DatePicker } from "@/components/DatePicker";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from "@/services/projectService";
import { getUsers } from "@/services/userService";

// ─── Constants ────────────────────────────────────────────────
const STATUSES = [
  "PLANNING",
  "IN_PROGRESS",
  "CODE_REVIEW",
  "QA_TESTING",
  "APPROVED",
  "DEPLOYED",
];

const STATUS_META = {
  PLANNING: {
    label: "Planning",
    color: "text-foreground-muted",
    bg: "bg-foreground/5",
    border: "border-foreground/10",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "text-[#47c8ff]",
    bg: "bg-[#47c8ff]/10",
    border: "border-[#47c8ff]/20",
  },
  CODE_REVIEW: {
    label: "Code Review",
    color: "text-[#e8a847]",
    bg: "bg-[#e8a847]/10",
    border: "border-[#e8a847]/20",
  },
  QA_TESTING: {
    label: "QA Testing",
    color: "text-[#c847ff]",
    bg: "bg-[#c847ff]/10",
    border: "border-[#c847ff]/20",
  },
  APPROVED: {
    label: "Approved",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
  },
  DEPLOYED: {
    label: "Deployed",
    color: "text-[#47ff8a]",
    bg: "bg-[#47ff8a]/10",
    border: "border-[#47ff8a]/20",
  },
};

const EMPTY_FORM = {
  name: "",
  description: "",
  status: "PLANNING",
  managerIds: [],
  managerNames: [],
  testerIds: [],
  testerNames: [],
  developerIds: [],
  developerNames: [],
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
  const m = STATUS_META[status] || STATUS_META.PLANNING;
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

// ─── Multi-Select Dropdown ────────────────────────────────────
function MultiSelectDropdown({
  users,
  selectedIds,
  selectedNames,
  onChange,
  placeholder = "Unassigned",
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = (users || []).filter((u) =>
    (u?.name || "").toLowerCase().includes(search.toLowerCase()),
  );

  function toggle(userId) {
    const u = (users || []).find((u) => u?._id === userId);
    if (!u) return;
    const already = (selectedIds || []).includes(userId);
    onChange({
      ids: already
        ? selectedIds.filter((id) => id !== userId)
        : [...selectedIds, userId],
      names: already
        ? selectedNames.filter((n) => n !== u.name)
        : [...selectedNames, u.name],
    });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-left focus:outline-none focus:border-primary transition-colors"
      >
        <span
          className={
            selectedIds.length === 0
              ? "text-foreground-muted"
              : "text-foreground truncate pr-2"
          }
        >
          {selectedIds.length === 0
            ? placeholder
            : selectedNames.length === 1
              ? selectedNames[0]
              : `${selectedIds.length} selected`}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-foreground-muted shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-surface-low border border-outline shadow-2xl">
          <div className="p-2 border-b border-outline">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="w-full bg-surface-container border border-outline pl-7 pr-2 py-1.5 text-[11px] text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
          <div className="max-h-40 overflow-y-auto scrollbar-thin divide-y divide-outline">
            {filtered.length === 0 ? (
              <p className="text-[11px] text-foreground-muted text-center py-4">
                No users found
              </p>
            ) : (
              filtered.map((u, idx) => {
                const selected = selectedIds.includes(u._id || u.id);
                const key = u?._id || u?.id || u?.email || idx;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggle(u._id || u.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${selected ? "bg-primary/10" : "hover:bg-surface-container"}`}
                  >
                    <div
                      className={`w-3.5 h-3.5 border flex items-center justify-center shrink-0 ${selected ? "border-primary bg-primary/20" : "border-outline"}`}
                    >
                      {selected && (
                        <Check className="w-2.5 h-2.5 text-primary" />
                      )}
                    </div>
                    <span
                      className={`text-[12px] ${selected ? "text-primary" : "text-foreground-muted"}`}
                    >
                      {u.name}
                    </span>
                  </button>
                );
              })
            )}
          </div>
          {selectedIds.length > 0 && (
            <div className="p-2 border-t border-outline flex flex-wrap gap-1">
              {selectedNames.map((name, i) => (
                <span
                  key={`${name}-${i}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/15 border border-primary/25 text-[10px] text-primary"
                >
                  {name}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(selectedIds[i]);
                    }}
                    className="hover:text-foreground transition-colors"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Project Modal ────────────────────────────────────────────
function ProjectModal({ mode, initial, users, onClose, onSave, saving }) {
  const [form, setForm] = useState(
    initial
      ? {
          name: initial.name,
          description: initial.description || "",
          status: initial.status,
          managerIds: initial.managerIds || [],
          managerNames: initial.managerNames || [],
          testerIds: initial.testerIds || [],
          testerNames: initial.testerNames || [],
          developerIds: initial.developerIds || [],
          developerNames: initial.developerNames || [],
          deadline: initial.deadline || "",
        }
      : EMPTY_FORM,
  );
  const [errors, setErrors] = useState({});
  const [devSearch, setDevSearch] = useState("");

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
    if (!form.name.trim()) e.name = "Project name is required";
    if (!form.deadline) e.deadline = "Deadline is required";
    return e;
  }

  function handleDeveloperToggle(userId) {
    // idToName mapped below is safe to reference here because it's declared later
    const u = (users || []).find((u) => u?._id === userId);
    if (!u) return;
    const already = (form.developerIds || []).includes(userId);
    if (already) {
      // remove from developers only
      setForm((prev) => {
        const developerIds = (prev.developerIds || []).filter(
          (id) => id !== userId,
        );
        const developerNames = developerIds.map((id) => idToName[id] || "");
        return { ...prev, developerIds, developerNames };
      });
    } else {
      // add to developers and remove from managers/testers
      setForm((prev) => {
        const developerIds = [...(prev.developerIds || []), userId];
        const developerNames = developerIds.map((id) => idToName[id] || "");
        const managerIds = (prev.managerIds || []).filter(
          (id) => id !== userId,
        );
        const managerNames = managerIds.map((id) => idToName[id] || "");
        const testerIds = (prev.testerIds || []).filter((id) => id !== userId);
        const testerNames = testerIds.map((id) => idToName[id] || "");
        return {
          ...prev,
          developerIds,
          developerNames,
          managerIds,
          managerNames,
          testerIds,
          testerNames,
        };
      });
    }
  }

  function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    onSave(form);
  }

  // map id -> name for name lookups
  const idToName = Object.fromEntries(
    (users || []).map((u) => [String(u._id || u.id), u.name]),
  );

  // Developers list should exclude users already assigned as managers or testers
  const filteredDevs = (users || []).filter((u) => {
    const nameMatch = (u?.name || "")
      .toLowerCase()
      .includes(devSearch.toLowerCase());
    const userId = String(u._id || u.id || "");
    const isManager = (form.managerIds || []).map(String).includes(userId);
    const isTester = (form.testerIds || []).map(String).includes(userId);
    return nameMatch && !isManager && !isTester;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={!saving ? onClose : undefined}
      />
      <div className="relative w-full max-w-xl bg-surface-low border border-outline shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline">
          <span className="text-[11px] tracking-[0.2em] uppercase font-bold text-foreground">
            {mode === "add" ? "Create Project" : "Edit Project"}
          </span>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-foreground-muted hover:text-foreground transition-colors disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
          <Field label="Project Name" error={errors.name}>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Website Redesign"
              className="w-full bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary transition-colors"
            />
          </Field>

          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={2}
              placeholder="Brief project description…"
              className="w-full bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary transition-colors resize-none"
            />
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

          <div className="grid grid-cols-2 gap-3">
            <Field label="Project Managers">
              <MultiSelectDropdown
                users={(users || []).filter((u) => {
                  const id = String(u._id || u.id || "");
                  return !(
                    (form.testerIds || []).map(String).includes(id) ||
                    (form.developerIds || []).map(String).includes(id)
                  );
                })}
                selectedIds={form.managerIds}
                selectedNames={form.managerNames}
                onChange={({ ids, names }) =>
                  setForm((prev) => {
                    const managerIds = ids.map(String);
                    const managerNames = managerIds.map(
                      (id) => idToName[id] || "",
                    );
                    const testerIds = (prev.testerIds || []).filter(
                      (id) => !managerIds.includes(String(id)),
                    );
                    const testerNames = testerIds.map(
                      (id) => idToName[String(id)] || "",
                    );
                    const developerIds = (prev.developerIds || []).filter(
                      (id) => !managerIds.includes(String(id)),
                    );
                    const developerNames = developerIds.map(
                      (id) => idToName[String(id)] || "",
                    );
                    return {
                      ...prev,
                      managerIds,
                      managerNames,
                      testerIds,
                      testerNames,
                      developerIds,
                      developerNames,
                    };
                  })
                }
                placeholder="Unassigned"
              />
            </Field>
            <Field label="Testers">
              <MultiSelectDropdown
                users={(users || []).filter((u) => {
                  const id = String(u._id || u.id || "");
                  return !(
                    (form.managerIds || []).map(String).includes(id) ||
                    (form.developerIds || []).map(String).includes(id)
                  );
                })}
                selectedIds={form.testerIds}
                selectedNames={form.testerNames}
                onChange={({ ids, names }) =>
                  setForm((prev) => {
                    const testerIds = ids.map(String);
                    const testerNames = testerIds.map(
                      (id) => idToName[id] || "",
                    );
                    const managerIds = (prev.managerIds || []).filter(
                      (id) => !testerIds.includes(String(id)),
                    );
                    const managerNames = managerIds.map(
                      (id) => idToName[String(id)] || "",
                    );
                    const developerIds = (prev.developerIds || []).filter(
                      (id) => !testerIds.includes(String(id)),
                    );
                    const developerNames = developerIds.map(
                      (id) => idToName[String(id)] || "",
                    );
                    return {
                      ...prev,
                      testerIds,
                      testerNames,
                      managerIds,
                      managerNames,
                      developerIds,
                      developerNames,
                    };
                  })
                }
                placeholder="Unassigned"
              />
            </Field>
          </div>

          <Field label="Developers (select multiple)">
            <div className="relative mb-1.5">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground-muted" />
              <input
                value={devSearch}
                onChange={(e) => setDevSearch(e.target.value)}
                placeholder="Search developers…"
                className="w-full bg-surface-container border border-outline pl-8 pr-3 py-2 text-[11px] text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="bg-surface-container border border-outline max-h-32 overflow-y-auto scrollbar-thin divide-y divide-outline">
              {filteredDevs.length === 0 ? (
                <p className="text-[11px] text-foreground-muted text-center py-4">
                  No users found
                </p>
              ) : (
                filteredDevs.map((u, idx) => {
                  const userId = u._id || u.id;
                  const selected = (form.developerIds || []).includes(userId);
                  const key = u?._id || u?.id || u?.email || idx;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleDeveloperToggle(userId)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${selected ? "bg-primary/10" : "hover:bg-surface-container"}`}
                    >
                      <div
                        className={`w-3.5 h-3.5 border flex items-center justify-center shrink-0 ${selected ? "border-primary bg-primary/20" : "border-outline"}`}
                      >
                        {selected && (
                          <Check className="w-2.5 h-2.5 text-primary" />
                        )}
                      </div>
                      <span
                        className={`text-[12px] ${selected ? "text-primary" : "text-foreground-muted"}`}
                      >
                        {u.name}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </Field>

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
            disabled={saving}
            className="flex-1 py-2.5 text-[11px] tracking-[0.15em] uppercase font-bold border border-outline text-foreground-muted hover:text-foreground hover:border-foreground-muted transition-colors disabled:opacity-40"
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
              <Check className="w-3.5 h-3.5" />
            )}
            {mode === "add" ? "Create Project" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────
function DeleteModal({ project, onClose, onConfirm, saving }) {
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
          This will also delete all modules and logs. This action cannot be
          undone.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 text-[11px] tracking-[0.15em] uppercase font-bold border border-outline text-foreground-muted hover:text-foreground hover:border-foreground-muted transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={saving}
            className="flex-1 py-2.5 text-[11px] tracking-[0.15em] uppercase font-bold bg-[#ff4747] text-foreground hover:bg-[#e03d3d] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
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
export default function DeptHeadProjects() {
  const router = useRouter();
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
      setError(null);
      const [proj, usersData] = await Promise.all([getProjects(), getUsers()]);

      const usersArr = Array.isArray(usersData)
        ? usersData
        : (usersData?.users ?? []);
      const idToName = Object.fromEntries(
        (usersArr || []).map((u) => [String(u._id ?? u.id ?? ""), u.name]),
      );

      const projectsArr = Array.isArray(proj) ? proj : [];

      // Backend may return populated objects {_id, name} or plain string IDs.
      // Normalise to plain string IDs so MultiSelectDropdown comparisons work.
      const normaliseIds = (arr) =>
        (Array.isArray(arr) ? arr : []).map((item) =>
          item?._id ? String(item._id) : String(item),
        );

      const enriched = (projectsArr || []).map((p) => {
        const managerIds = normaliseIds(
          p.managerIds ?? (p.managerId ? [p.managerId] : []),
        );
        const testerIds = normaliseIds(
          p.testerIds ?? (p.testerId ? [p.testerId] : []),
        );
        const developerIds = normaliseIds(p.developerIds ?? []);

        // Use names already computed by the backend; fall back to idToName lookup
        const managerNames = p.managerNames?.length
          ? p.managerNames
          : managerIds.map((id) => idToName[id]).filter(Boolean);
        const testerNames = p.testerNames?.length
          ? p.testerNames
          : testerIds.map((id) => idToName[id]).filter(Boolean);
        const developerNames = p.developerNames?.length
          ? p.developerNames
          : developerIds.map((id) => idToName[id]).filter(Boolean);

        return {
          ...p,
          managerIds,
          testerIds,
          developerIds,
          managerNames,
          testerNames,
          developerNames,
        };
      });

      setProjects(enriched);
      setUsers(usersArr);
    } catch (err) {
      console.error("Failed to load projects:", err);
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to load projects. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = (projects || []).filter((p) => {
    const matchSearch =
      (p?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.managerNames || []).some((n) =>
        (n || "").toLowerCase().includes(search.toLowerCase()),
      );
    const matchStatus = filterStatus === "all" || p?.status === filterStatus;
    return matchSearch && matchStatus;
  });

  async function handleAdd(form) {
    try {
      setSaving(true);
      const newProject = await createProject(form);
      // Enrich with names from the already-loaded users list
      const idToName = Object.fromEntries(
        (users || []).map((u) => [String(u._id ?? u.id ?? ""), u.name]),
      );
      const normaliseIds = (arr) =>
        (Array.isArray(arr) ? arr : []).map((item) =>
          item?._id ? String(item._id) : String(item),
        );
      const managerIds = normaliseIds(newProject.managerIds ?? (newProject.managerId ? [newProject.managerId] : []));
      const testerIds = normaliseIds(newProject.testerIds ?? (newProject.testerId ? [newProject.testerId] : []));
      const developerIds = normaliseIds(newProject.developerIds ?? []);
      const enriched = {
        ...newProject,
        managerIds,
        testerIds,
        developerIds,
        managerNames: managerIds.map((id) => idToName[id]).filter(Boolean),
        testerNames: testerIds.map((id) => idToName[id]).filter(Boolean),
        developerNames: developerIds.map((id) => idToName[id]).filter(Boolean),
      };
      setProjects((prev) => [...(Array.isArray(prev) ? prev : []), enriched]);
      setModal(null);
    } catch {
      setError("Failed to create project.");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(form) {
    try {
      setSaving(true);
      const updated = await updateProject(modal.project._id, form);
      // Re-enrich the returned project with name arrays from current users list
      const idToName = Object.fromEntries(
        (users || []).map((u) => [String(u._id ?? u.id ?? ""), u.name]),
      );
      const normaliseIds = (arr) =>
        (Array.isArray(arr) ? arr : []).map((item) =>
          item?._id ? String(item._id) : String(item),
        );
      const managerIds = normaliseIds(updated.managerIds);
      const testerIds = normaliseIds(updated.testerIds);
      const developerIds = normaliseIds(updated.developerIds);
      const enriched = {
        ...updated,
        managerIds,
        testerIds,
        developerIds,
        managerNames: managerIds.map((id) => idToName[id]).filter(Boolean),
        testerNames: testerIds.map((id) => idToName[id]).filter(Boolean),
        developerNames: developerIds.map((id) => idToName[id]).filter(Boolean),
      };
      setProjects((prev) =>
        (Array.isArray(prev) ? prev : []).map((p) =>
          p._id === modal.project._id ? enriched : p,
        ),
      );
      setModal(null);
    } catch {
      setError("Failed to update project.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      setSaving(true);
      await deleteProject(modal.project._id);
      setProjects((prev) =>
        (Array.isArray(prev) ? prev : []).filter(
          (p) => p._id !== modal.project._id,
        ),
      );
      setModal(null);
    } catch {
      setError("Failed to delete project.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <ProjectsSkeleton />;

  const projArr = projects || [];
  const showProgress = (projArr || []).some((p) => (p.modulesTotal || 0) > 0);
  const stats = {
    total: projArr.length,
    active: projArr.filter((p) =>
      ["IN_PROGRESS", "CODE_REVIEW", "QA_TESTING"].includes(p?.status),
    ).length,
    deployed: projArr.filter((p) => p?.status === "DEPLOYED").length,
    planning: projArr.filter((p) => p?.status === "PLANNING").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-y-3">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-foreground-muted mb-1">
            Department
          </p>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Projects
          </h1>
        </div>
        <button
          onClick={() => setModal({ type: "add" })}
          className="flex items-center gap-2 px-4 py-2.5 text-[11px] tracking-[0.15em] uppercase font-bold bg-primary text-on-primary hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Project
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Projects",
            value: stats.total,
            accent: "text-foreground",
          },
          { label: "Active", value: stats.active, accent: "text-[#47c8ff]" },
          {
            label: "Planning",
            value: stats.planning,
            accent: "text-[#e8a847]",
          },
          {
            label: "Deployed",
            value: stats.deployed,
            accent: "text-[#47ff8a]",
          },
        ].map(({ label, value, accent }) => (
          <div key={label} className="border border-outline bg-surface-low p-4">
            <p className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted mb-2">
              {label}
            </p>
            <p className={`text-2xl font-bold ${accent}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 border border-[#ff4747]/30 bg-[#ff4747]/5 text-[#ff4747]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-[12px]">{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects or managers…"
            className="w-full bg-surface-container border border-outline pl-9 pr-3 py-2.5 text-[12px] text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none bg-surface-container border border-outline px-3 py-2.5 pr-8 text-[12px] text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
          >
            <option value="all">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground-muted pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <div className="border border-outline bg-surface-low overflow-hidden min-w-145">
          <div
            className={`grid ${showProgress ? "grid-cols-[2fr_1fr_1fr_160px_60px]" : "grid-cols-[2fr_1fr_160px_60px]"} gap-4 px-6 py-3 border-b border-outline bg-surface-container`}
          >
            <span className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted font-bold">
              Project
            </span>
            <span className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted font-bold">
              Manager / Tester / Developer
            </span>
            {showProgress && (
              <span className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted font-bold">
                Progress
              </span>
            )}
            <span className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted font-bold">
              Deadline
            </span>
            <span className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted font-bold"></span>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-foreground-muted">
              <FolderKanban className="w-8 h-8 mb-3 opacity-40" />
              <p className="text-[12px] tracking-[0.1em] uppercase">
                No projects found
              </p>
            </div>
          ) : (
            <div className="divide-y divide-outline">
              {filtered.map((p, _i) => {
                const pct = progressPct(p.modulesCompleted, p.modulesTotal);
                const key = p?._id || p?.id || `project-${_i}`;
                return (
                  <div
                    key={key}
                    onClick={() =>
                      router.push(`/dept-head/projects/${p._id || p.id || ""}`)
                    }
                    className={`grid ${showProgress ? "grid-cols-[2fr_1fr_1fr_160px_60px]" : "grid-cols-[2fr_1fr_160px_60px]"} gap-4 px-6 py-4 items-center hover:bg-surface-container transition-colors group cursor-pointer`}
                  >
                    {/* Name + status */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <FolderKanban className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-foreground truncate">
                          {p.name}
                        </p>
                        <div className="mt-0.5">
                          <StatusBadge status={p.status} />
                        </div>
                      </div>
                    </div>
                    {/* Manager / Tester / Developer */}
                    <div>
                      <p className="text-[10px] text-foreground-muted">
                        Project Manager:{" "}
                        {p.managerNames?.length
                          ? p.managerNames.join(", ")
                          : "—"}
                      </p>
                      <p className="text-[10px] text-foreground-muted">
                        Tester:{" "}
                        {p.testerNames?.length ? p.testerNames.join(", ") : "—"}
                      </p>
                      <p className="text-[10px] text-foreground-muted">
                        Developer:{" "}
                        {p.developerNames?.length
                          ? p.developerNames.join(", ")
                          : "—"}
                      </p>
                    </div>
                    {showProgress && (
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-foreground-muted">
                            {p.modulesCompleted}/{p.modulesTotal} modules
                          </span>
                          <span className="text-[10px] text-foreground-muted">
                            {pct}%
                          </span>
                        </div>
                        <div className="h-1 bg-surface-high">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {/* Deadline */}
                    <div className="flex items-center gap-1.5 text-foreground-muted">
                      <Calendar className="w-3 h-3" />
                      <span className="text-[12px]">
                        {formatDate(p.deadline)}
                      </span>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setModal({ type: "edit", project: p });
                        }}
                        className="p-1.5 text-foreground-muted hover:text-foreground transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setModal({ type: "delete", project: p });
                        }}
                        className="p-1.5 text-foreground-muted hover:text-[#ff4747] transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {filtered.length > 0 && (
        <p className="text-[10px] tracking-[0.1em] uppercase text-foreground-muted">
          Showing {filtered.length} of {(projects || []).length} project
          {(projects || []).length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Modals */}
      {modal?.type === "add" && (
        <ProjectModal
          mode="add"
          users={users}
          onClose={() => setModal(null)}
          onSave={handleAdd}
          saving={saving}
        />
      )}
      {modal?.type === "edit" && (
        <ProjectModal
          mode="edit"
          initial={modal.project}
          users={users}
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
          saving={saving}
        />
      )}
    </div>
  );
}
