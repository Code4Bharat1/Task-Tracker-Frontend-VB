"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CheckSquare,
  Search,
  Circle,
  Calendar,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import AuthLoader from "@/components/AuthLoader";
import { getMyProjects } from "@/services/projectService";
import {
  getTasks,
  getMyTasks,
  advanceTaskStatus,
  startTesterReview,
  TASK_STATUS_META,
  TASK_STATUSES,
  TASK_PRIORITY_META,
} from "@/services/taskService";
import { ProjectsSkeleton } from "@/components/skeletons";

function StatusBadge({ status }) {
  const m = TASK_STATUS_META[status];
  if (!m) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] tracking-[0.1em] uppercase font-bold border ${m.bg} ${m.border} ${m.color}`}
    >
      <Circle className="w-1.5 h-1.5 fill-current" /> {m.label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const m = TASK_PRIORITY_META[priority];
  if (!m) return null;
  return (
    <span
      className={`inline-flex px-2 py-0.5 text-[10px] tracking-[0.1em] uppercase font-bold border ${m.bg} ${m.border} ${m.color}`}
    >
      {m.label}
    </span>
  );
}

function formatDateTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function TasksPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projectMap, setProjectMap] = useState({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [advancing, setAdvancing] = useState(null);

  const isPM = user?.role === "project_manager";

  useEffect(() => {
    if (
      !loading &&
      (!user ||
        !["employee", "project_manager", "developer", "tester"].includes(user?.role))
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
        const pMap = {};
        projs.forEach((p) => {
          pMap[p._id] = p.name;
        });
        setProjectMap(pMap);
        const results = await Promise.allSettled(
          projs.map((p) => getTasks(p._id)),
        );
        setTasks(
          results
            .filter((r) => r.status === "fulfilled")
            .flatMap((r) => r.value),
        );
      } else {
        const myTasks = await getMyTasks(user?._id).catch(() => []);
        setTasks(myTasks);
      }
    } catch {
      setError("Failed to load tasks.");
    } finally {
      setDataLoading(false);
    }
  }, [user, isPM]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleAdvance(task) {
    const advanceable = ["TODO", "IN_PROGRESS", "IN_REVIEW"];
    if (!advanceable.includes(task.status)) return;
    try {
      setAdvancing(task._id);
      const updated = await advanceTaskStatus(task._id);
      setTasks((prev) => prev.map((t) => (t._id === task._id ? updated : t)));
    } catch {
      setError("Failed to advance task.");
    } finally {
      setAdvancing(null);
    }
  }

  if (loading || !user) return <AuthLoader />;

  const filtered = tasks
    .filter((t) => statusFilter === "ALL" || t.status === statusFilter)
    .filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));

  const byStatus = {};
  TASK_STATUSES.forEach((s) => {
    byStatus[s] = tasks.filter((t) => t.status === s).length;
  });

  const roleLabel = isPM ? "Project Manager" : user?.role === "tester" ? "Tester" : "Developer";
  const pageTitle = isPM ? "All Tasks" : "My Tasks";

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
        <div className="grid grid-cols-2 gap-2">
          {TASK_STATUSES.filter(s => !["TODO", "REJECTED"].includes(s)).map((s) => {
            const meta = TASK_STATUS_META[s];
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? "ALL" : s)}
                className={`px-3 py-4 border text-center transition-all duration-200 ${
                  statusFilter === s
                    ? `${meta.border} ${meta.bg} shadow-lg shadow-current/5 scale-[1.02]`
                    : `${meta.border}/30 ${meta.bg}/30 hover:bg-surface-high grayscale-[0.4] hover:grayscale-0`
                }`}
              >
                <p
                  className={`text-2xl font-bold ${meta.color}`}
                >
                  {byStatus[s]}
                </p>
                <p className={`text-[9px] tracking-[0.15em] uppercase mt-1 font-bold ${meta.color} opacity-80`}>
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
          placeholder="Search tasks..."
          className="w-full bg-surface-container border border-outline pl-9 pr-4 py-2.5 text-[12px] text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Task List */}
      {dataLoading ? (
        <ProjectsSkeleton />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 border border-outline bg-surface-low text-foreground-muted">
          <CheckSquare className="w-8 h-8" />
          <p className="text-[12px] tracking-[0.1em] uppercase">
            No tasks found
          </p>
        </div>
      ) : (
        <div className="border border-outline bg-surface-low divide-y divide-outline">
          {filtered.map((task) => {
            const canAdvance =
              (["TODO", "IN_PROGRESS"].includes(task.status)) ||
              (task.status === "IN_REVIEW");

            return (
              <div
                key={task._id}
                className="flex items-start gap-4 px-5 py-4 hover:bg-surface-container transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-[13px] font-semibold text-foreground">
                      {task.title}
                    </p>
                    <PriorityBadge priority={task.priority} />
                  </div>
                  {task.description && (
                    <p className="text-[11px] text-foreground-muted truncate mb-1.5">
                      {task.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 flex-wrap">
                    {isPM && projectMap[task.projectId] && (
                      <span className="text-[10px] text-foreground-muted">
                        Project: {projectMap[task.projectId]}
                      </span>
                    )}
                    {task.deadline && (
                      <span className="flex items-center gap-1 text-[10px] text-foreground-muted">
                        <Calendar className="w-3 h-3" />
                        Deadline: {formatDate(task.deadline)}
                      </span>
                    )}
                  </div>

                  {/* Timing Details */}
                  <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-outline/30">
                    {task.developerStartedAt && (
                      <div className="flex flex-col">
                        <span className="text-[7px] uppercase tracking-[0.15em] text-foreground-muted mb-1 font-bold">Dev Start</span>
                        <span className="text-[10px] text-foreground font-medium">{formatDateTime(task.developerStartedAt)}</span>
                      </div>
                    )}
                    {task.developerFinishedAt && (
                      <div className="flex flex-col">
                        <span className="text-[7px] uppercase tracking-[0.15em] text-foreground-muted mb-1 font-bold">Dev Finish</span>
                        <span className="text-[10px] text-foreground font-medium">{formatDateTime(task.developerFinishedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between gap-3 shrink-0">
                  {/* Action Buttons Replace the Badge for active tasks */}
                  <div className="flex flex-col items-end gap-2">
                    {task.status === "TODO" && (
                      <button
                        onClick={() => handleAdvance(task)}
                        disabled={advancing === task._id}
                        className="px-6 py-2 bg-primary text-on-primary rounded-full text-[11px] tracking-[0.1em] uppercase font-bold hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {advancing === task._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Start Task"}
                      </button>
                    )}

                    {task.status === "IN_PROGRESS" && (
                      <button
                        onClick={() => handleAdvance(task)}
                        disabled={advancing === task._id}
                        className="px-6 py-2 bg-[#10b981] text-white rounded-full text-[11px] tracking-[0.1em] uppercase font-bold hover:shadow-lg hover:shadow-[#10b981]/20 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {advancing === task._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Mark Complete"}
                      </button>
                    )}

                    {/* Show badge only for final or rejected statuses, or if PM view */}
                    {(["DONE", "REJECTED"].includes(task.status) || isPM) && (
                      <StatusBadge status={task.status} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
