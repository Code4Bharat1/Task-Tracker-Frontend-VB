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
    const advanceable = ["TODO", "IN_PROGRESS"];
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

  const roleLabel = isPM ? "Project Manager" : "Developer";
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
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {TASK_STATUSES.map((s) => {
            const meta = TASK_STATUS_META[s];
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
            const contributors = task.contributors || [];
            const reviewers = task.reviewers || [];
            const isContributor = contributors.some(
              (c) => (c.userId?._id || c.userId) === user._id,
            );
            const canAdvance =
              isContributor && ["TODO", "IN_PROGRESS"].includes(task.status);

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
                        {projectMap[task.projectId]}
                      </span>
                    )}
                    {contributors.length > 0 && (
                      <span className="text-[10px] text-foreground-muted">
                        Contributors:{" "}
                        {contributors
                          .map((c) => c.userId?.name || "—")
                          .join(", ")}
                      </span>
                    )}
                    {task.deadline && (
                      <span className="flex items-center gap-1 text-[10px] text-foreground-muted">
                        <Calendar className="w-3 h-3" />
                        {formatDate(task.deadline)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={task.status} />
                  {canAdvance && (
                    <button
                      disabled={advancing === task._id}
                      onClick={() => handleAdvance(task)}
                      className="flex items-center gap-1 px-2 py-1.5 border border-primary/30 text-primary hover:bg-primary/10 text-[9px] tracking-[0.1em] uppercase font-bold transition-colors disabled:opacity-50"
                    >
                      {advancing === task._id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                      {task.status === "TODO" ? "Start" : "Submit Review"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
