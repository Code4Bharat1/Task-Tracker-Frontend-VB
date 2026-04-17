"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth/context";
import api, { getTokenPayload } from "@/lib/api";
import {
  Shield, Check, Loader2, AlertCircle, Save, X,
  Users, FolderKanban, ClipboardList, BookCheck,
  Bug, FileText, BookOpen, Trophy, Activity,
} from "lucide-react";

// ─── Permission matrix definition ────────────────────────────
const RESOURCES = [
  {
    key: "users",
    label: "User Management",
    icon: Users,
    description: "Create, view, edit and delete user accounts",
    actions: ["create", "read", "update", "delete"],
  },
  {
    key: "projects",
    label: "Projects",
    icon: FolderKanban,
    description: "Manage projects and SRS documents",
    actions: ["create", "read", "update", "delete"],
  },
  {
    key: "tasks",
    label: "Tasks",
    icon: ClipboardList,
    description: "Assign, view, edit and delete tasks",
    actions: ["create", "read", "update", "delete"],
  },
  {
    key: "dailyLogs",
    label: "Daily Logs",
    icon: BookCheck,
    description: "Submit and manage daily work logs",
    actions: ["create", "read", "update", "delete"],
  },
  {
    key: "bugs",
    label: "Bug Reports",
    icon: Bug,
    description: "Report and manage bugs/issues",
    actions: ["create", "read", "update", "delete"],
  },
  {
    key: "reports",
    label: "Reports",
    icon: FileText,
    description: "Create and view activity reports",
    actions: ["create", "read", "update", "delete"],
  },
  {
    key: "ktDocuments",
    label: "KT Documents",
    icon: BookOpen,
    description: "Knowledge transfer document management",
    actions: ["create", "read", "update", "delete"],
  },
  {
    key: "leaderboard",
    label: "Leaderboard",
    icon: Trophy,
    description: "View scoring and leaderboard",
    actions: ["read"],
  },
  {
    key: "activityLogs",
    label: "Activity Logs",
    icon: Activity,
    description: "View system activity and audit logs",
    actions: ["read"],
  },
];

const ROLES = [
  {
    key: "department_head",
    label: "Department Head",
    color: "text-[#47c8ff]",
    bg: "bg-[#47c8ff]/10",
    border: "border-[#47c8ff]/30",
    description: "Manages a department, its Employee and projects",
    defaults: {
      users:        { create: true,  read: true,  update: true,  delete: false },
      projects:     { create: true,  read: true,  update: true,  delete: true  },
      tasks:        { create: true,  read: true,  update: true,  delete: true  },
      dailyLogs:    { create: true,  read: true,  update: true,  delete: true  },
      bugs:         { create: true,  read: true,  update: true,  delete: true  },
      reports:      { create: true,  read: true,  update: true,  delete: true  },
      ktDocuments:  { create: true,  read: true,  update: true,  delete: true  },
      leaderboard:  { create: false, read: true,  update: false, delete: false },
      activityLogs: { create: false, read: true,  update: false, delete: false },
    },
  },
  {
    key: "lead",
    label: "Lead",
    color: "text-[#c847ff]",
    bg: "bg-[#c847ff]/10",
    border: "border-[#c847ff]/30",
    description: "Project lead — assigns tasks, manages team Employee",
    defaults: {
      users:        { create: false, read: true,  update: false, delete: false },
      projects:     { create: true,  read: true,  update: true,  delete: false },
      tasks:        { create: true,  read: true,  update: true,  delete: true  },
      dailyLogs:    { create: true,  read: true,  update: true,  delete: false },
      bugs:         { create: true,  read: true,  update: true,  delete: true  },
      reports:      { create: true,  read: true,  update: true,  delete: false },
      ktDocuments:  { create: false, read: true,  update: false, delete: false },
      leaderboard:  { create: false, read: true,  update: false, delete: false },
      activityLogs: { create: false, read: false, update: false, delete: false },
    },
  },
  {
    key: "employee",
    label: "Employee",
    color: "text-[#e8a847]",
    bg: "bg-[#e8a847]/10",
    border: "border-[#e8a847]/30",
    description: "Contributor/Reviewer — works on assigned tasks",
    defaults: {
      users:        { create: false, read: true,  update: false, delete: false },
      projects:     { create: false, read: true,  update: false, delete: false },
      tasks:        { create: false, read: true,  update: true,  delete: false },
      dailyLogs:    { create: true,  read: true,  update: true,  delete: false },
      bugs:         { create: true,  read: true,  update: true,  delete: false },
      reports:      { create: true,  read: true,  update: false, delete: false },
      ktDocuments:  { create: false, read: true,  update: false, delete: false },
      leaderboard:  { create: false, read: true,  update: false, delete: false },
      activityLogs: { create: false, read: false, update: false, delete: false },
    },
  },
];

