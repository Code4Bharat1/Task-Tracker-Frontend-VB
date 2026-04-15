"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Check,
  ChevronDown,
  Loader2,
  AlertCircle,
  Users,
  ArrowLeft,
  UserCog,
} from "lucide-react";
import { DepartmentsSkeleton, Bone } from "@/components/skeletons";
import {
  getDepartments,
  getDepartmentMembers,
  createDepartment,
  updateDepartment,
  assignDepartmentHead,
  deleteDepartment,
} from "@/services/departmentService";
import { getUsers } from "@/services/userService";

// ─── Helpers ─────────────────────────────────────────────────
// departmentName is stored lowercase in DB — capitalise for display
function displayName(name = "") {
  return name.toUpperCase();
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Field wrapper ────────────────────────────────────────────
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

// ─── Add / Edit Modal ─────────────────────────────────────────
// Only field on the model is departmentName
function DeptModal({ mode, initial, onClose, onSave, saving }) {
  const [departmentName, setDepartmentName] = useState(
    initial ? displayName(initial.departmentName) : "",
  );
  const [headId, setHeadId] = useState("");
  const [newHeadName, setNewHeadName] = useState("");
  const [newHeadEmail, setNewHeadEmail] = useState("");
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (mode === "add") {
      getUsers({ filterRole: "department_head", limit: 100 })
        .then(setUsers)
        .catch(() => { });
    }
  }, [mode]);

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

  function handleSubmit() {
    if (!departmentName.trim()) {
      setError("Department name is required");
      return;
    }
    onSave({
      departmentName: departmentName.trim(),
      headId: headId || null,
      newHeadName: newHeadName.trim() || null,
      newHeadEmail: newHeadEmail.trim() || null,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={!saving ? onClose : undefined}
      />
      <div className="relative w-full max-w-sm bg-surface-low border border-outline shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline">
          <span className="text-[11px] tracking-[0.2em] uppercase font-bold text-foreground">
            {mode === "add" ? "Create Department" : "Edit Department"}
          </span>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-foreground-muted hover:text-foreground transition-colors disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* departmentName → departments.model.js: departmentName */}
          <Field label="Department Name" error={error}>
            <input
              value={departmentName}
              onChange={(e) => {
                setDepartmentName(e.target.value);
                setError("");
              }}
              placeholder="e.g. Engineering"
              className="w-full bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary transition-colors"
            />
          </Field>
          {mode === "add" && (
            <>
              <Field label="Department Head (existing user)">
                <div className="relative">
                  <select
                    value={headId}
                    onChange={(e) => setHeadId(e.target.value)}
                    className="w-full appearance-none bg-surface-container border border-outline px-3 py-2.5 pr-8 text-[12px] text-foreground focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="">— None —</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground-muted pointer-events-none" />
                </div>
              </Field>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-outline" />
                <span className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted">
                  or create new head
                </span>
                <div className="flex-1 h-px bg-outline" />
              </div>

              <Field label="New Head Name">
                <input
                  value={newHeadName}
                  onChange={(e) => setNewHeadName(e.target.value)}
                  placeholder="e.g. Ali Hassan"
                  className="w-full bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary transition-colors"
                />
              </Field>

              <Field label="New Head Email">
                <input
                  type="email"
                  value={newHeadEmail}
                  onChange={(e) => setNewHeadEmail(e.target.value)}
                  placeholder="e.g. ali@company.com"
                  className="w-full bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary transition-colors"
                />
              </Field>
            </>
          )}
        </div>

        <div className="flex gap-2 px-6 pb-5">
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
            {mode === "add" ? "Create" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Assign Head Modal ────────────────────────────────────────
// Assigns department_head role to a user in this department
// Updates globalRole on the user — not on department model
function AssignHeadModal({ dept, onClose, onSave, saving }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(dept.head?._id ?? null);

  useEffect(() => {
    getDepartmentMembers(dept._id)
      .then((m) => {
        const filtered = (m ?? []).filter(
          (u) => u.globalRole !== "admin" && u.globalRole !== "super_admin",
        );
        setMembers(filtered);
        setSelectedId((prev) =>
          prev && filtered.some((x) => String(x._id) === String(prev))
            ? prev
            : null,
        );
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [dept._id]);

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
      <div className="relative w-full max-w-sm bg-surface-low border border-outline shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline">
          <div className="flex items-center gap-2">
            <UserCog className="w-4 h-4 text-primary" />
            <span className="text-[11px] tracking-[0.2em] uppercase font-bold text-foreground">
              Assign Head — {displayName(dept.departmentName)}
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

        <div className="px-4 py-3 max-h-64 overflow-y-auto space-y-1.5">
          {loading ? (
            <div className="flex justify-center py-8">
              <Bone className="h-5 w-5 rounded-full" />
            </div>
          ) : members.length === 0 ? (
            <p className="text-[11px] text-foreground-muted text-center py-8">
              No members in this department
            </p>
          ) : (
            <>
              {/* None option */}
              <button
                onClick={() => setSelectedId(null)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 border transition-colors text-left ${selectedId === null
                    ? "border-primary/40 bg-primary/5"
                    : "border-outline hover:border-outline hover:bg-surface-container"
                  }`}
              >
                <div className="w-7 h-7 bg-surface-container border border-outline flex items-center justify-center text-[10px] text-foreground-muted">
                  —
                </div>
                <span className="text-[12px] text-foreground-muted">
                  No head assigned
                </span>
                {selectedId === null && (
                  <Check className="w-3.5 h-3.5 text-primary ml-auto" />
                )}
              </button>

              {members.map((u) => (
                <button
                  key={u._id}
                  onClick={() => setSelectedId(u._id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 border transition-colors text-left ${selectedId === u._id
                      ? "border-primary/40 bg-primary/5"
                      : "border-outline hover:border-outline hover:bg-surface-container"
                    }`}
                >
                  <div className="w-7 h-7 bg-surface-container border border-outline flex items-center justify-center text-[11px] font-bold text-primary">
                    {u.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-foreground truncate">
                      {u.name}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-foreground-muted">
                      {u.globalRole.replace("_", " ")}
                    </p>
                  </div>
                  {selectedId === u._id && (
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  )}
                </button>
              ))}
            </>
          )}
        </div>

        <div className="flex gap-2 px-6 pb-5 pt-3 border-t border-outline">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 text-[11px] tracking-[0.15em] uppercase font-bold border border-outline text-foreground-muted hover:text-foreground hover:border-foreground-muted transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(selectedId)}
            disabled={saving || loading}
            className="flex-1 py-2.5 text-[11px] tracking-[0.15em] uppercase font-bold bg-primary text-on-primary hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            Assign
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────
function DeleteModal({ dept, onClose, onConfirm, saving }) {
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
            Delete Department
          </span>
        </div>
        <p className="text-[12px] text-foreground-muted mb-1">
          You are about to delete:
        </p>
        <p className="text-[13px] font-bold text-foreground mb-2">
          {displayName(dept.departmentName)}
        </p>
        <p className="text-[11px] text-foreground-muted mb-5">
          This department has{" "}
          <span className="text-[#ff4747]">{dept.employeeCount} members</span>.{" "}
          This action cannot be undone.
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

// ─── Members Drawer ───────────────────────────────────────────
function MembersDrawer({ dept, onClose }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("this are departments");
    console.log(members);
  }, [members]);
  useEffect(() => {
    getDepartmentMembers(dept._id)
      .then((m) => {
        const filtered = (m ?? []).filter(
          (u) => u.globalRole !== "admin" && u.globalRole !== "super_admin",
        );
        setMembers(filtered);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [dept._id]);

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
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm bg-surface-low border border-outline flex flex-col shadow-2xl max-h-[80vh]">
        <div className="px-6 py-5 border-b border-outline">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-foreground-muted hover:text-foreground transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="text-[10px] tracking-[0.15em] uppercase">
              Back
            </span>
          </button>
          <h2 className="text-[13px] font-bold text-foreground">
            {displayName(dept.departmentName)}
          </h2>
          <p className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted mt-0.5">
            {dept.employeeCount} members
          </p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[#161616]">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <Bone className="h-5 w-5 rounded-full" />
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <Users className="w-6 h-6 text-foreground" />
              <p className="text-[11px] tracking-[0.15em] uppercase text-foreground-muted">
                No members
              </p>
            </div>
          ) : (
            members.map((u) => (
              <div
                key={u._id}
                className="flex items-center gap-3 px-6 py-3.5 hover:bg-surface-container transition-colors"
              >
                <div className="w-8 h-8 bg-surface-container border border-outline flex items-center justify-center text-[12px] font-bold text-primary shrink-0">
                  {u.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-foreground truncate">
                    {u.name}
                  </p>
                  <p className="text-[10px] tracking-[0.1em] uppercase text-foreground-muted">
                    {u.globalRole.replace(/_/g, " ")}
                  </p>
                </div>
                {/* head badge — derived from globalRole */}
                {u._id === dept.head?._id && (
                  <span className="text-[9px] tracking-[0.12em] uppercase font-bold text-primary border border-primary/30 px-1.5 py-0.5 shrink-0">
                    Head
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  // null | {type:"add"} | {type:"edit",dept} | {type:"delete",dept}
  //      | {type:"assign",dept} | {type:"members",dept}

  const loadDepartments = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const [rawDepts, heads] = await Promise.all([
        getDepartments(),
        getUsers({ filterRole: "department_head", limit: 100 }).catch(() => []),
      ]);
      const depts = Array.isArray(rawDepts) ? rawDepts : [];
      const allHeads = Array.isArray(heads) ? heads : [];
      const enriched = depts.map((dept) => ({
        ...dept,
        head:
          allHeads.find((u) => String(u.departmentId) === String(dept._id)) ||
          null,
      }));
      setDepartments(enriched);
    } catch {
      if (!silent) setError("Failed to load departments. Please try again.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  const filtered = departments.filter(
    (d) =>
      d?.departmentName?.toLowerCase().includes(search.toLowerCase()) ||
      (d?.head?.name ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  async function handleAdd(payload) {
    try {
      setSaving(true);
      const result = await createDepartment(payload);
      // Immediately reflect the new dept in state with head from response
      const dept = result?.department ?? result;
      const head = result?.head ?? null;
      if (dept?._id) {
        setDepartments((prev) => [...(prev || []), { ...dept, head }]);
      }
      setModal(null);
      // Background reload to ensure consistency (handles existing-headId case too)
      loadDepartments(true);
    } catch {
      setError("Failed to add department.");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(payload) {
    try {
      setSaving(true);
      await updateDepartment(modal.dept._id, payload);
      setModal(null);
      loadDepartments(true);
    } catch {
      setError("Failed to update department.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAssign(userId) {
    try {
      setSaving(true);
      await assignDepartmentHead(modal.dept._id, userId);
      setModal(null);
      loadDepartments(true);
    } catch {
      setError("Failed to assign department head.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      setSaving(true);
      await deleteDepartment(modal.dept._id);
      setDepartments((prev) =>
        (prev || []).filter((d) => d._id !== modal.dept._id),
      );
      setModal(null);
    } catch {
      setError("Failed to delete department.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <DepartmentsSkeleton />;

  return (
    <div className="space-y-6">
      {/* ── Header */}
      <div className="flex flex-wrap items-center justify-between gap-y-3">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-foreground-muted mb-1">
            Admin / Department Management
          </p>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Departments <span className="text-primary"></span>
          </h1>
        </div>
        <button
          onClick={() => setModal({ type: "add" })}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary text-[11px] tracking-[0.15em] uppercase font-bold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Department
        </button>
      </div>

      {/* ── Error Banner */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 border border-[#ff4747]/30 bg-[#ff4747]/10">
          <AlertCircle className="w-4 h-4 text-[#ff4747] shrink-0" />
          <p className="text-[11px] text-[#ff4747] flex-1">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-[#ff4747] hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Stats */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Total Departments", value: departments.length },
          {
            label: "Total Members",
            value: departments.reduce(
              (s, d) => s + (Number(d?.employeeCount) || 0),
              0,
            ),
          },
        ].map(({ label, value }) => (
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

      {/* ── Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or head..."
            className="w-full bg-surface-low border border-outline pl-9 pr-4 py-2.5 text-[12px] text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <span className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted ml-auto">
          {filtered.length} of {departments.length} departments
        </span>
      </div>

      {/* ── Mobile Cards */}
      <div className="md:hidden space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 border border-outline bg-surface-low">
            <Building2 className="w-8 h-8 text-foreground" />
            <p className="text-[11px] tracking-[0.15em] uppercase text-foreground-muted">
              No departments found
            </p>
          </div>
        ) : (
          filtered.map((dept) => (
            <div
              key={dept._id}
              className="border border-outline bg-surface-low p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-surface-container border border-outline flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-foreground truncate">
                      {displayName(dept.departmentName)}
                    </p>
                    <p className="text-[11px] text-foreground-muted">
                      {dept.head ? dept.head.name : "No head assigned"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setModal({ type: "assign", dept })}
                    className="p-1.5 text-foreground-muted hover:text-[#47c8ff] transition-colors"
                    title="Assign head"
                  >
                    <UserCog className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setModal({ type: "edit", dept })}
                    className="p-1.5 text-foreground-muted hover:text-foreground transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setModal({ type: "delete", dept })}
                    className="p-1.5 text-foreground-muted hover:text-[#ff4747] transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-outline">
                <button
                  onClick={() => setModal({ type: "members", dept })}
                  className="flex items-center gap-1.5 text-foreground-muted hover:text-primary transition-colors"
                  title="View members"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span className="text-[12px] font-bold">
                    {dept.employeeCount} members
                  </span>
                </button>
                <span className="text-[11px] text-foreground-muted ml-auto">
                  {formatDate(dept.created_at)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <div className="border border-outline bg-surface-low overflow-hidden min-w-150">
          <div className="grid grid-cols-[2fr_2fr_1fr_1fr_100px] gap-4 px-6 py-3 border-b border-outline bg-surface-container">
            {["Department", "Head", "Members", "Created", ""].map((h) => (
              <span
                key={h}
                className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted font-bold"
              >
                {h}
              </span>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Building2 className="w-8 h-8 text-foreground" />
              <p className="text-[11px] tracking-[0.15em] uppercase text-foreground-muted">
                No departments found
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#161616]">
              {filtered.map((dept) => (
                <div
                  key={dept._id}
                  className="grid grid-cols-[2fr_2fr_1fr_1fr_100px] gap-4 px-6 py-4 items-center hover:bg-surface-container transition-colors group"
                >
                  {/* departmentName */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 bg-surface-container border border-outline flex items-center justify-center shrink-0">
                      <Building2 className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-[12px] font-bold text-foreground tracking-wide truncate flex-1 min-w-0">
                      {displayName(dept.departmentName)}
                    </span>
                  </div>

                  {/* head — derived from users.globalRole */}
                  <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                    {dept.head ? (
                      <>
                        <div className="w-5 h-5 bg-surface-container border border-outline flex items-center justify-center text-[9px] font-bold text-primary shrink-0">
                          {dept.head.name.charAt(0)}
                        </div>
                        <span className="text-[12px] text-foreground tracking-wide truncate flex-1 min-w-0">
                          {dept.head.name}
                        </span>
                      </>
                    ) : (
                      <span className="text-[11px] text-foreground-muted italic">
                        Unassigned
                      </span>
                    )}
                  </div>

                  {/* employeeCount — derived from users.departmentId */}
                  <button
                    onClick={() => setModal({ type: "members", dept })}
                    className="flex items-center gap-1.5 text-foreground-muted hover:text-primary transition-colors w-fit"
                    title="View members"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-[12px] font-bold">
                      {dept.employeeCount}
                    </span>
                  </button>

                  {/* created_at */}
                  <span className="text-[11px] text-foreground-muted">
                    {formatDate(dept.created_at)}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setModal({ type: "assign", dept })}
                      className="p-1.5 text-foreground-muted hover:text-[#47c8ff] hover:bg-primary/10 transition-colors"
                      title="Assign head"
                    >
                      <UserCog className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setModal({ type: "edit", dept })}
                      className="p-1.5 text-foreground-muted hover:text-foreground hover:bg-surface-container transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setModal({ type: "delete", dept })}
                      className="p-1.5 text-foreground-muted hover:text-[#ff4747] hover:bg-red-500/5 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Modals & Drawer */}
      {modal?.type === "add" && (
        <DeptModal
          mode="add"
          saving={saving}
          onClose={() => setModal(null)}
          onSave={handleAdd}
        />
      )}
      {modal?.type === "edit" && (
        <DeptModal
          mode="edit"
          initial={modal.dept}
          saving={saving}
          onClose={() => setModal(null)}
          onSave={handleEdit}
        />
      )}
      {modal?.type === "assign" && (
        <AssignHeadModal
          dept={modal.dept}
          saving={saving}
          onClose={() => setModal(null)}
          onSave={handleAssign}
        />
      )}
      {modal?.type === "delete" && (
        <DeleteModal
          dept={modal.dept}
          saving={saving}
          onClose={() => setModal(null)}
          onConfirm={handleDelete}
        />
      )}
      {modal?.type === "members" && (
        <MembersDrawer dept={modal.dept} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
