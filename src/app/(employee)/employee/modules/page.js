"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Layers,
  Search,
  Circle,
  Users,
  Calendar,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import AuthLoader from "@/components/AuthLoader";
import { getMyProjects } from "@/services/projectService";
import {
  getModules,
  getMyModules,
  advanceModuleStatus,
  MODULE_STATUS_META,
  MODULE_STATUSES,
} from "@/services/moduleService";
import { ProjectsSkeleton } from "@/components/skeletons";

function StatusBadge({ status }) {
  const m = MODULE_STATUS_META[status];
  if (!m) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] tracking-[0.1em] uppercase font-bold border ${m.bg} ${m.border} ${m.color}`}
    >
      <Circle className="w-1.5 h-1.5 fill-current" /> {m.label}
    </span>
  );
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function ModulesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [modules, setModules] = useState([]);
  const [projectMap, setProjectMap] = useState({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [advancing, setAdvancing] = useState(null);

  const isPM = user?.role === "project_manager";
  const isDeveloper = user?.role === "developer";

  useEffect(() => {
    if (
      !loading &&
      (!user ||
        !["employee", "project_manager", "developer"].includes(user?.role))
    ) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setDataLoading(true);
      if (isPM) {
        const projs = await getMyProjects();
        const managed = projs.filter((p) => p.managerIds?.includes(user._id));
        const pMap = {};
        managed.forEach((p) => {
          pMap[p._id] = p.name;
        });
        setProjectMap(pMap);
        const modsResults = await Promise.allSettled(
          managed.map((p) => getModules(p._id)),
        );
        setModules(
          modsResults
            .filter((r) => r.status === "fulfilled")
            .flatMap((r) => r.value),
        );
      } else {
        const mods = await getMyModules(user?._id).catch(() => []);
        setModules(mods);
      }
    } catch {
      setError("Failed to load modules.");
    } finally {
      setDataLoading(false);
    }
  }, [user, isPM]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleAdvance(mod) {
    const pmAllowed = ["DEV_COMPLETE", "CODE_REVIEW"];
    const devAllowed = ["TODO", "IN_PROGRESS"];
    const canAdvance = isPM
      ? pmAllowed.includes(mod.status)
      : devAllowed.includes(mod.status);
    if (!canAdvance) return;
    try {
      setAdvancing(mod._id);
      const updated = await advanceModuleStatus(mod._id);
      setModules((prev) => prev.map((m) => (m._id === mod._id ? updated : m)));
    } catch {
      setError("Failed to advance module.");
    } finally {
      setAdvancing(null);
    }
  }

  if (loading || !user) return <AuthLoader />;

  const pmAllowed = ["DEV_COMPLETE", "CODE_REVIEW"];
  const devAllowed = ["TODO", "IN_PROGRESS"];

  const filtered = modules
    .filter((m) => statusFilter === "ALL" || m.status === statusFilter)
    .filter((m) => {
      const q = search.toLowerCase();
      return (
        m.title.toLowerCase().includes(q) ||
        (isPM && (m.assignedName || "").toLowerCase().includes(q))
      );
    });

  const byStatus = {};
  MODULE_STATUSES.forEach((s) => {
    byStatus[s] = modules.filter((m) => m.status === s).length;
  });

  const roleLabel = isPM ? "Project Manager" : "Developer";
  const pageTitle = isPM ? "All Modules" : "My Modules";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] tracking-[0.2em] uppercase text-foreground-muted mb-1">
          {roleLabel}
        </p>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {pageTitle}
        </h1>
      </div>

      {error && (
        <div className="flex items-center gap-3 px-4 py-3 border border-[#ff4747]/30 bg-[#ff4747]/5 text-[#ff4747]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-[12px]">{error}</span>
        </div>
      )}

      {/* Status Summary */}
      {!dataLoading && (
        <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
          {MODULE_STATUSES.map((s) => {
            const meta = MODULE_STATUS_META[s];
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? "ALL" : s)}
                className={`px-3 py-2.5 border text-center transition-colors ${
                  statusFilter === s
                    ? `${meta.border} ${meta.bg} ${meta.color}`
                    : "border-outline text-foreground-muted hover:border-foreground-muted"
                }`}
              >
                <p
                  className={`text-lg font-bold ${statusFilter === s ? meta.color : "text-foreground"}`}
                >
                  {byStatus[s]}
                </p>
                <p className="text-[8px] tracking-[0.1em] uppercase mt-0.5">
                  {meta.label}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={
            isPM ? "Search modules or developers..." : "Search modules..."
          }
          className="w-full bg-surface-low border border-outline pl-9 pr-3 py-2.5 text-[12px] text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {dataLoading ? (
        <ProjectsSkeleton />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-foreground-muted">
          <Layers className="w-8 h-8 mb-3 opacity-40" />
          <p className="text-[11px] tracking-[0.1em] uppercase">
            No modules found
          </p>
        </div>
      ) : (
        <div className="border border-outline bg-surface-low divide-y divide-outline">
          {filtered.map((mod) => {
            const meta = MODULE_STATUS_META[mod.status];
            const nextStatus = meta?.next;
            const canAdvance = isPM
              ? pmAllowed.includes(mod.status)
              : devAllowed.includes(mod.status);
            return (
              <div
                key={mod._id}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-container transition-colors group"
              >
                <div className="flex-1 min-w-0 mr-4">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[12px] text-foreground font-medium truncate">
                      {mod.title}
                    </p>
                    <StatusBadge status={mod.status} />
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-foreground-muted">
                    {isPM && (
                      <span className="text-primary">
                        {projectMap[mod.projectId] || "Unknown"}
                      </span>
                    )}
                    {isPM && mod.assignedName && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {mod.assignedName}
                      </span>
                    )}
                    {isDeveloper && mod.description && (
                      <span className="truncate max-w-[200px]">
                        {mod.description}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />{" "}
                      {formatDate(mod.deadline)}
                    </span>
                  </div>
                </div>
                {canAdvance && nextStatus && (
                  <button
                    onClick={() => handleAdvance(mod)}
                    disabled={advancing === mod._id}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-[9px] tracking-[0.1em] uppercase font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                  >
                    {advancing === mod._id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                    {MODULE_STATUS_META[nextStatus]?.label}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