const ACTION_LABELS = {
  create: "Create",
  read:   "View",
  update: "Edit",
  delete: "Delete",
};

const ACTION_COLORS = {
  create: "text-[#47ff8a]",
  read:   "text-[#47c8ff]",
  update: "text-[#e8a847]",
  delete: "text-[#ff4747]",
};

// Build default permissions from ROLES
function buildDefaults() {
  const out = {};
  for (const role of ROLES) {
    out[role.key] = role.defaults;
  }
  return out;
}

function mergeWithDefaults(saved) {
  const defaults = buildDefaults();
  const result = {};
  for (const role of ROLES) {
    result[role.key] = {};
    for (const res of RESOURCES) {
      result[role.key][res.key] = {
        ...defaults[role.key][res.key],
        ...(saved?.[role.key]?.[res.key] ?? {}),
      };
    }
  }
  return result;
}

// ─── Toggle component ─────────────────────────────────────────
function PermToggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex items-center w-10 h-5 rounded-full border transition-colors shrink-0 ${
        checked
          ? "bg-primary border-primary"
          : "bg-surface-container border-outline"
      } ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`absolute top-[3px] w-3.5 h-3.5 rounded-full transition-transform duration-200 ${
          checked
            ? "translate-x-[22px] bg-white"
            : "translate-x-[3px] bg-foreground-muted"
        }`}
      />
    </button>
  );
}

