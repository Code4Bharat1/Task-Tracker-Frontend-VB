"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import {
  Users,
  Search,
  AlertCircle,
  UserCog,
  Building2,
  UserPlus,
  ChevronDown,
} from "lucide-react";
import { createUser, getUsers } from "@/services/userService";
import {
  TableSkeleton,
  FilterSkeleton,
  HeaderSkeleton,
} from "@/components/skeletons";
import { getDepartments } from "@/services/departmentService";

// ─── Role Badge ───────────────────────────────────────────────
function RoleBadge({ role }) {
  const map = {
    admin: {
      cls: "bg-primary/10 text-primary border-primary/20",
      label: "Admin",
    },
    department_head: {
      cls: "bg-[#47c8ff]/10 text-[#47c8ff] border-[#47c8ff]/20",
      label: "Dept Head",
    },
    employee: {
      cls: "bg-surface-high/50 text-foreground-muted border-outline",
      label: "Employee",
    },
  };
  const m = map[role] || map.employee;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[10px] tracking-[0.08em] uppercase font-bold border ${m.cls}`}
    >
      {m.label}
    </span>
  );
}

function MembersSkeleton() {
  return (
    <div className="space-y-6">
      <HeaderSkeleton hasButton={false} />
      <FilterSkeleton filters={1} />
      <TableSkeleton rows={8} cols={5} />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function DeptHeadMembers() {
  const router = useRouter();
  const { user } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch users and departments in parallel
      const [usersData, depts] = await Promise.all([
        getUsers(),
        getDepartments(),
      ]);
      // Build departmentId → departmentName lookup
      const deptNameMap = Object.fromEntries(
        (depts || []).map((d) => [String(d._id), d.departmentName]),
      );
      const allMembers = (usersData || []).map((u) => {
        const deptKey =
          typeof u.departmentId === "object"
            ? String(u.departmentId._id ?? u.departmentId)
            : String(u.departmentId ?? "");
        return {
          ...u,
          departmentName: deptNameMap[deptKey] || null,
        };
      });
      setDepartments(depts || []);
      setMembers(allMembers);
    } catch (err) {
      console.error("Failed to load members:", err);
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to load members. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = members.filter((m) => {
    return (
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.departmentName || "").toLowerCase().includes(search.toLowerCase())
    );
  });

  const deptHeads = filtered.filter(
    (m) => m.globalRole === "department_head",
  ).length;
  const employees = filtered.filter((m) => m.globalRole === "employee").length;

  if (loading) return <MembersSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-y-3">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-foreground-muted mb-1">
            Department
          </p>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Employees
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="border border-outline bg-surface-low px-4 py-2 text-center">
            <p className="text-[10px] tracking-[0.12em] uppercase text-foreground-muted">
              Total
            </p>
            <p className="text-lg font-bold text-foreground">
              {filtered.length}
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary text-[11px] tracking-[0.15em] uppercase font-bold hover:bg-primary/90 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add Employee
          </button>
        </div>
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
            placeholder="Search by name or department…"
            className="w-full bg-surface-container border border-outline pl-9 pr-3 py-2.5 text-[12px] text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border border-outline bg-surface-low text-foreground-muted">
            <Users className="w-8 h-8 mb-3 opacity-40" />
            <p className="text-[12px] tracking-[0.1em] uppercase">
              No employees found
            </p>
          </div>
        ) : (
          filtered.map((m) => (
            <div
              key={m._id}
              className="border border-outline bg-surface-low p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    {m.globalRole === "department_head" ? (
                      <UserCog className="w-4 h-4 text-[#47c8ff]" />
                    ) : (
                      <Users className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-foreground truncate">
                      {m.name}
                    </p>
                    <p className="text-[11px] text-foreground-muted truncate">
                      {m.departmentName ? m.departmentName.toUpperCase() : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <RoleBadge role={m.globalRole} />
                  <span
                    className={`text-[10px] tracking-[0.08em] uppercase font-bold ${m.isActive !== false ? "text-[#47ff8a]" : "text-foreground-muted"}`}
                  >
                    {m.isActive !== false ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <div className="border border-outline bg-surface-low overflow-hidden min-w-135">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-6 py-3 border-b border-outline bg-surface-container">
            {["Member", "Department", "Role", "Status"].map((h) => (
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
              <Users className="w-8 h-8 mb-3 opacity-40" />
              <p className="text-[12px] tracking-[0.1em] uppercase">
                No employees found
              </p>
            </div>
          ) : (
            <div className="divide-y divide-outline">
              {filtered.map((m) => (
                <div
                  key={m._id}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-6 py-4 items-center hover:bg-surface-container transition-colors"
                >
                  {/* Name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      {m.globalRole === "department_head" ? (
                        <UserCog className="w-3.5 h-3.5 text-[#47c8ff]" />
                      ) : (
                        <Users className="w-3.5 h-3.5 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-foreground truncate">
                        {m.name}
                      </p>
                    </div>
                  </div>
                  {/* Department */}
                  <div className="flex items-center gap-1.5 text-foreground-muted min-w-0 overflow-hidden">
                    <Building2 className="w-3 h-3 shrink-0" />
                    <span className="text-[12px] truncate">
                      {m.departmentName ? m.departmentName.toUpperCase() : "—"}
                    </span>
                  </div>
                  {/* Role */}
                  <RoleBadge role={m.globalRole} />
                  {/* Status */}
                  <span
                    className={`text-[11px] tracking-[0.08em] uppercase font-bold ${m.isActive !== false ? "text-[#47ff8a]" : "text-foreground-muted"}`}
                  >
                    {m.isActive !== false ? "Active" : "Inactive"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {filtered.length > 0 && (
        <p className="text-[10px] tracking-[0.1em] uppercase text-foreground-muted">
          Showing {filtered.length} of {members.length} employee
          {members.length !== 1 ? "s" : ""}
        </p>
      )}
      {showAdd && (
        <AddEmployeeModal
          departments={departments}
          onClose={() => setShowAdd(false)}
          onSaved={(created) => {
            if (created && created._id) {
              const createdDeptKey =
                typeof created.departmentId === "object"
                  ? String(created.departmentId._id ?? created.departmentId)
                  : String(created.departmentId ?? "");
              const deptName =
                departments.find((d) => String(d._id) === createdDeptKey)
                  ?.departmentName || null;
              const enriched = { ...created, departmentName: deptName };
              setMembers((prev) => [enriched, ...prev]);
            } else {
              loadData();
            }
          }}
          defaultDepartmentId={user?.departmentId}
        />
      )}
    </div>
  );
}

function AddEmployeeModal({
  departments,
  onClose,
  onSaved,
  defaultDepartmentId,
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    globalRole: "employee",
    departmentId: defaultDepartmentId ?? "",
  });
  useEffect(() => {
    if (defaultDepartmentId)
      setForm((f) => ({ ...f, departmentId: defaultDepartmentId }));
  }, [defaultDepartmentId]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "");
  }, []);

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Invalid email";
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) return setErrors(e);
    try {
      setSaving(true);
      const payload = {
        ...form,
        departmentId: form.departmentId || defaultDepartmentId,
      };
      const created = await createUser(payload);
      onSaved && onSaved(created);
      onClose();
    } catch {
      setErrors({ submit: "Failed to add employee" });
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
      <div className="relative w-full max-w-md bg-surface-low border border-outline shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline">
          <span className="text-[11px] tracking-[0.2em] uppercase font-bold text-foreground">
            Add Employee
          </span>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-foreground-muted hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
              Full Name
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-surface-container border border-outline px-3 py-2.5 text-[12px]"
            />
            {errors.name && (
              <p className="text-[11px] text-[#ff4747]">{errors.name}</p>
            )}
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
              Email
            </label>
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-surface-container border border-outline px-3 py-2.5 text-[12px]"
            />
            {errors.email && (
              <p className="text-[11px] text-[#ff4747]">{errors.email}</p>
            )}
          </div>

          {/* Dept-head creates employees for their department; no project role here */}
        </div>

        <div className="flex gap-2 px-6 pb-5">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 text-[11px] uppercase font-bold border border-outline text-foreground-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2.5 text-[11px] uppercase font-bold bg-primary text-on-primary"
          >
            {saving ? "Adding…" : "Add Employee"}
          </button>
        </div>
      </div>
    </div>
  );
}
