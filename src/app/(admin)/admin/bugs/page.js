"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bug,
  Search,
  X,
  AlertCircle,
  ChevronDown,
  Trash2,
  Loader2,
  Circle,
} from "lucide-react";
import AuthLoader from "@/components/AuthLoader";
import { TableSkeleton } from "@/components/skeletons";
import { useAuth } from "@/lib/auth/context";
import {
  getAllBugs,
  updateBug,
  deleteBug,
  BUG_SEVERITY_META,
  BUG_STATUS_META,
} from "@/services/bugService";
import { getProjects } from "@/services/projectService";
import { getUsers } from "@/services/userService";

function SeverityBadge({ severity }) {
  const m = BUG_SEVERITY_META[severity] || { label: severity, color: "text-foreground-muted", bg: "bg-foreground/5", border: "border-outline" };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] tracking-[0.1em] uppercase font-bold border ${m.bg} ${m.border} ${m.color}`}>
      {m.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const m = BUG_STATUS_META[status] || { label: status, color: "text-foreground-muted", bg: "bg-foreground/5", border: "border-outline" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] tracking-[0.1em] uppercase font-bold border ${m.bg} ${m.border} ${m.color}`}>
      <Circle className="w-1.5 h-1.5 fill-current" />
      {m.label}
    </span>
  );
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminBugsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [bugs, setBugs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  const loadData = useCallback(async () => {
    try {
      setDataLoading(true);
      const [bugsR, projsR, usrsR] = await Promise.allSettled([
        getAllBugs(),
        getProjects(),
        getUsers(),
      ]);
      setBugs(bugsR.status === "fulfilled" ? bugsR.value : []);
      setProjects(projsR.status === "fulfilled" ? projsR.value : []);
      setUsers(usrsR.status === "fulfilled" ? usrsR.value : []);
    } catch {
      setError("Failed to load issues.");
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading || !user) return <AuthLoader />;

  const filtered = bugs.filter((b) => {
    const proj = projects.find((p) => p._id === (b.projectId?._id || b.projectId));
    const matchSearch = !search ||
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      proj?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || b.status === filterStatus;
    const matchSeverity = filterSeverity === "all" || b.severity === filterSeverity;
    return matchSearch && matchStatus && matchSeverity;
  });

  const stats = {
    total: bugs.length,
    open: bugs.filter((b) => b.status === "OPEN").length,
    inProgress: bugs.filter((b) => b.status === "IN_PROGRESS").length,
    resolved: bugs.filter((b) => ["RESOLVED", "CLOSED"].includes(b.status)).length,
  };

  async function handleStatusChange(id, status) {
    try {
      const updated = await updateBug(id, { status });
      setBugs((prev) => prev.map((b) => (b._id === id ? { ...b, status: updated.status ?? status } : b)));
    } catch {
      setError("Failed to update status.");
    }
  }

  async function handleDelete(id) {
    try {
      setDeletingId(id);
      await deleteBug(id);
      setBugs((prev) => prev.filter((b) => b._id !== id));
    } catch {
      setError("Failed to delete issue.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] tracking-[0.2em] uppercase text-foreground-muted mb-1">Admin / Issues</p>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Issues</h1>
      </div>

      {/* Stats */}
      {!dataLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total", value: stats.total, accent: "text-foreground" },
            { label: "Open", value: stats.open, accent: "text-[#ff4747]" },
            { label: "In Progress", value: stats.inProgress, accent: "text-[#47c8ff]" },
            { label: "Resolved", value: stats.resolved, accent: "text-[#47ff8a]" },
          ].map(({ label, value, accent }) => (
            <div key={label} className="border border-outline bg-surface-low p-4">
              <p className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted mb-2">{label}</p>
              <p className={`text-2xl font-bold ${accent}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 px-4 py-3 border border-[#ff4747]/30 bg-[#ff4747]/5 text-[#ff4747]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-[12px]">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search issues..."
            className="w-full bg-surface-container border border-outline pl-9 pr-3 py-2.5 text-[12px] text-foreground focus:outline-none focus:border-primary"
          />
        </div>
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none bg-surface-container border border-outline px-3 py-2.5 pr-8 text-[12px] text-foreground focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="all">All Statuses</option>
            {Object.entries(BUG_STATUS_META).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground-muted pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="appearance-none bg-surface-container border border-outline px-3 py-2.5 pr-8 text-[12px] text-foreground focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="all">All Severities</option>
            {Object.entries(BUG_SEVERITY_META).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground-muted pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      {dataLoading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : (
        <div className="overflow-x-auto">
          <div className="border border-outline bg-surface-low min-w-[700px]">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_48px] gap-4 px-6 py-3 border-b border-outline bg-surface-container">
              {["Issue / Project", "Severity", "Status", "Reported By", "Date", ""].map((h) => (
                <span key={h} className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted font-bold">{h}</span>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-foreground-muted">
                <Bug className="w-8 h-8 opacity-40" />
                <p className="text-[12px] tracking-[0.1em] uppercase">No issues found</p>
              </div>
            ) : (
              <div className="divide-y divide-outline">
                {filtered.map((b) => {
                  const proj = projects.find((p) => p._id === (b.projectId?._id || b.projectId));
                  const reporter = users.find((u) => u._id === (b.reportedBy?._id || b.reportedBy));
                  const nextStatus = b.status === "OPEN" ? "IN_PROGRESS"
                    : b.status === "IN_PROGRESS" ? "RESOLVED"
                    : b.status === "RESOLVED" ? "CLOSED"
                    : null;

                  return (
                    <div key={b._id} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_48px] gap-4 px-6 py-4 items-center hover:bg-surface-container transition-colors group">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-foreground truncate">{b.title}</p>
                        <p className="text-[11px] text-foreground-muted mt-0.5 truncate">
                          {proj?.name || "—"}
                        </p>
                      </div>
                      <SeverityBadge severity={b.severity} />
                      <div>
                        {nextStatus ? (
                          <button
                            onClick={() => handleStatusChange(b._id, nextStatus)}
                            className="group/btn"
                            title={`Move to ${BUG_STATUS_META[nextStatus]?.label}`}
                          >
                            <StatusBadge status={b.status} />
                          </button>
                        ) : (
                          <StatusBadge status={b.status} />
                        )}
                      </div>
                      <p className="text-[12px] text-foreground-muted truncate">
                        {reporter?.name || b.reportedByName || "—"}
                      </p>
                      <p className="text-[12px] text-foreground-muted">{formatDate(b.created_at)}</p>
                      <button
                        onClick={() => handleDelete(b._id)}
                        disabled={deletingId === b._id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-foreground-muted hover:text-[#ff4747] disabled:opacity-50"
                      >
                        {deletingId === b._id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
