"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FolderKanban,
  ArrowRight,
  Building2,
  Trophy,
  Bug,
  CheckCircle2,
  ClipboardList,
  Shield,
  AlertCircle,
  Circle,
  Clock,
  Users,
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import AuthLoader from "@/components/AuthLoader";
import { StatsSkeleton } from "@/components/skeletons";
import { getProjects } from "@/services/projectService";
import { getDepartments } from "@/services/departmentService";
import { getAllBugs } from "@/services/bugService";
import { getTasks } from "@/services/taskService";
import { getAllLogs } from "@/services/dailyLogService";
import { getLeaderboard } from "@/services/userService";

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

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [projects, setProjects] = useState([]);
  const [depts, setDepts] = useState([]);
  const [bugs, setBugs] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  const loadData = useCallback(async () => {
    try {
      setDataLoading(true);
      const [pR, dR, bR, tR, lR, lbR] = await Promise.allSettled([
        getProjects(),
        getDepartments(),
        getAllBugs(),
        getTasks(),
        getAllLogs(),
        getLeaderboard("all"),
      ]);
      setProjects(pR.status === "fulfilled" ? pR.value : []);
      setDepts(dR.status === "fulfilled" ? dR.value : []);
      setBugs(bR.status === "fulfilled" ? bR.value : []);
      setTasks(tR.status === "fulfilled" ? tR.value : []);
      setLogs(lR.status === "fulfilled" ? lR.value : []);
      const lb = lbR.status === "fulfilled" ? lbR.value : {};
      setLeaderboard(lb.topOverall ?? lb.leaderboard ?? lb.data ?? []);
    } catch {
      setError("Could not load dashboard data.");
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) loadData();
  }, [authLoading, user, loadData]);

  if (authLoading || !user) return <AuthLoader />;

  const activeProjects = projects.filter((p) => p.status !== "COMPLETED");
  const openBugs = bugs.filter((b) => ["OPEN", "REOPENED"].includes(b.status));
  const openTasks = tasks.filter((t) => t.status !== "DONE");
  const today = new Date();
  const todayLogs = logs.filter((l) => {
    const d = l.logDate
      ? new Date(l.logDate)
      : l.date
        ? new Date(l.date)
        : null;
    if (!d) return false;
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  });

  const medals = [
    {
      label: "1st",
      color: "text-[#e8a847]",
      bg: "bg-[#e8a847]/10",
      border: "border-[#e8a847]/30",
    },
    {
      label: "2nd",
      color: "text-foreground-muted",
      bg: "bg-foreground/5",
      border: "border-foreground/15",
    },
    {
      label: "3rd",
      color: "text-[#c47a3a]",
      bg: "bg-[#c47a3a]/10",
      border: "border-[#c47a3a]/30",
    },
  ];

  const stats = [
    {
      icon: Users,
      label: "Departments",
      value: depts.length,
      color: "text-[#47ff8a]",
    },
    {
      icon: FolderKanban,
      label: "Active Projects",
      value: activeProjects.length,
      color: "text-[#c847ff]",
    },
    {
      icon: ClipboardList,
      label: "Open Tasks",
      value: openTasks.length,
      color: "text-[#47c8ff]",
    },
    {
      icon: Clock,
      label: "Logs Today",
      value: todayLogs.length,
      color: "text-[#e8a847]",
    },
    {
      icon: Bug,
      label: "Issues",
      value: openBugs.length,
      color: "text-[#ff4747]",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-y-3">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-foreground-muted mb-1">
            Admin
          </p>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Welcome back, <span className="text-primary">{user.name}</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 border border-outline bg-surface-low px-3 py-2">
          <Shield className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted font-bold">
            Administrator
          </span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 border border-[#ff4747]/30 bg-[#ff4747]/5 text-[#ff4747]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-[12px]">{error}</span>
        </div>
      )}

      {/* Stats Grid */}
      {dataLoading ? (
        <StatsSkeleton count={5} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {stats.map(({ icon: Icon, label, value, color }) => (
            <div
              key={label}
              className="border border-outline bg-surface-low px-5 py-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted font-bold">
                  {label}
                </span>
              </div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Main layout: two independent column stacks */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Left column: Recent Projects + Top Performers ── */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Recent Projects */}
          <div className="border border-outline bg-surface-low">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-outline">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-[#c847ff]" />
                <span className="text-[10px] tracking-[0.15em] uppercase font-bold text-foreground-muted">
                  Active Projects
                </span>
              </div>
              <button
                onClick={() => router.push("/admin/projects")}
                className="flex items-center gap-1 text-[10px] tracking-[0.1em] uppercase text-foreground-muted hover:text-primary transition-colors"
              >
                View All <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-outline">
              {activeProjects.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-foreground-muted">
                  <p className="text-[11px] tracking-[0.1em] uppercase">
                    No active projects
                  </p>
                </div>
              ) : (
                activeProjects.slice(0, 4).map((p, idx) => (
                  <div
                    key={p._id ?? p.id ?? idx}
                    className="flex items-center justify-between px-5 py-3 hover:bg-surface-container transition-colors"
                  >
                    <p className="text-[12px] text-foreground font-medium">
                      {p.name}
                    </p>
                    <StatusBadge status={p.status} />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Performers */}
          <div className="border border-outline bg-surface-low">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-outline">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#e8a847]" />
                <span className="text-[10px] tracking-[0.15em] uppercase font-bold text-foreground-muted">
                  Top Performers
                </span>
              </div>
              <button
                onClick={() => router.push("/admin/leaderboard")}
                className="flex items-center gap-1 text-[10px] tracking-[0.1em] uppercase text-foreground-muted hover:text-primary transition-colors"
              >
                Leaderboard <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-outline">
              {leaderboard.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-foreground-muted">
                  <p className="text-[11px] tracking-[0.1em] uppercase">
                    No data yet
                  </p>
                </div>
              ) : (
                leaderboard.slice(0, 5).map((emp, i) => {
                  const m = medals[i] || medals[2];
                  return (
                    <div
                      key={emp._id ?? emp.id ?? i}
                      className="flex items-center gap-4 px-5 py-3 hover:bg-surface-container transition-colors"
                    >
                      <span
                        className={`text-[11px] font-bold tracking-widest uppercase px-2 py-0.5 border ${m.color} ${m.bg} ${m.border}`}
                      >
                        {m.label}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-foreground font-medium truncate">
                          {emp.name}
                        </p>
                        <p className="text-[10px] text-foreground-muted mt-0.5">
                          {emp.score ?? 0} pts
                        </p>
                      </div>
                      <span className={`text-lg font-bold ${m.color}`}>
                        {emp.score ?? 0}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ── Right column: Departments + Issues + Tasks ── */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Departments */}
          <div className="border border-outline bg-surface-low">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-outline">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#47c8ff]" />
                <span className="text-[10px] tracking-[0.15em] uppercase font-bold text-foreground-muted">
                  Departments
                </span>
              </div>
              <button
                onClick={() => router.push("/admin/departments")}
                className="flex items-center gap-1 text-[10px] tracking-[0.1em] uppercase text-foreground-muted hover:text-primary transition-colors"
              >
                Manage <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-outline">
              {depts.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-foreground-muted">
                  <p className="text-[11px] tracking-[0.1em] uppercase">
                    No departments yet
                  </p>
                </div>
              ) : (
                depts.slice(0, 5).map((d, idx) => (
                  <div
                    key={d._id ?? d.id ?? idx}
                    className="flex items-center justify-between px-5 py-3 hover:bg-surface-container transition-colors"
                  >
                    <p className="text-[12px] text-foreground font-medium">
                      {(d.departmentName || d.name || "").toUpperCase()}
                    </p>
                    <span className="text-[11px] text-foreground-muted">
                      {d.employeeCount ?? 0} members
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Critical Bugs / Issues */}
          <div className="border border-outline bg-surface-low">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-outline">
              <div className="flex items-center gap-2">
                <Bug className="w-4 h-4 text-[#ff4747]" />
                <span className="text-[10px] tracking-[0.15em] uppercase font-bold text-foreground-muted">
                  ISSUES
                </span>
              </div>
              <button
                onClick={() => router.push("/admin/bugs")}
                className="flex items-center gap-1 text-[10px] tracking-[0.1em] uppercase text-foreground-muted hover:text-primary transition-colors"
              >
                Issues <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-outline">
              {openBugs.length === 0 ? (
                <div className="flex items-center justify-center gap-2 py-8 text-[#47ff8a]">
                  <CheckCircle2 className="w-4 h-4" />
                  <p className="text-[11px] tracking-[0.1em] uppercase">
                    NO ISSUES !
                  </p>
                </div>
              ) : (
                openBugs.slice(0, 4).map((b, idx) => {
                  const proj = projects.find((p) => p._id === b.projectId);
                  return (
                    <div
                      key={b._id ?? b.id ?? idx}
                      className="flex items-center justify-between px-5 py-3 hover:bg-surface-container transition-colors"
                    >
                      <div>
                        <p className="text-[12px] text-foreground">{b.title}</p>
                        <p className="text-[11px] text-foreground-muted">
                          {proj?.name || b.projectId}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] tracking-[0.1em] uppercase font-bold px-2 py-0.5 border ${b.severity === "CRITICAL" ? "text-[#ff4747] border-[#ff4747]/30 bg-[#ff4747]/10" : b.severity === "HIGH" ? "text-[#e8a847] border-[#e8a847]/30 bg-[#e8a847]/10" : "text-foreground-muted border-foreground/15 bg-foreground/10"}`}
                      >
                        {b.severity}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Task List */}
          <div className="border border-outline bg-surface-low">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-outline">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-[#c847ff]" />
                <span className="text-[10px] tracking-[0.15em] uppercase font-bold text-foreground-muted">
                  Tasks
                </span>
              </div>
              <button
                onClick={() => router.push("/admin/tasks")}
                className="flex items-center gap-1 text-[10px] tracking-[0.1em] uppercase text-foreground-muted hover:text-primary transition-colors"
              >
                View All <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-outline">
              {openTasks.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-foreground-muted">
                  <p className="text-[11px] tracking-[0.1em] uppercase">
                    No open tasks
                  </p>
                </div>
              ) : (
                openTasks.slice(0, 6).map((t, idx) => (
                  <div
                    key={t._id ?? t.id ?? idx}
                    className="flex items-center justify-between px-5 py-3 hover:bg-surface-container transition-colors"
                  >
                    <div>
                      <p className="text-[12px] text-foreground">{t.title}</p>
                      <p className="text-[11px] text-foreground-muted">
                        {t.created_by?.name || t.created_by || "Admin"}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] tracking-[0.1em] uppercase font-bold px-2 py-0.5 border ${t.priority === "HIGH" ? "text-[#ff4747] border-[#ff4747]/30 bg-[#ff4747]/10" : t.priority === "MEDIUM" ? "text-[#47c8ff] border-[#47c8ff]/30 bg-[#47c8ff]/10" : "text-foreground-muted border-foreground/15 bg-foreground/10"}`}
                    >
                      {t.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
