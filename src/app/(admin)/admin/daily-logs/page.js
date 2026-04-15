"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BookCheck,
  Search,
  ChevronDown,
  AlertCircle,
  User,
  FolderKanban,
  Calendar,
  X,
} from "lucide-react";
import {
  TableSkeleton,
  FilterSkeleton,
  HeaderSkeleton,
} from "@/components/skeletons";
import { getAllLogs } from "@/services/dailyLogService";
import { getProjects } from "@/services/projectService";
import { DatePicker } from "@/components/DatePicker";

function parseDate(raw) {
  if (!raw) return null;
  if (typeof raw === "object") {
    if (raw.$date) return new Date(raw.$date);
    if (raw.$numberLong) return new Date(Number(raw.$numberLong));
    if (raw.toISOString) {
      try {
        return new Date(raw.toISOString());
      } catch {}
    }
    try {
      raw = JSON.stringify(raw);
    } catch {}
  }
  const dt = new Date(raw);
  return isNaN(dt) ? null : dt;
}

function formatDate(dateStr) {
  const d = parseDate(dateStr);
  if (!d) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(dateStr) {
  const d = parseDate(dateStr);
  if (!d) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DailyLogsSkeleton() {
  return (
    <div className="space-y-6">
      <HeaderSkeleton hasButton={false} />
      <FilterSkeleton filters={3} />
      <TableSkeleton rows={7} cols={5} />
    </div>
  );
}

function LogDetailModal({ log, onClose }) {
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

  const entries = log.entries?.length
    ? log.entries
    : [
        {
          projectName: log.projectName,
          taskTitle: log.taskTitle,
          description: log.description,
        },
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-surface-low border border-outline shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline shrink-0">
          <span className="text-[11px] tracking-[0.2em] uppercase font-bold text-foreground">
            Work Log Detail
          </span>
          <button
            onClick={onClose}
            className="text-foreground-muted hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          <div className="flex items-center gap-3 pb-3 border-b border-outline">
            <div className="w-8 h-8 bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-foreground">
                {log.userName}
              </p>
              <p className="text-[10px] text-foreground-muted tracking-[0.1em] uppercase">
                {formatDateTime(log.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-foreground-muted">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-[11px] tracking-[0.1em]">
              Log Date: {formatDate(log.logDate)}
            </span>
          </div>
          <div className="space-y-3">
            <p className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted">
              Work Entries ({entries.length})
            </p>
            {entries.map((entry, i) => (
              <div
                key={i}
                className="bg-surface-container border border-outline p-4 space-y-2"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] tracking-[0.12em] uppercase text-foreground-muted mb-0.5">
                      Project
                    </p>
                    <p className="text-[12px] text-foreground font-medium">
                      {entry.projectName || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] tracking-[0.12em] uppercase text-foreground-muted mb-0.5">
                      Task
                    </p>
                    <p className="text-[12px] text-foreground font-medium">
                      {entry.taskTitle || "N/A"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] tracking-[0.12em] uppercase text-foreground-muted mb-0.5">
                    Description
                  </p>
                  <p className="text-[12px] text-foreground-muted leading-relaxed">
                    {entry.description || "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 pb-5 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-[11px] tracking-[0.15em] uppercase font-bold border border-outline text-foreground-muted hover:text-foreground hover:border-foreground-muted transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DailyLogsPage() {
  const [logs, setLogs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterProject, setFilterProject] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [logsR, projectsR] = await Promise.allSettled([
        getAllLogs(),
        getProjects(),
      ]);
      let normalizedLogs = [];
      if (logsR.status === "fulfilled") {
        const v = logsR.value;
        if (Array.isArray(v)) normalizedLogs = v;
        else if (Array.isArray(v?.data)) normalizedLogs = v.data;
        else if (Array.isArray(v?.logs)) normalizedLogs = v.logs;
      }
      setLogs(normalizedLogs);
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

  const logsArr = Array.isArray(logs) ? logs : [];
  const projectsArr = Array.isArray(projects) ? projects : [];

  const filtered = logsArr.filter((l) => {
    const entries = l.entries?.length
      ? l.entries
      : [
          {
            projectName: l.projectName,
            taskTitle: l.taskTitle,
            description: l.description,
          },
        ];
    const matchSearch =
      !search ||
      (l.userName || "").toLowerCase().includes(search.toLowerCase()) ||
      entries.some(
        (e) =>
          (e.projectName || "").toLowerCase().includes(search.toLowerCase()) ||
          (e.taskTitle || "").toLowerCase().includes(search.toLowerCase()) ||
          (e.description || "").toLowerCase().includes(search.toLowerCase()),
      );
    const matchProject =
      filterProject === "all" ||
      entries.some(
        (e) =>
          String(e.projectId?._id || e.projectId) === String(filterProject),
      );
    const matchDate =
      !filterDate ||
      (() => {
        const d = l.logDate ?? l.date ?? l.created_at;
        if (!d) return false;
        try {
          return new Date(d).toISOString().startsWith(filterDate);
        } catch {
          return String(d).startsWith(filterDate);
        }
      })();
    return matchSearch && matchProject && matchDate;
  });

  const totalEntries = filtered.length;
  const uniqueContributors = new Set(filtered.map((l) => String(l.userId)))
    .size;

  if (loading) return <DailyLogsSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-y-3">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-foreground-muted mb-1">
            Overview
          </p>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Daily Work Logs
          </h1>
        </div>
        <div className="flex gap-4">
          <div className="border border-outline bg-surface-container px-4 py-2.5 text-center">
            <p className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted">
              Total Logs
            </p>
            <p className="text-xl font-bold text-foreground mt-0.5">
              {totalEntries}
            </p>
          </div>
          <div className="border border-outline bg-surface-container px-4 py-2.5 text-center">
            <p className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted">
              Contributors
            </p>
            <p className="text-xl font-bold text-primary mt-0.5">
              {uniqueContributors}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 px-4 py-3 border border-[#ff4747]/30 bg-[#ff4747]/5 text-[#ff4747]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-[12px]">{error}</span>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by employee, project, task…"
            className="w-full bg-surface-container border border-outline pl-9 pr-3 py-2.5 text-[12px] text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <DatePicker
          value={filterDate}
          onChange={setFilterDate}
          placeholder="Filter by date"
        />
        <div className="relative">
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="appearance-none bg-surface-container border border-outline px-3 py-2.5 pr-8 text-[12px] text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
          >
            <option value="all">All Projects</option>
            {projectsArr.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground-muted pointer-events-none" />
        </div>
        {(filterDate || filterProject !== "all" || search) && (
          <button
            onClick={() => {
              setSearch("");
              setFilterDate("");
              setFilterProject("all");
            }}
            className="text-[10px] tracking-[0.1em] uppercase text-foreground-muted hover:text-foreground border border-outline px-3 py-2.5 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <div className="border border-outline bg-surface-low overflow-hidden min-w-150">
          <div className="grid grid-cols-[1fr_1fr_1fr_120px_100px] gap-4 px-6 py-3 border-b border-outline bg-surface-container items-center">
            {["Employee", "Project", "Task", "Log Date", ""].map((h) => (
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
              <BookCheck className="w-8 h-8 mb-3 opacity-40" />
              <p className="text-[12px] tracking-[0.1em] uppercase">
                No logs found
              </p>
            </div>
          ) : (
            <div className="divide-y divide-outline">
              {filtered.map((log) => {
                const firstEntry = log.entries?.[0] || {
                  projectName: log.projectName,
                  taskTitle: log.taskTitle,
                };
                return (
                  <button
                    key={log._id}
                    onClick={() => setSelectedLog(log)}
                    className="grid grid-cols-[1fr_1fr_1fr_120px_100px] gap-4 w-full px-6 py-4 text-left hover:bg-surface-container transition-colors group items-center"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <User className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-[12px] font-medium text-foreground truncate">
                        {log.userName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <FolderKanban className="w-3 h-3 text-foreground-muted shrink-0" />
                      <span className="text-[12px] text-foreground-muted truncate">
                        {firstEntry.projectName || "—"}
                      </span>
                    </div>
                    <div className="flex items-center min-w-0">
                      <span className="text-[12px] text-foreground-muted truncate">
                        {firstEntry.taskTitle || "—"}
                      </span>
                    </div>
                    <span className="text-[12px] text-foreground-muted">
                      {formatDate(log.logDate)}
                    </span>
                    <span className="text-[11px] text-foreground-muted group-hover:text-primary transition-colors">
                      View →
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {filtered.length > 0 && (
        <p className="text-[10px] tracking-[0.1em] uppercase text-foreground-muted">
          Showing {filtered.length} {filtered.length === 1 ? "log" : "logs"}
        </p>
      )}

      {selectedLog && (
        <LogDetailModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
}
