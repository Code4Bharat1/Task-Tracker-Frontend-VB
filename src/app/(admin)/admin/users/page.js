"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Check,
  ChevronDown,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { UsersSkeleton } from "@/components/skeletons";
import {
  getUsers,
  getDepartments,
  createUser,
  updateUser,
  deleteUser,
} from "@/services/userService";

// ─── Constants ───────────────────────────────────────────────
// SRS §5.1 — Global roles only
const GLOBAL_ROLES = [
  { value: "department_head", label: "Dept Head" },
  { value: "lead", label: "Lead" },
  { value: "employee", label: "Employee" },
];

const EMPTY_FORM = {
  name: "",
  email: "",
  globalRole: "department_head",
  departmentId: "",
  isActive: true,
};
// Helper to display department name nicely
function displayDept(deptName) {
  if (!deptName) return "—";
  return deptName.toUpperCase();
}

// Helper to return label + className for a user role badge
function roleBadge(role) {
  if (role === "admin")
    return { label: "Admin", cls: "bg-[#ff4747]/10 text-[#ff4747] border-[#ff4747]/20" };
  if (role === "department_head")
    return { label: "Dept Head", cls: "bg-[#47c8ff]/10 text-[#47c8ff] border-[#47c8ff]/20" };
  if (role === "lead")
    return { label: "Lead", cls: "bg-[#c847ff]/10 text-[#c847ff] border-[#c847ff]/20" };
  return { label: "Employee", cls: "bg-primary/10 text-primary border-primary/20" };
}

// ─── Form Field Wrapper ───────────────────────────────────────
function Field({ label, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
        {label}
      </label>
      {children}
      {error && <p className="text-[11px] text-[#ff4747]">{error}</p>}
    </div>
  );
}

