"use client";

import { useState, useEffect, useCallback } from "react";
import PermissionGuard from "@/components/PermissionGuard";
import {
  ClipboardList,
  Search,
  AlertCircle,
  Clock,
  Users,
  ChevronRight,
  X,
  BookOpen,
  Layers,
} from "lucide-react";
import { TableSkeleton, HeaderSkeleton } from "@/components/skeletons";
import { getAllLogs } from "@/services/dailyLogService";
import { getProjects } from "@/services/projectService";
import { getUsers } from "@/services/userService";
import { DatePicker } from "@/components/DatePicker";

// ─── Helpers ──────────────────────────────────────────────────
function fmt(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Log Detail Modal ─────────────────────────────────────────
function LogModal({ log, users, projects, onClose }) {
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

  if (!log) return null;
  const employee = (users || []).find((u) => u._id === log.userId);

  const entries = log.entries?.length
    ? log.entries
    : [{ projectId: log.projectId, moduleName: log.moduleName, description: log.description }];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg border border-outline bg-surface-low shadow-2xl z-10 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline shrink-0">
          <div className="flex items-center gap-3">
            <ClipboardList className="w-4 h-4 text-primary" />
            <p className="text-[11px] tracking-[0.15em] uppercase font-bold text-foreground">
              Log Details
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-foreground-muted hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted mb-1">Employee</p>
              <p className="text-[13px] text-foreground font-semibold">{employee?.name || log.userName || log.userId}</p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted mb-1">Date</p>
              <p className="text-[13px] text-foreground font-semibold">{fmt(log.logDate || log.date || log.createdAt)}</p>
            </div>
          </div>

          {/* Entries */}
          <div className="space-y-3">
            <p className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted">
              Work Entries ({entries.length})
            </p>
            {entries.map((entry, i) => {
              const proj = (projects || []).find((p) => p._id === (entry.projectId?._id || entry.projectId));
              return (
                <div key={i} className="border border-outline bg-surface-container p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] tracking-[0.12em] uppercase text-foreground-muted mb-0.5">Project</p>
                      <p className="text-[12px] text-foreground font-medium">{proj?.name || entry.projectName || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] tracking-[0.12em] uppercase text-foreground-muted mb-0.5">Module</p>
                      <p className="text-[12px] text-foreground font-medium">{entry.moduleTitle || entry.moduleName || <span className="text-foreground-muted">N/A</span>}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] tracking-[0.12em] uppercase text-foreground-muted mb-0.5">Description</p>
                    <p className="text-[12px] text-foreground-muted leading-relaxed border border-outline bg-surface-low px-3 py-2">
                      {entry.description || "No description provided."}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {log.screenshotUrl && (
            <div>
              <p className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted mb-1.5">Screenshot</p>
              <a href={log.screenshotUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary hover:underline tracking-[0.1em]">
                View Screenshot →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
function DeptHeadDailyLogsPageInner() {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [projectFilter, setProjectFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [logsR, usersR, projectsR] = await Promise.allSettled([
        getAllLogs(),
        getUsers(),
        getProjects(),
      ]);
      setLogs(logsR.status === "fulfilled" ? logsR.value : []);
      setUsers(usersR.status === "fulfilled" ? usersR.value : []);
      setProjects(projectsR.status === "fulfilled" ? projectsR.value : []);
    } catch {
      setError("Failed to load daily logs. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading)
    return (
      <div className="space-y-6">
        <HeaderSkeleton hasButton={false} />
        <TableSkeleton rows={6} cols={5} />
      </div>
    );

  const filtered = (logs || []).filter((l) => {
    const user = (users || []).find((u) => u._id === l.userId);
    const entries = l.entries?.length
      ? l.entries
      : [{ projectId: l.projectId, moduleName: l.moduleName, description: l.description }];
    const matchSearch =
      !search ||
      user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      entries.some((e) => {
        const proj = (projects || []).find((p) => p._id === (e.projectId?._id || e.projectId));
        return (
          proj?.name?.toLowerCase().includes(search.toLowerCase()) ||
          e.description?.toLowerCase().includes(search.toLowerCase())
        );
      });
    const matchDate =
      !dateFilter ||
      (l.logDate || l.date || l.createdAt)?.startsWith(dateFilter);
    const matchProject =
      projectFilter === "all" ||
      entries.some((e) => (e.projectId?._id || e.projectId) === projectFilter);
    return matchSearch && matchDate && matchProject;
  });

  const submittedCount = filtered.length;
  const missingUsers = dateFilter
    ? (users || []).filter((u) =>
        ["employee", "lead", "contributor", "reviewer"].includes(u.globalRole) &&
        !filtered.some((l) => l.userId === u._id)
      )
    : [];
  const missingCount = missingUsers.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-foreground-muted mb-1">
            Department
          </p>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Daily Logs
          </h1>
        </div>
        <div className="flex gap-5">
          <div className="text-right">
            <p className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted">
              Submitted Logs
            </p>
            <p className="text-2xl font-bold text-primary">{submittedCount}</p>
          </div>
          {dateFilter && (
            <div className="text-right">
              <p className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted">
                Missing Logs
              </p>
              <p className="text-2xl font-bold text-[#ff4747]">
                {missingCount}
              </p>
            </div>
          )}
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
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee or project..."
            className="w-full bg-surface-container border border-outline pl-9 pr-3 py-2.5 text-[12px] text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary"
          />
        </div>
        <DatePicker
          value={dateFilter}
          onChange={(v) => {
            const d = new Date();
            const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            setDateFilter(v || today);
          }}
          placeholder="Filter by date"
        />
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground focus:outline-none focus:border-primary"
        >
          <option value="all">All Projects</option>
          {(projects || []).map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
        {(search || projectFilter !== "all") && (
          <button
            onClick={() => {
              const d = new Date();
              const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
              setSearch("");
              setDateFilter(today);
              setProjectFilter("all");
            }}
            className="flex items-center gap-1.5 px-3 py-2.5 border border-outline text-foreground-muted hover:text-foreground hover:border-foreground-muted text-[11px] transition-colors"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <div className="border border-outline bg-surface-low min-w-150">
          <div className="grid grid-cols-[2fr_2fr_80px_1fr_40px] gap-4 px-6 py-3 border-b border-outline bg-surface-container">
            {["Employee", "Project / Module", "Status", "Date", ""].map((h) => (
              <span
                key={h}
                className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted font-bold"
              >
                {h}
              </span>
            ))}
          </div>

          {filtered.length === 0 && missingUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-foreground-muted">
              <BookOpen className="w-8 h-8" />
              <p className="text-[12px] tracking-[0.1em] uppercase">
                No logs found
              </p>
            </div>
          ) : (
            <div className="divide-y divide-outline">
              {(filtered || []).map((log) => {
                const emp = (users || []).find((u) => u._id === log.userId);
                const firstEntry = log.entries?.[0] || { projectId: log.projectId, moduleName: log.moduleName };
                const project = (projects || []).find((p) => p._id === (firstEntry.projectId?._id || firstEntry.projectId));
                return (
                  <div
                    key={log._id}
                    onClick={() => setSelectedLog(log)}
                    className="grid grid-cols-[2fr_2fr_80px_1fr_40px] gap-4 px-6 py-3.5 items-center hover:bg-surface-container transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <Users className="w-3 h-3 text-primary" />
                      </div>
                      <p className="text-[13px] text-foreground font-medium">{emp?.name || log.userId}</p>
                    </div>
                    <div>
                      <p className="text-[12px] text-foreground">{project?.name || firstEntry.projectName || "—"}</p>
                      {(firstEntry.moduleTitle || firstEntry.moduleName) && (
                        <p className="text-[11px] text-foreground-muted flex items-center gap-1 mt-0.5">
                          <Layers className="w-3 h-3" /> {firstEntry.moduleTitle || firstEntry.moduleName}
                        </p>
                      )}
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold tracking-[0.1em] uppercase text-[#47ff8a] bg-[#47ff8a]/10 border border-[#47ff8a]/30">
                      Submitted
                    </span>
                    <p className="text-[12px] text-foreground-muted">{fmt(log.logDate || log.date || log.createdAt)}</p>
                    <ChevronRight className="w-4 h-4 text-foreground-muted" />
                  </div>
                );
              })}
              {dateFilter &&
                (missingUsers || []).map((u) => (
                  <div
                    key={`missing-${u._id}`}
                    className="grid grid-cols-[2fr_2fr_80px_1fr_40px] gap-4 px-6 py-3.5 items-center bg-[#ff4747]/5"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 bg-[#ff4747]/10 border border-[#ff4747]/20 flex items-center justify-center shrink-0">
                        <Users className="w-3 h-3 text-[#ff4747]" />
                      </div>
                      <p className="text-[13px] text-foreground font-medium">
                        {u.name}
                      </p>
                    </div>
                    <p className="text-[12px] text-foreground-muted">—</p>
                    <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold tracking-[0.1em] uppercase text-[#ff4747] bg-[#ff4747]/10 border border-[#ff4747]/30">
                      Missing
                    </span>
                    <p className="text-[12px] text-foreground-muted">
                      {fmt(dateFilter)}
                    </p>
                    <span />
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <LogModal
          log={selectedLog}
          users={users}
          projects={projects}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
}

export default function DeptHeadDailyLogsPage() {
  return (
    <PermissionGuard resource="dailyLogs" action="read">
      <DeptHeadDailyLogsPageInner />
    </PermissionGuard>
  );
}
