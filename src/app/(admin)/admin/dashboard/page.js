"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Building2,
  FolderKanban,
  ClipboardList,
  Bug,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Shield,
  Trophy,
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import AuthLoader from "@/components/AuthLoader";
import { StatsSkeleton } from "@/components/skeletons";
import { getUsers } from "@/services/userService";
import { getDepartments } from "@/services/departmentService";
import { getProjects } from "@/services/projectService";
import { getAllLogs } from "@/services/dailyLogService";
import { getAllBugs } from "@/services/bugService";
import api from "@/lib/api";

// ─── Status badge ──────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    IN_PROGRESS: "text-[#47c8ff] border-[#47c8ff]/30 bg-[#47c8ff]/10",
    PLANNING: "text-foreground-muted   border-foreground/15   bg-foreground/10",
    CODE_REVIEW: "text-[#c847ff] border-[#c847ff]/30 bg-[#c847ff]/10",
    QA_TESTING: "text-[#e8a847] border-[#e8a847]/30 bg-[#e8a847]/10",
    DEPLOYED: "text-[#47ff8a] border-[#47ff8a]/30 bg-[#47ff8a]/10",
  };
  return (
    <span
      className={`inline-flex px-2 py-0.5 text-[10px] tracking-[0.1em] uppercase font-bold border ${map[status] || "text-foreground-muted border-foreground-muted/30 bg-foreground-muted/10"}`}
    >
      {status?.replace(/_/g, " ")}
    </span>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [users, setUsers] = useState([]);
  const [depts, setDepts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [logs, setLogs] = useState([]);
  const [bugs, setBugs] = useState([]);
  const [modules, setModules] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) router.replace("/login");
  }, [user, loading, router]);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setDataLoading(true);
      const [uR, dR, pR, lR, bR] = await Promise.allSettled([
        getUsers(),
        getDepartments(),
        getProjects(),
        getAllLogs(),
        getAllBugs(),
      ]);
      const fetchedProjects = pR.status === "fulfilled" ? pR.value : [];
      setUsers(uR.status === "fulfilled" ? uR.value : []);
      setDepts(dR.status === "fulfilled" ? dR.value : []);
      setProjects(fetchedProjects);
      setLogs(lR.status === "fulfilled" ? lR.value : []);
      setBugs(bR.status === "fulfilled" ? bR.value : []);
      // Fetch modules for all projects to compute module-based scores
      const modResults = await Promise.allSettled(
        fetchedProjects.map((p) => api.get("/modules", { params: { projectId: p._id } }))
      );
      const allMods = modResults.flatMap((r) =>
        r.status === "fulfilled"
          ? (r.value?.data?.data ?? r.value?.data?.modules ?? [])
          : []
      );
      setModules(allMods);
    } catch {
      setError("Failed to load dashboard data.");
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading || !user) return <AuthLoader />;

  const usersArr = Array.isArray(users) ? users : [];
  const deptsArr = Array.isArray(depts) ? depts : [];
  const projectsArr = Array.isArray(projects) ? projects : [];
  const logsArr = Array.isArray(logs) ? logs : [];
  const bugsArr = Array.isArray(bugs) ? bugs : [];
  const modulesArr = Array.isArray(modules) ? modules : [];

  const today = new Date().toISOString().split("T")[0];
  const activeProjects = projectsArr.filter((p) =>
    ["PLANNING", "IN_PROGRESS", "CODE_REVIEW", "QA_TESTING"].includes(p.status),
  );
  const logsToday = logsArr.filter((l) =>
    (l.date || l.createdAt)?.startsWith(today),
  );

  // ── Mini Scoreboard helpers ──
  const allManagerIds = [
    ...new Set(projectsArr.flatMap((p) => p.managerIds || [])),
  ];
  const allTesterIds = [
    ...new Set(projectsArr.flatMap((p) => p.testerIds || [])),
  ];
  const allDevIds = [
    ...new Set(projectsArr.flatMap((p) => p.developerIds || [])),
  ];
  function miniScore(uid) {
    // 2 pts per daily log (max 40)
    const logPts = Math.min(
      logsArr.filter((l) => l.userId === uid).length * 2,
      40,
    );
    // 5 pts per completed module (DEV_COMPLETE or beyond), 10 pts if APPROVED/DEPLOYED
    const modPts = modulesArr
      .filter((m) => String(m.assignedTo) === String(uid))
      .reduce((sum, m) => {
        if (["APPROVED", "DEPLOYED"].includes(m.status)) return sum + 10;
        if (["DEV_COMPLETE", "CODE_REVIEW", "QA_TESTING"].includes(m.status)) return sum + 5;
        return sum;
      }, 0);
    // -5 pts per open/reopened bug assigned to them (max -30)
    const bugPen = Math.min(
      bugsArr.filter(
        (b) => b.assignedTo === uid && ["OPEN", "REOPENED"].includes(b.status),
      ).length * 5,
      30,
    );
    return Math.max(0, logPts + modPts - bugPen);
  }
  function topThree(ids) {
    return usersArr
      .filter((u) => ids.includes(u._id))
      .map((u) => ({ ...u, score: miniScore(u._id) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }
  const topPMs = topThree(allManagerIds);
  const topDevs = topThree(allDevIds);
  const topTesters = topThree(allTesterIds);
  // Overall top 3 across employees only (exclude admins and department heads)
  const topOverall = topThree(usersArr.filter((u) => u.globalRole === "employee").map((u) => u._id));
  const openBugs = bugsArr.filter((b) =>
    ["OPEN", "REOPENED"].includes(b.status),
  );
  const criticalBugs = openBugs.filter((b) => b.severity === "CRITICAL");

  const stats = [
    {
      icon: Users,
      label: "Total Users",
      value: usersArr.length,
      color: "text-primary",
      sub: `${usersArr.filter((u) => u.globalRole === "employee").length} employees`,
    },
    {
      icon: Building2,
      label: "Departments",
      value: deptsArr.length,
      color: "text-[#47c8ff]",
      sub: `${deptsArr.filter((d) => d.headId).length} with head`,
    },
    {
      icon: FolderKanban,
      label: "Active Projects",
      value: activeProjects.length,
      color: "text-[#c847ff]",
      sub: `${projectsArr.length} total`,
    },
    {
      icon: ClipboardList,
      label: "Logs Today",
      value: logsToday.length,
      color: "text-[#e8a847]",
      sub: `${usersArr.filter((u) => u.globalRole === "employee").length} total employees`,
    },
    {
      icon: Bug,
      label: "Open Bugs",
      value: openBugs.length,
      color: criticalBugs.length > 0 ? "text-[#ff4747]" : "text-[#47ff8a]",
      sub: `${criticalBugs.length} critical`,
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
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {stats.map(({ icon: Icon, label, value, color, sub }) => (
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
              {sub && (
                <p className="text-[10px] text-foreground-muted mt-1">{sub}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            {activeProjects.slice(0, 4).map((p) => (
              <div
                key={p._id}
                className="flex items-center justify-between px-5 py-3 hover:bg-surface-container transition-colors"
              >
                <p className="text-[12px] text-foreground font-medium">
                  {p.name}
                </p>
                <StatusBadge status={p.status} />
              </div>
            ))}
            {activeProjects.length === 0 && (
              <div className="flex items-center justify-center py-8 text-foreground-muted">
                <p className="text-[11px] tracking-[0.1em] uppercase">
                  No active projects
                </p>
              </div>
            )}
          </div>
        </div>

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
            {deptsArr.slice(0, 5).map((d) => (
              <div
                key={d._id}
                className="flex items-center justify-between px-5 py-3 hover:bg-surface-container transition-colors"
              >
                <p className="text-[12px] text-foreground font-medium">
                  {(d.departmentName || d.name || "").toUpperCase()}
                </p>
                <span className="text-[11px] text-foreground-muted">
                  {d.employeeCount || 0} members
                </span>
              </div>
            ))}
            {deptsArr.length === 0 && (
              <div className="flex items-center justify-center py-8 text-foreground-muted">
                <p className="text-[11px] tracking-[0.1em] uppercase">
                  No departments yet
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Employee Scoreboard — overall top 3 performers */}
        <div className="border border-outline bg-surface-low">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-outline">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#e8a847]" />
              <span className="text-[10px] tracking-[0.15em] uppercase font-bold text-foreground-muted">
                Top Performers
              </span>
            </div>
            <button
              onClick={() => router.push("/admin/daily-logs")}
              className="flex items-center gap-1 text-[10px] tracking-[0.1em] uppercase text-foreground-muted hover:text-primary transition-colors"
            >
              All Logs <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-outline">
            {topOverall.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-foreground-muted">
                <p className="text-[11px] tracking-[0.1em] uppercase">
                  No data yet
                </p>
              </div>
            ) : (
              topOverall.map((emp, i) => {
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
                const m = medals[i] || medals[2];
                return (
                  <div
                    key={emp._id}
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
                        {emp.score} pts
                      </p>
                    </div>
                    <span className={`text-lg font-bold ${m.color}`}>
                      {emp.score}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Critical Bugs */}
        <div className="border border-outline bg-surface-low">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-outline">
            <div className="flex items-center gap-2">
              <Bug className="w-4 h-4 text-[#ff4747]" />
              <span className="text-[10px] tracking-[0.15em] uppercase font-bold text-foreground-muted">
                Open Bugs
              </span>
            </div>
            <button
              onClick={() => router.push("/admin/projects")}
              className="flex items-center gap-1 text-[10px] tracking-[0.1em] uppercase text-foreground-muted hover:text-primary transition-colors"
            >
              Projects <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-outline">
            {openBugs.slice(0, 4).map((b) => {
              const proj = projectsArr.find((p) => p._id === b.projectId);
              return (
                <div
                  key={b._id}
                  className="flex items-center justify-between px-5 py-3 hover:bg-surface-container transition-colors"
                >
                  <div>
                    <p className="text-[12px] text-foreground">{b.title}</p>
                    <p className="text-[11px] text-foreground-muted">
                      {proj?.name || b.projectId}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] tracking-[0.1em] uppercase font-bold px-2 py-0.5 border ${
                      b.severity === "CRITICAL"
                        ? "text-[#ff4747] border-[#ff4747]/30 bg-[#ff4747]/10"
                        : b.severity === "HIGH"
                          ? "text-[#e8a847] border-[#e8a847]/30 bg-[#e8a847]/10"
                          : "text-foreground-muted border-foreground/15 bg-foreground/10"
                    }`}
                  >
                    {b.severity}
                  </span>
                </div>
              );
            })}
            {openBugs.length === 0 && (
              <div className="flex items-center justify-center gap-2 py-8 text-[#47ff8a]">
                <CheckCircle2 className="w-4 h-4" />
                <p className="text-[11px] tracking-[0.1em] uppercase">
                  No open bugs!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