// ─── Add / Edit Modal ─────────────────────────────────────────
function UserModal({ mode, initial, departments, onClose, onSave, saving }) {
  const [form, setForm] = useState(
    initial
      ? {
          name: initial.name,
          email: initial.email,
          globalRole: initial.globalRole,
          departmentId: initial.departmentId ?? "",
          isActive: initial.isActive,
        }
      : EMPTY_FORM,
  );
  const [errors, setErrors] = useState({});

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
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Invalid email address";
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={!saving ? onClose : undefined}
      />
      <div className="relative w-full max-w-md bg-surface-low border border-outline shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline">
          <span className="text-[11px] tracking-[0.2em] uppercase font-bold text-foreground">
            {mode === "add" ? "Add New User" : "Edit User"}
          </span>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-foreground-muted hover:text-foreground transition-colors disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* name → users.model.js: name */}
          <Field label="Full Name" error={errors.name}>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="John Doe"
              className="w-full bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary transition-colors"
            />
          </Field>

          {/* email → users.model.js: email */}
          <Field label="Email Address" error={errors.email}>
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="john@company.com"
              className="w-full bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary transition-colors"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            {/* globalRole → users.model.js: globalRole */}
            <Field label="Role">
              <div className="relative">
                <select
                  value={form.globalRole}
                  onChange={(e) =>
                    setForm({ ...form, globalRole: e.target.value })
                  }
                  className="w-full appearance-none bg-surface-container border border-outline px-3 py-2.5 pr-8 text-[12px] text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  {GLOBAL_ROLES.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground-muted pointer-events-none" />
              </div>
            </Field>

            {/* departmentId → users.model.js: departmentId (ObjectId ref) */}
            <Field label="Department">
              <div className="relative">
                <select
                  value={form.departmentId}
                  onChange={(e) =>
                    setForm({ ...form, departmentId: e.target.value })
                  }
                  className="w-full appearance-none bg-surface-container border border-outline px-3 py-2.5 pr-8 text-[12px] text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  <option value="">None</option>
                  {(departments ?? []).map((d) => (
                    <option key={d._id} value={d._id}>
                      {displayDept(d.departmentName)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground-muted pointer-events-none" />
              </div>
            </Field>
          </div>

          {/* isActive → users.model.js: isActive (Boolean) */}
          <Field label="Status">
            <div className="flex gap-2">
              {[
                { value: true, label: "Active" },
                { value: false, label: "Inactive" },
              ].map(({ value, label }) => (
                <button
                  key={label}
                  onClick={() => setForm({ ...form, isActive: value })}
                  className={`flex-1 py-2 text-[11px] tracking-[0.12em] uppercase font-bold border transition-colors ${
                    form.isActive === value
                      ? value
                        ? "bg-primary/10 border-primary/40 text-primary"
                        : "bg-[#ff4747]/10 border-[#ff4747]/40 text-[#ff4747]"
                      : "border-outline text-foreground-muted hover:border-foreground-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>
        </div>

        {/* Footer */}
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
            {mode === "add" ? "Add User" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────
function DeleteModal({ user, onClose, onConfirm, saving }) {
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
            Delete User
          </span>
        </div>
        <p className="text-[12px] text-foreground-muted mb-1">
          You are about to delete:
        </p>
        <p className="text-[13px] font-bold text-foreground mb-2">
          {user.name}
        </p>
        <p className="text-[11px] text-foreground-muted mb-5">
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

// ─── Main Page ────────────────────────────────────────────────
export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [modal, setModal] = useState(null);
  // null | {type:"add"} | {type:"edit",user} | {type:"delete",user}

  // ── Helper: resolve departmentName from departmentId
  function getDeptName(departmentId) {
    if (!departmentId) return "—";
    // departmentId may be an ObjectId, a string, or a populated object
    const id =
      typeof departmentId === "object"
        ? String(departmentId._id ?? departmentId)
        : String(departmentId);
    const dept = (departments ?? []).find((d) => String(d._id) === id);
    return dept ? displayDept(dept.departmentName) : "—";
  }

  // ── Load users + departments together on mount
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersData, deptsData] = await Promise.all([
        getUsers(),
        getDepartments(),
      ]);
      setUsers(usersData ?? []);
      setDepartments(deptsData ?? []);
    } catch {
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Filtered list
  const filtered = (users ?? []).filter((u) => {
    const deptName = getDeptName(u.departmentId).toLowerCase();
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      deptName.includes(search.toLowerCase());
    const matchRole = filterRole === "all" || u.globalRole === filterRole;
    // isActive (boolean) compared to filterStatus string
    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && u.isActive === true) ||
      (filterStatus === "inactive" && u.isActive === false);
    return matchSearch && matchRole && matchStatus;
  });

  // ── Add
  async function handleAdd(form) {
    try {
      setSaving(true);
      const newUser = await createUser(form);
      setUsers((prev) => [...(prev ?? []), newUser]);
      setModal(null);
    } catch {
      setError("Failed to add user. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ── Edit
  async function handleEdit(form) {
    try {
      setSaving(true);
      const updated = await updateUser(modal.user._id, form);
      setUsers((prev) =>
        (prev ?? []).map((u) => (u._id === modal.user._id ? updated : u)),
      );
      setModal(null);
    } catch {
      setError("Failed to update user. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ── Delete
  async function handleDelete() {
    try {
      setSaving(true);
      await deleteUser(modal.user._id);
      setUsers((prev) => (prev ?? []).filter((u) => u._id !== modal.user._id));
      setModal(null);
    } catch {
      setError("Failed to delete user. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ── Loading state
  if (loading) return <UsersSkeleton />;

  return (
    <div className="space-y-6">
      {/* ── Header */}
      <div className="flex flex-wrap items-center justify-between gap-y-3">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-foreground-muted mb-1">
            Admin / User Management
          </p>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Users <span className="text-primary"></span>
          </h1>
        </div>
        <button
          onClick={() => setModal({ type: "add" })}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary text-[11px] tracking-[0.15em] uppercase font-bold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add User
        </button>
      </div>

      {/* ── Error Banner */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 border border-[#ff4747]/30 bg-[#ff4747]/10">
          <AlertCircle className="w-4 h-4 text-[#ff4747] shrink-0" />
          <p className="text-[11px] text-[#ff4747] tracking-wide flex-1">
            {error}
          </p>
          <button
            onClick={() => setError(null)}
            className="text-[#ff4747] hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-50">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, department..."
            className="w-full bg-surface-low border border-outline pl-9 pr-4 py-2.5 text-[12px] text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="relative">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="appearance-none bg-surface-low border border-outline px-4 py-2.5 pr-8 text-[11px] tracking-[0.12em] uppercase text-foreground-muted focus:outline-none focus:border-primary transition-colors cursor-pointer"
          >
            <option value="all">All Roles</option>
            {GLOBAL_ROLES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground-muted pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none bg-surface-low border border-outline px-4 py-2.5 pr-8 text-[11px] tracking-[0.12em] uppercase text-foreground-muted focus:outline-none focus:border-primary transition-colors cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground-muted pointer-events-none" />
        </div>

        <span className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted ml-auto">
          {filtered.length} of {(users ?? []).length} users
        </span>
      </div>

      {/* ── Mobile Cards */}
      <div className="md:hidden space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 border border-outline bg-surface-low">
            <Users className="w-8 h-8 text-foreground" />
            <p className="text-[11px] tracking-[0.15em] uppercase text-foreground-muted">
              No users found
            </p>
          </div>
        ) : (
          filtered.map((u) => {
            const badge = roleBadge(u.globalRole);
            return (
              <div
                key={u._id}
                className="border border-outline bg-surface-low p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-surface-container border border-outline flex items-center justify-center text-[13px] font-bold text-primary shrink-0">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-foreground truncate">
                        {u.name}
                      </p>
                      <p className="text-[11px] text-foreground-muted truncate">
                        {u.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setModal({ type: "edit", user: u })}
                      className="p-1.5 text-foreground-muted dark:hover:text-foreground hover:text-primary hover:bg-surface-container transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setModal({ type: "delete", user: u })}
                      className="p-1.5 text-foreground-muted hover:text-[#ff4747] transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-outline">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 text-[10px] tracking-widest uppercase font-bold border ${badge.cls}`}
                  >
                    {badge.label}
                  </span>
                  <span className="text-[11px] text-foreground-muted">
                    {getDeptName(u.departmentId)}
                  </span>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${u.isActive ? "bg-primary" : "bg-surface-highest"}`}
                    />
                    <span
                      className={`text-[11px] tracking-widest uppercase font-bold ${u.isActive ? "text-primary" : "text-foreground-muted"}`}
                    >
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <div className="border border-outline bg-surface-low overflow-hidden min-w-175">
          <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_80px] gap-4 px-6 py-3 border-b border-outline bg-surface-container">
            {["Name", "Email", "Role", "Department", "Status", ""].map((h) => (
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
              <Users className="w-8 h-8 text-foreground" />
              <p className="text-[11px] tracking-[0.15em] uppercase text-foreground-muted">
                No users found
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#161616]">
              {filtered.map((u) => {
                const badge = roleBadge(u.globalRole);
                return (
                  <div
                    key={u._id}
                    className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_80px] gap-4 px-6 py-3.5 items-center hover:bg-surface-container transition-colors group"
                  >
                    {/* name */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 bg-surface-container border border-outline flex items-center justify-center text-[11px] font-bold text-primary shrink-0">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[12px] font-bold text-foreground tracking-wide truncate flex-1 min-w-0">
                        {u.name}
                      </span>
                    </div>

                    {/* email */}
                    <span className="text-[12px] text-foreground-muted tracking-wide truncate min-w-0">
                      {u.email}
                    </span>

                    {/* globalRole */}
                    <span
                      className={`inline-flex items-center px-2 py-0.5 text-[10px] tracking-widest uppercase font-bold border w-fit ${badge.cls}`}
                    >
                      {badge.label}
                    </span>

                    {/* departmentId → resolved to departmentName */}
                    <span className="text-[12px] text-foreground-muted min-w-0 truncate">
                      {getDeptName(u.departmentId)}
                    </span>

                    {/* isActive (boolean) */}
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${u.isActive ? "bg-primary" : "bg-surface-highest"}`}
                      />
                      <span
                        className={`text-[11px] tracking-widest uppercase font-bold ${u.isActive ? "text-primary" : "text-foreground-muted"}`}
                      >
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setModal({ type: "edit", user: u })}
                        className="p-1.5 text-foreground-muted dark:hover:text-foreground hover:text-primary hover:bg-surface-container transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setModal({ type: "delete", user: u })}
                        className="p-1.5 text-foreground-muted hover:text-[#ff4747] hover:bg-red-500/5 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Modals */}
      {modal?.type === "add" && (
        <UserModal
          mode="add"
          departments={departments}
          saving={saving}
          onClose={() => setModal(null)}
          onSave={handleAdd}
        />
      )}
      {modal?.type === "edit" && (
        <UserModal
          mode="edit"
          initial={modal.user}
          departments={departments}
          saving={saving}
          onClose={() => setModal(null)}
          onSave={handleEdit}
        />
      )}
      {modal?.type === "delete" && (
        <DeleteModal
          user={modal.user}
          saving={saving}
          onClose={() => setModal(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