export default function PermissionsPage() {
  const { user } = useAuth();
  const [perms, setPerms] = useState(mergeWithDefaults({}));
  const [activeRole, setActiveRole] = useState(ROLES[0].key);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const companyId = user?.companyId ?? getTokenPayload()?.companyId ?? null;

  const loadPerms = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/companies/permissions/roles");
      setPerms(mergeWithDefaults(data.rolePermissions));
    } catch {
      // fallback to defaults silently
      setPerms(mergeWithDefaults({}));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPerms(); }, [loadPerms]);

  function toggle(roleKey, resourceKey, action) {
    setPerms((prev) => ({
      ...prev,
      [roleKey]: {
        ...prev[roleKey],
        [resourceKey]: {
          ...prev[roleKey][resourceKey],
          [action]: !prev[roleKey][resourceKey][action],
        },
      },
    }));
  }

  function toggleAll(roleKey, resourceKey) {
    const res = RESOURCES.find((r) => r.key === resourceKey);
    const current = perms[roleKey][resourceKey];
    const allOn = res.actions.every((a) => current[a]);
    const updated = {};
    res.actions.forEach((a) => { updated[a] = !allOn; });
    setPerms((prev) => ({
      ...prev,
      [roleKey]: { ...prev[roleKey], [resourceKey]: { ...current, ...updated } },
    }));
  }

  function resetRole(roleKey) {
    const role = ROLES.find((r) => r.key === roleKey);
    setPerms((prev) => ({ ...prev, [roleKey]: { ...role.defaults } }));
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);
      await api.patch("/companies/permissions/roles", { rolePermissions: perms });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Failed to save permissions.");
    } finally {
      setSaving(false);
    }
  }

  const activeRoleMeta = ROLES.find((r) => r.key === activeRole);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-y-3">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-foreground-muted mb-1">
            Administration
          </p>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Role Permissions
          </h1>
          <p className="text-[12px] text-foreground-muted mt-1">
            Control what each role can do across the platform
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-2 px-5 py-2.5 text-[11px] tracking-[0.15em] uppercase font-bold bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : saved ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          {saved ? "Saved!" : "Save Permissions"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 px-4 py-3 border border-[#ff4747]/30 bg-[#ff4747]/5 text-[#ff4747]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-[12px]">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-3 px-4 py-3 border border-[#47ff8a]/30 bg-[#47ff8a]/5 text-[#47ff8a]">
          <Check className="w-4 h-4 shrink-0" />
          <span className="text-[12px]">Permissions saved successfully.</span>
        </div>
      )}

      {/* Admin notice */}
      <div className="flex items-start gap-3 px-4 py-3 border border-primary/20 bg-primary/5">
        <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-[12px] text-foreground-muted">
          <span className="text-primary font-bold">Admin</span> always has full access to all features and cannot be restricted.
        </p>
      </div>

      {/* Role tabs */}
      <div className="flex gap-3 flex-wrap">
        {ROLES.map((role) => (
          <button
            key={role.key}
            onClick={() => setActiveRole(role.key)}
            className={`flex items-center gap-3 px-5 py-3 border transition-all ${
              activeRole === role.key
                ? `${role.bg} ${role.border} ${role.color}`
                : "border-outline text-foreground-muted hover:border-foreground-muted"
            }`}
          >
            <div className="text-left">
              <p className={`text-[11px] tracking-[0.15em] uppercase font-bold ${activeRole === role.key ? role.color : ""}`}>
                {role.label}
              </p>
              <p className="text-[10px] text-foreground-muted mt-0.5">{role.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Permission matrix */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-foreground-muted">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-[12px] tracking-[0.1em] uppercase">Loading…</span>
        </div>
      ) : (
        <div className="border border-outline bg-surface-low">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_repeat(4,80px)] gap-0 border-b border-outline bg-surface-container px-6 py-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted font-bold">
                Resource
              </span>
              <button
                onClick={() => resetRole(activeRole)}
                className="text-[10px] text-foreground-muted hover:text-foreground transition-colors tracking-[0.1em] uppercase"
              >
                Reset defaults
              </button>
            </div>
            {["create", "read", "update", "delete"].map((a) => (
              <div key={a} className={`text-center text-[10px] tracking-[0.12em] uppercase font-bold ${ACTION_COLORS[a]}`}>
                {ACTION_LABELS[a]}
              </div>
            ))}
          </div>

          <div className="divide-y divide-outline">
            {RESOURCES.map((res) => {
              const Icon = res.icon;
              const current = perms[activeRole]?.[res.key] ?? {};
              const allOn = res.actions.every((a) => current[a]);

              return (
                <div
                  key={res.key}
                  className="grid grid-cols-[1fr_repeat(4,80px)] gap-0 px-6 py-4 items-center hover:bg-surface-container transition-colors"
                >
                  {/* Resource info */}
                  <div className="flex items-center gap-3 min-w-0 pr-4">
                    <button
                      onClick={() => toggleAll(activeRole, res.key)}
                      className={`w-8 h-8 border flex items-center justify-center shrink-0 transition-colors ${
                        allOn
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "border-outline text-foreground-muted hover:border-foreground-muted"
                      }`}
                      title={allOn ? "Disable all" : "Enable all"}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </button>
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-foreground">{res.label}</p>
                      <p className="text-[10px] text-foreground-muted truncate">{res.description}</p>
                    </div>
                  </div>

                  {/* Action toggles */}
                  {["create", "read", "update", "delete"].map((action) => {
                    const supported = res.actions.includes(action);
                    return (
                      <div key={action} className="flex items-center justify-center">
                        {supported ? (
                          <PermToggle
                            checked={!!current[action]}
                            onChange={() => toggle(activeRole, res.key, action)}
                          />
                        ) : (
                          <span className="text-foreground-muted/30 text-[10px]">—</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary */}
      {!loading && (
        <div className="border border-outline bg-surface-low p-5">
          <p className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted font-bold mb-3">
            {activeRoleMeta?.label} — Permission Summary
          </p>
          <div className="flex flex-wrap gap-2">
            {RESOURCES.map((res) => {
              const current = perms[activeRole]?.[res.key] ?? {};
              const granted = res.actions.filter((a) => current[a]);
              if (granted.length === 0) return null;
              return (
                <div key={res.key} className="flex items-center gap-1.5 px-3 py-1.5 border border-outline bg-surface-container">
                  <res.icon className="w-3 h-3 text-foreground-muted" />
                  <span className="text-[11px] text-foreground">{res.label}:</span>
                  <span className="text-[11px] text-primary font-bold">
                    {granted.map((a) => ACTION_LABELS[a]).join(", ")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
