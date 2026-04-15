"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FolderKanban,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Circle,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import AuthLoader from "@/components/AuthLoader";
import { DashboardSkeleton } from "@/components/skeletons";
import { getProjects } from "@/services/projectService";
import { getAllLogs } from "@/services/dailyLogService";
import { getAllBugs } from "@/services/bugService";
import { getTasks } from "@/services/taskService";
import { getLeaderboard } from "@/services/userService";

// ─── Status Meta ─────────────────────────────────────────────
const STATUS_META = {
  IN_PROGRESS: {
    label: "In Progress",
    color: "text-[#47c8ff]",
    bg: "bg-[#47c8ff]/10",
    border: "border-[#47c8ff]/20",
  },
  COMPLETED: {
    label: "Completed",
    color: "text-[#47ff8a]",
    bg: "bg-[#47ff8a]/10",
    border: "border-[#47ff8a]/20",
  },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.IN_PROGRESS;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] tracking-[0.1em] uppercase font-bold border ${m.bg} ${m.border} ${m.color}`}
    >
      <Circle className="w-1.5 h-1.5 fill-current" />
      {m.label}
    </span>
  );
}

function progressPct(completed, total) {
  if (!total) return 0;
  return Math.round((completed / total) * 100);
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getLogDate(log) {
  if (!log) return null;
  const tryParse = (v) => {
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d) ? null : d;
  };
  return (
    tryParse(log.logDate) ||
    tryParse(log.date) ||
    tryParse(log.createdAt) ||
    tryParse(log.created_at) ||
    null
  );
}

function StatCard({ label, value, sub, icon: Icon, accent }) {
  return (
    <div className="border border-outline bg-surface-low p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted">
          {label}
        </span>
        <Icon className={`w-4 h-4 ${accent}`} />
      </div>
      <p className={`text-3xl font-bold mb-1 ${accent}`}>{value}</p>
      {sub && (
        <p className="text-[10px] text-foreground-muted tracking-[0.1em]">
          {sub}
        </p>
      )}
    </div>
  );
}

export default function DeptHeadDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState([]);
  const [logs, setLogs] = useState([]);
  const [bugs, setBugs] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectStatuses, setProjectStatuses] = useState({});

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "department_head")) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  const loadData = useCallback(async () => {
    try {
      const [pR, lR, bR, tR, lbR] = await Promise.allSettled([
        getProjects(),
        getAllLogs(),
        getAllBugs(),
        getTasks(),
        getLeaderboard("all"),
      ]);
      setProjects(pR.status === "fulfilled" ? pR.value : []);
      setLogs(lR.status === "fulfilled" ? lR.value : []);
      setBugs(bR.status === "fulfilled" ? bR.value : []);
      setTasks(tR.status === "fulfilled" ? tR.value : []);
      const lb = lbR.status === "fulfilled" ? lbR.value : {};
      setLeaderboard(lb.topOverall ?? lb.leaderboard ?? lb.data ?? []);
    } catch {
      /* show zeros */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) loadData();
  }, [authLoading, user, loadData]);

  useEffect(() => {
    const ps = {};
    (projects || []).forEach((p) => {
      if (p && p._id) ps[p._id] = p.status;
    });
    setProjectStatuses(ps);
  }, [projects]);

  if (authLoading || !user) return <AuthLoader />;
  if (loading) return <DashboardSkeleton />;

  const activeProjects = (projects || []).filter(
    (p) => p?.status !== "COMPLETED",
  );
  const completedProjects = (projects || []).filter(
    (p) => p?.status === "COMPLETED",
  );
  const openBugs = (bugs || []).filter((b) =>
    ["OPEN", "REOPENED"].includes(b?.status),
  );
  const openTasks = (tasks || []).filter((t) => t?.status !== "DONE");
  const today = new Date().toISOString().split("T")[0];
  // logs in the last 7 days
  const todayLogs = (logs || []).filter((l) => l?.logDate === today);
  const logsThisWeek = (logs || []).filter((l) => {
    const d = getLogDate(l);
    if (!d) return false;
    const now = new Date();
    const diffDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  });
  const topPerformer = (leaderboard && leaderboard.length) ? leaderboard[0] : null;
  const recentLogs = [...(logs || [])]
    .slice()
    .sort((a, b) => {
      const da = getLogDate(a);
      const db = getLogDate(b);
      const ta = da ? da.getTime() : 0;
      const tb = db ? db.getTime() : 0;
      return tb - ta;
    })
    .slice(0, 6);
  const recentProjects = [...(projects || [])]
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-y-3">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-foreground-muted mb-1">
            Department Head
          </p>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Welcome back, {user.name?.split(" ")[0]}
          </h1>
        </div>
        
      </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              label="Projects"
              value={projects.length}
              icon={FolderKanban}
              accent="text-[#47c8ff]"
            />
            <StatCard
              label="Tasks"
              value={openTasks.length}
              icon={CheckCircle2}
              accent="text-[#47ff8a]"
            />
            <StatCard
              label="Logs This Week"
              value={logsThisWeek.length}
              icon={Clock}
              accent="text-[#e8a847]"
            />
            <StatCard
              label="Issues"
              value={openBugs.length}
              icon={AlertCircle}
              accent="text-[#ff4747]"
            />
            <StatCard
              label="Top Performer"
              value={topPerformer ? topPerformer.name : "—"}
              sub={topPerformer ? `${topPerformer.score ?? 0} pts` : "No data"}
              icon={Users}
              accent="text-[#e8a847]"
            />
          </div>

      {/* Recent Projects */}
      <div className="border border-outline bg-surface-low">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline">
          <span className="text-[11px] tracking-[0.2em] uppercase font-bold text-foreground">
            Recent Projects
          </span>
          <button
            onClick={() => router.push("/dept-head/projects")}
            className="flex items-center gap-1.5 text-[10px] tracking-[0.1em] uppercase text-foreground-muted hover:text-primary transition-colors"
          >
            View All <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="divide-y divide-outline">
          {recentProjects.map((p) => {
            const pct = progressPct(p.modulesCompleted, p.modulesTotal);
            return (
              <button
                key={p._id}
                onClick={() => router.push(`/dept-head/projects/${p._id}`)}
                className="w-full px-6 py-4 flex items-center gap-6 text-left hover:bg-surface-container transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground truncate">
                    {p.name}
                  </p>
                  <p className="text-[10px] text-foreground-muted mt-0.5">
                    PM:{" "}
                    {p.managerNames?.length ? p.managerNames.join(", ") : "—"} ·
                    Due {formatDate(p.deadline)}
                  </p>
                </div>
                {/* Phases dropdown — stop propagation so row click still navigates */}
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={projectStatuses[p._id] || p.status}
                    onChange={(e) =>
                      setProjectStatuses((prev) => ({
                        ...prev,
                        [p._id]: e.target.value,
                      }))
                    }
                    className="appearance-none bg-surface-container border border-outline pl-3 pr-8 py-1.5 text-[10px] tracking-[0.1em] uppercase font-bold text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
                  >
                    {Object.keys(STATUS_META).map((s) => (
                      <option key={s} value={s}>
                        {STATUS_META[s].label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground-muted pointer-events-none" />
                </div>
                <div className="w-32 hidden sm:block">
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px] text-foreground-muted">
                      {p.modulesCompleted}/{p.modulesTotal} modules
                    </span>
                    <span className="text-[10px] text-foreground-muted">
                      {pct}%
                    </span>
                  </div>
                  <div className="h-1 bg-surface-high w-full">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-foreground-muted group-hover:text-primary transition-colors shrink-0" />
              </button>
            );
          })}
          {recentProjects.length === 0 && (
            <div className="flex items-center justify-center py-12 text-foreground-muted">
              <p className="text-[12px] tracking-[0.1em] uppercase">
                No projects yet
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Open Issues + Top Performers + Today's Logs */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="border border-outline bg-surface-low">
          <div className="flex items-center justify-between px-6 py-4 border-b border-outline">
            <span className="text-[11px] tracking-[0.2em] uppercase font-bold text-foreground">
              Open Issues
            </span>
            <span className="text-[10px] tracking-[0.1em] uppercase text-[#ff4747]">
              {openBugs.length} open
            </span>
          </div>
          <div className="divide-y divide-outline">
            {openBugs.slice(0, 4).map((bug) => (
              <div key={bug._id} className="px-6 py-3.5 flex items-start gap-3">
                <div
                  className={`mt-0.5 w-2 h-2 shrink-0 rounded-full ${bug.severity === "CRITICAL" ? "bg-[#ff4747]" : bug.severity === "HIGH" ? "bg-[#f87343]" : "bg-[#e8a847]"}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-foreground font-medium truncate">
                    {bug.title}
                  </p>
                  <p className="text-[10px] text-foreground-muted mt-0.5">
                    {bug.projectName} · {bug.assignedToName}
                  </p>
                </div>
                <span className="text-[10px] tracking-[0.08em] uppercase text-[#ff4747] shrink-0">
                  {bug.severity}
                </span>
              </div>
            ))}
            {openBugs.length === 0 && (
              <div className="flex items-center justify-center py-8 text-foreground-muted">
                <p className="text-[12px] tracking-[0.1em] uppercase">
                  No open bugs
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="border border-outline bg-surface-low">
          <div className="flex items-center justify-between px-6 py-4 border-b border-outline">
            <span className="text-[11px] tracking-[0.2em] uppercase font-bold text-foreground">
              Top Performers
            </span>
          </div>
          <div className="divide-y divide-outline">
            {leaderboard && leaderboard.length ? (
              leaderboard.slice(0, 5).map((emp, i) => {
                const medals = [
                  { label: "1st", color: "text-[#e8a847]", bg: "bg-[#e8a847]/10", border: "border-[#e8a847]/30" },
                  { label: "2nd", color: "text-foreground-muted", bg: "bg-foreground/5", border: "border-foreground/15" },
                  { label: "3rd", color: "text-[#c47a3a]", bg: "bg-[#c47a3a]/10", border: "border-[#c47a3a]/30" },
                ];
                const m = medals[i] || medals[2];
                return (
                  <div key={emp._id ?? emp.id ?? i} className="flex items-center gap-4 px-6 py-3 hover:bg-surface-container transition-colors">
                    <span className={`text-[11px] font-bold tracking-widest uppercase px-2 py-0.5 border ${m.color} ${m.bg} ${m.border}`}>{m.label}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-foreground font-medium truncate">{emp.name}</p>
                      <p className="text-[10px] text-foreground-muted mt-0.5">{emp.score ?? 0} pts</p>
                    </div>
                    <span className={`text-lg font-bold ${m.color}`}>{emp.score ?? 0}</span>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center justify-center py-8 text-foreground-muted">
                <p className="text-[12px] tracking-[0.1em] uppercase">No data yet</p>
              </div>
            )}
          </div>
        </div>

        <div className="border border-outline bg-surface-low">
          <div className="flex items-center justify-between px-6 py-4 border-b border-outline">
            <span className="text-[11px] tracking-[0.2em] uppercase font-bold text-foreground">
              Recent Logs
            </span>
          </div>
          <div className="divide-y divide-outline">
            {recentLogs.length ? (
              recentLogs.map((log) => (
                <div
                  key={log._id ?? log.id}
                  className="px-6 py-3.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <Users className="w-2.5 h-2.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[12px] text-foreground font-medium">
                        {log.userName || log.user?.name || "—"}
                      </p>
                      <p className="text-[10px] text-foreground-muted">
                        {log.projectName || log.project?.name || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="text-[10px] text-foreground-muted">
                    {getLogDate(log)
                      ? getLogDate(log).toLocaleString()
                      : "—"}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center py-8 text-foreground-muted">
                <p className="text-[12px] tracking-[0.1em] uppercase">No logs yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
