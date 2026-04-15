"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FolderKanban,
  CheckSquare,
  ClipboardList,
  Bug,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Circle,
  FlaskConical,
  Trophy,
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import AuthLoader from "@/components/AuthLoader";
import { getMyProjects } from "@/services/projectService";
import { getMyTasks, getTasks } from "@/services/taskService";
import { getMyLogs, getAllLogs } from "@/services/dailyLogService";
import {
  getMyBugs,
  getAllBugs,
  getBugsReportedByMe,
} from "@/services/bugService";
import { getMyTestResults, TESTING_PHASES } from "@/services/testingService";
import { StatsSkeleton } from "@/components/skeletons";

// ─── Color maps ────────────────────────────────────────────────
const STATUS_COLOR = {
  PLANNING: "text-foreground-muted  bg-foreground/10  border-foreground/10",
  IN_PROGRESS: "text-[#47c8ff] bg-[#47c8ff]/10 border-[#47c8ff]/20",
  CODE_REVIEW: "text-[#c847ff] bg-[#c847ff]/10 border-[#c847ff]/20",
  QA_TESTING: "text-[#e8a847] bg-[#e8a847]/10 border-[#e8a847]/20",
  DEPLOYED: "text-[#47ff8a] bg-[#47ff8a]/10 border-[#47ff8a]/20",
  TODO: "text-foreground-muted  bg-foreground/10  border-foreground/10",
  DEV_COMPLETE: "text-primary bg-primary/10 border-primary/20",
  APPROVED: "text-[#47ff8a] bg-[#47ff8a]/10 border-[#47ff8a]/20",
};

const PM_STATUS_META = {
  PLANNING: {
    label: "Planning",
    color: "text-foreground-muted",
    bg: "bg-foreground/5",
    border: "border-foreground/10",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "text-[#47c8ff]",
    bg: "bg-[#47c8ff]/10",
    border: "border-[#47c8ff]/20",
  },
  CODE_REVIEW: {
    label: "Code Review",
    color: "text-[#e8a847]",
    bg: "bg-[#e8a847]/10",
    border: "border-[#e8a847]/20",
  },
  QA_TESTING: {
    label: "QA Testing",
    color: "text-[#c847ff]",
    bg: "bg-[#c847ff]/10",
    border: "border-[#c847ff]/20",
  },
  APPROVED: {
    label: "Approved",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
  },
  DEPLOYED: {
    label: "Deployed",
    color: "text-[#47ff8a]",
    bg: "bg-[#47ff8a]/10",
    border: "border-[#47ff8a]/20",
  },
};

function StatusBadge({ status, usePM = false }) {
  if (usePM) {
    const m = PM_STATUS_META[status] || PM_STATUS_META.PLANNING;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] tracking-widest uppercase font-bold border ${m.bg} ${m.border} ${m.color}`}
      >
        <Circle className="w-1.5 h-1.5 fill-current" /> {m.label}
      </span>
    );
  }
  const cls =
    STATUS_COLOR[status] ||
    "text-foreground-muted bg-foreground/5 border-outline";
  return (
    <span
      className={`inline-flex px-2 py-0.5 text-[10px] tracking-widest uppercase font-bold border ${cls}`}
    >
      {status?.replace(/_/g, " ")}
    </span>
  );
}

export default function EmployeeDashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (
      !loading &&
      (!user ||
        !["employee", "project_manager", "developer", "tester"].includes(
          user?.role,
        ))
    ) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) return <AuthLoader />;

  const ROLE_LABEL = {
    project_manager: "Project Manager",
    developer: "Developer",
    tester: "Tester",
    employee: "Employee",
  };
  const roleLabel = ROLE_LABEL[user.role] ?? "Employee";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] tracking-[0.2em] uppercase text-foreground-muted mb-1">
          {roleLabel}
        </p>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Welcome back, <span className="text-primary">{user.name}</span>
        </h1>
      </div>

      {user.role === "project_manager" && (
        <PMDashboard user={user} router={router} />
      )}
      {user.role === "developer" && (
        <DeveloperDashboard user={user} router={router} />
      )}
      {user.role === "tester" && (
        <TesterDashboard user={user} router={router} />
      )}
      {user.role === "employee" && (
        <GenericEmployeeDashboard user={user} router={router} />
      )}
    </div>
  );
}

// ─── PM Dashboard ─────────────────────────────────────────────
function PMDashboard({ user, router }) {
  const [projects, setProjects] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [bugs, setBugs] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setDataLoading(true);
      const projs = await getMyProjects();
      setProjects(projs);
      const tasksResults = await Promise.allSettled(
        projs.map((p) => getTasks(p._id)),
      );
      setAllTasks(
        tasksResults
          .filter((r) => r.status === "fulfilled")
          .flatMap((r) => r.value),
      );
      const b = await getAllBugs().catch(() => []);
      setBugs(b.filter((bg) => projs.some((p) => p._id === bg.projectId)));
    } catch {
      setError("Could not load dashboard data.");
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeProjects = projects.filter((p) => p.status !== "DEPLOYED");
  const pendingReview = allTasks.filter((t) => t.status === "IN_REVIEW");
  const openBugs = bugs.filter((b) => ["OPEN", "REOPENED"].includes(b.status));

  const stats = [
    {
      icon: FolderKanban,
      label: "My Projects",
      value: projects.length,
      color: "text-primary",
    },
    {
      icon: CheckSquare,
      label: "Pending Review",
      value: pendingReview.length,
      color: "text-[#e8a847]",
    },
    {
      icon: Clock,
      label: "Active Projects",
      value: activeProjects.length,
      color: "text-[#47c8ff]",
    },
    {
      icon: Bug,
      label: "Open Bugs",
      value: openBugs.length,
      color: openBugs.length > 0 ? "text-[#ff4747]" : "text-[#47ff8a]",
    },
  ];

  return (
    <>
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 border border-[#ff4747]/30 bg-[#ff4747]/5 text-[#ff4747]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-[12px]">{error}</span>
        </div>
      )}
      {dataLoading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-outline bg-surface-low">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-outline">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-primary" />
              <span className="text-[10px] tracking-[0.15em] uppercase font-bold text-foreground-muted">
                My Projects
              </span>
            </div>
            <button
              onClick={() => router.push("/employee/projects")}
              className="flex items-center gap-1 text-[10px] tracking-widest uppercase text-foreground-muted hover:text-primary transition-colors"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-outline">
            {projects.slice(0, 5).map((p) => (
              <div
                key={p._id}
                className="flex items-center justify-between px-5 py-3 hover:bg-surface-container transition-colors"
              >
                <p className="text-[12px] text-foreground font-medium">
                  {p.name}
                </p>
                <StatusBadge status={p.status} usePM />
              </div>
            ))}
            {projects.length === 0 && (
              <div className="flex items-center justify-center py-8 text-foreground-muted">
                <p className="text-[11px] tracking-widest uppercase">
                  No projects assigned
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="border border-outline bg-surface-low">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-outline">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#e8a847]" />
              <span className="text-[10px] tracking-[0.15em] uppercase font-bold text-foreground-muted">
                Pending Review
              </span>
            </div>
            <button
              onClick={() => router.push("/employee/tasks")}
              className="flex items-center gap-1 text-[10px] tracking-widest uppercase text-foreground-muted hover:text-primary transition-colors"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-outline">
            {pendingReview.slice(0, 5).map((t) => (
              <div
                key={t._id}
                className="flex items-center justify-between px-5 py-3 hover:bg-surface-container transition-colors"
              >
                <p className="text-[12px] text-foreground font-medium">
                  {t.title}
                </p>
                <StatusBadge status={t.status} usePM />
              </div>
            ))}
            {pendingReview.length === 0 && (
              <div className="flex items-center justify-center gap-2 py-8 text-[#47ff8a]">
                <CheckCircle2 className="w-4 h-4" />
                <p className="text-[11px] tracking-widest uppercase">
                  All tasks reviewed!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Shared: Top 3 Performers ────────────────────────────────
function TopPerformersCard({ performers }) {
  const medals = [
    {
      color: "text-[#e8a847]",
      bg: "bg-[#e8a847]/10",
      border: "border-[#e8a847]/30",
      label: "1st",
    },
    {
      color: "text-[#b0b0b0]",
      bg: "bg-foreground/5",
      border: "border-foreground/15",
      label: "2nd",
    },
    {
      color: "text-[#c47a3a]",
      bg: "bg-[#c47a3a]/10",
      border: "border-[#c47a3a]/30",
      label: "3rd",
    },
  ];
  return (
    <div className="border border-outline bg-surface-low">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-outline">
        <Trophy className="w-4 h-4 text-[#e8a847]" />
        <span className="text-[10px] tracking-[0.15em] uppercase font-bold text-foreground-muted">
          Top Performers This Week
        </span>
      </div>
      <div className="divide-y divide-outline">
        {performers.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-foreground-muted">
            <p className="text-[11px] tracking-widest uppercase">
              No top performers this week
            </p>
          </div>
        ) : (
          performers.map((p, i) => {
            const m = medals[i] || medals[2];
            return (
              <div
                key={p.userId}
                className="flex items-center gap-4 px-5 py-3 hover:bg-surface-container transition-colors"
              >
                <span
                  className={`text-[11px] font-bold tracking-widest uppercase px-2 py-0.5 border ${m.color} ${m.bg} ${m.border}`}
                >
                  {m.label}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-foreground font-medium truncate">
                    {p.userName}
                  </p>
                  <p className="text-[10px] text-foreground-muted mt-0.5">
                    {p.count} log{p.count !== 1 ? "s" : ""} submitted
                  </p>
                </div>
                <span className={`text-xl font-bold ${m.color}`}>
                  {p.count}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Developer Dashboard ──────────────────────────────────────
function DeveloperDashboard({ user, router }) {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [bugs, setBugs] = useState([]);
  const [performers, setPerformers] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setDataLoading(true);
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const [pR, mR, lR, bR, allLogsR] = await Promise.allSettled([
        getMyProjects(),
        getMyTasks(user?._id),
        getMyLogs(),
        getMyBugs(),
        getAllLogs(),
      ]);
      const p = pR.status === "fulfilled" ? pR.value : [];
      const m = mR.status === "fulfilled" ? mR.value : [];
      const l = lR.status === "fulfilled" ? lR.value : [];
      const b = bR.status === "fulfilled" ? bR.value : [];
      const allWeekLogs = allLogsR.status === "fulfilled" ? allLogsR.value : [];
      setProjects(p);
      setTasks(m);
      setLogs(l);
      setBugs(b);
      const thisWeek = allWeekLogs.filter(
        (lg) => new Date(lg.date || lg.createdAt) >= weekStart,
      );
      const countMap = {};
      thisWeek.forEach((lg) => {
        if (!countMap[lg.userId])
          countMap[lg.userId] = {
            userId: lg.userId,
            userName: lg.userName,
            count: 0,
          };
        countMap[lg.userId].count++;
      });
      setPerformers(
        Object.values(countMap)
          .sort((a, b) => b.count - a.count)
          .slice(0, 3),
      );
    } catch {
      setError("Could not load dashboard data.");
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const pendingTasks = tasks.filter((m) => !m.status === "DONE");
  const openBugs = bugs.filter((b) =>
    ["OPEN", "REOPENED", "IN_PROGRESS"].includes(b.status),
  );
  const logsThisWeek = logs.filter((l) => {
    const d = new Date(l.date || l.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo;
  });

  const stats = [
    {
      icon: FolderKanban,
      label: "My Projects",
      value: projects.length,
      color: "text-primary",
    },
    {
      icon: CheckSquare,
      label: "pendingTasks",
      value: pendingTasks.length,
      color: "text-[#e8a847]",
    },
    {
      icon: ClipboardList,
      label: "Logs This Week",
      value: logsThisWeek.length,
      color: "text-[#47c8ff]",
    },
    {
      icon: Bug,
      label: "Open Bugs",
      value: openBugs.length,
      color: openBugs.length > 0 ? "text-[#ff4747]" : "text-[#47ff8a]",
    },
  ];

  return (
    <>
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 border border-[#ff4747]/30 bg-[#ff4747]/5 text-[#ff4747]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-[12px]">{error}</span>
        </div>
      )}
      {dataLoading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-outline bg-surface-low">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-outline">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-primary" />
              <span className="text-[10px] tracking-[0.15em] uppercase font-bold text-foreground-muted">
                My Projects
              </span>
            </div>
            <button
              onClick={() => router.push("/employee/projects")}
              className="flex items-center gap-1 text-[10px] tracking-widest uppercase text-foreground-muted hover:text-primary transition-colors"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-outline">
            {projects.slice(0, 4).map((p) => (
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
            {projects.length === 0 && (
              <div className="flex items-center justify-center py-8 text-foreground-muted">
                <p className="text-[11px] tracking-widest uppercase">
                  No projects assigned yet
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="border border-outline bg-surface-low">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-outline">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#e8a847]" />
              <span className="text-[10px] tracking-[0.15em] uppercase font-bold text-foreground-muted">
                Pending Tasks
              </span>
            </div>
            <button
              onClick={() => router.push("/employee/tasks")}
              className="flex items-center gap-1 text-[10px] tracking-widest uppercase text-foreground-muted hover:text-primary transition-colors"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-outline">
            {pendingTasks.slice(0, 4).map((m) => (
              <div
                key={m._id}
                className="flex items-center justify-between px-5 py-3 hover:bg-surface-container transition-colors"
              >
                <p className="text-[12px] text-foreground font-medium">
                  {m.title}
                </p>
                <StatusBadge status={m.status} />
              </div>
            ))}
            {pendingTasks.length === 0 && (
              <div className="flex items-center justify-center gap-2 py-8 text-[#47ff8a]">
                <CheckCircle2 className="w-4 h-4" />
                <p className="text-[11px] tracking-widest uppercase">
                  All tasks up to date!
                </p>
              </div>
            )}
          </div>
        </div>
        <TopPerformersCard performers={performers} />
        <div className="border border-outline bg-surface-low">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-outline">
            <div className="flex items-center gap-2">
              <Bug className="w-4 h-4 text-[#ff4747]" />
              <span className="text-[10px] tracking-[0.15em] uppercase font-bold text-foreground-muted">
                Open Bugs
              </span>
            </div>
            <button
              onClick={() => router.push("/employee/bugs")}
              className="flex items-center gap-1 text-[10px] tracking-widest uppercase text-foreground-muted hover:text-primary transition-colors"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-outline">
            {openBugs.slice(0, 4).map((b) => (
              <div
                key={b._id}
                className="flex items-center justify-between px-5 py-3 hover:bg-surface-container transition-colors"
              >
                <p className="text-[12px] text-foreground font-medium">
                  {b.title}
                </p>
                <span
                  className={`text-[10px] tracking-widest uppercase font-bold px-2 py-0.5 border ${
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
            ))}
            {openBugs.length === 0 && (
              <div className="flex items-center justify-center gap-2 py-8 text-[#47ff8a]">
                <CheckCircle2 className="w-4 h-4" />
                <p className="text-[11px] tracking-widest uppercase">
                  No open bugs — great work!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Tester Dashboard ─────────────────────────────────────────
function TesterDashboard({ user, router }) {
  const [projects, setProjects] = useState([]);
  const [bugs, setBugs] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setDataLoading(true);
      const [pR, bR] = await Promise.allSettled([
        getMyProjects(),
        getBugsReportedByMe(),
      ]);
      const projs = pR.status === "fulfilled" ? pR.value : [];
      setProjects(projs.filter((proj) => proj.testerIds?.includes(user._id)));
      setBugs(bR.status === "fulfilled" ? bR.value : []);
    } catch {
      setError("Could not load dashboard data.");
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const qaProjects = projects.filter((p) => p.status === "QA_TESTING");
  const openBugs = bugs.filter((b) =>
    ["OPEN", "REOPENED", "IN_PROGRESS"].includes(b.status),
  );
  const resolvedBugs = bugs.filter((b) => b.status === "RESOLVED");

  const stats = [
    {
      icon: FolderKanban,
      label: "My Projects",
      value: projects.length,
      color: "text-primary",
    },
    {
      icon: FlaskConical,
      label: "In QA Testing",
      value: qaProjects.length,
      color: "text-[#c847ff]",
    },
    {
      icon: Bug,
      label: "Bugs Reported",
      value: bugs.length,
      color: "text-[#ff4747]",
    },
    {
      icon: CheckCircle2,
      label: "Resolved Bugs",
      value: resolvedBugs.length,
      color: "text-[#47ff8a]",
    },
  ];

  return (
    <>
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 border border-[#ff4747]/30 bg-[#ff4747]/5 text-[#ff4747]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-[12px]">{error}</span>
        </div>
      )}
      {dataLoading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-outline bg-surface-low">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-outline">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-[#c847ff]" />
              <span className="text-[10px] tracking-[0.15em] uppercase font-bold text-foreground-muted">
                QA Projects
              </span>
            </div>
            <button
              onClick={() => router.push("/employee/projects")}
              className="flex items-center gap-1 text-[10px] tracking-widest uppercase text-foreground-muted hover:text-primary transition-colors"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-outline">
            {projects.slice(0, 5).map((p) => (
              <div
                key={p._id}
                className="flex items-center justify-between px-5 py-3 hover:bg-surface-container transition-colors"
              >
                <p className="text-[12px] text-foreground font-medium">
                  {p.name}
                </p>
                <StatusBadge status={p.status} usePM />
              </div>
            ))}
            {projects.length === 0 && (
              <div className="flex items-center justify-center py-8 text-foreground-muted">
                <p className="text-[11px] tracking-widest uppercase">
                  No projects assigned
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="border border-outline bg-surface-low">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-outline">
            <div className="flex items-center gap-2">
              <Bug className="w-4 h-4 text-[#ff4747]" />
              <span className="text-[10px] tracking-[0.15em] uppercase font-bold text-foreground-muted">
                Recent Bugs
              </span>
            </div>
            <button
              onClick={() => router.push("/employee/bugs")}
              className="flex items-center gap-1 text-[10px] tracking-widest uppercase text-foreground-muted hover:text-primary transition-colors"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-outline">
            {bugs.slice(0, 5).map((b) => (
              <div
                key={b._id}
                className="flex items-center justify-between px-5 py-3 hover:bg-surface-container transition-colors"
              >
                <div>
                  <p className="text-[12px] text-foreground font-medium">
                    {b.title}
                  </p>
                  <p className="text-[10px] text-foreground-muted mt-0.5">
                    {b.projectName}
                  </p>
                </div>
                <span
                  className={`text-[10px] tracking-widest uppercase font-bold px-2 py-0.5 border ${
                    b.severity === "CRITICAL"
                      ? "text-[#ff4747] border-[#ff4747]/30 bg-[#ff4747]/10"
                      : b.severity === "HIGH"
                        ? "text-[#f87343] border-[#f87343]/30 bg-[#f87343]/10"
                        : b.severity === "MEDIUM"
                          ? "text-[#e8a847] border-[#e8a847]/30 bg-[#e8a847]/10"
                          : "text-[#47c8ff] border-[#47c8ff]/30 bg-[#47c8ff]/10"
                  }`}
                >
                  {b.severity}
                </span>
              </div>
            ))}
            {bugs.length === 0 && (
              <div className="flex items-center justify-center py-8 text-foreground-muted">
                <p className="text-[11px] tracking-widest uppercase">
                  No bugs reported yet
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="border border-outline bg-surface-low lg:col-span-2">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-outline">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="text-[10px] tracking-[0.15em] uppercase font-bold text-foreground-muted">
                Testing Phases
              </span>
            </div>
            <button
              onClick={() => router.push("/employee/testing")}
              className="flex items-center gap-1 text-[10px] tracking-widest uppercase text-foreground-muted hover:text-primary transition-colors"
            >
              Manage Tests <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-outline">
            {TESTING_PHASES.map((phase) => (
              <div key={phase.key} className="px-5 py-4 text-center">
                <p className="text-[10px] tracking-widest uppercase text-foreground-muted mb-1">
                  {phase.label}
                </p>
                <p className="text-lg font-bold text-foreground">
                  {phase.weight}%
                </p>
                <p className="text-[9px] tracking-widest uppercase text-foreground-muted mt-0.5">
                  weight
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Generic Employee Dashboard ───────────────────────────────
function GenericEmployeeDashboard({ user, router }) {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [bugs, setBugs] = useState([]);
  const [performers, setPerformers] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setDataLoading(true);
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const [pR, mR, lR, bR, allLogsR] = await Promise.allSettled([
        getMyProjects(),
        getMyTasks(user?._id),
        getMyLogs(),
        getMyBugs(),
        getAllLogs(),
      ]);
      const p = pR.status === "fulfilled" ? pR.value : [];
      const m = mR.status === "fulfilled" ? mR.value : [];
      const l = lR.status === "fulfilled" ? lR.value : [];
      const b = bR.status === "fulfilled" ? bR.value : [];
      const allWeekLogs = allLogsR.status === "fulfilled" ? allLogsR.value : [];
      setProjects(p);
      setTasks(m);
      setLogs(l);
      setBugs(b);
      const thisWeek = allWeekLogs.filter(
        (lg) => new Date(lg.date || lg.createdAt) >= weekStart,
      );
      const countMap = {};
      thisWeek.forEach((lg) => {
        if (!countMap[lg.userId])
          countMap[lg.userId] = {
            userId: lg.userId,
            userName: lg.userName,
            count: 0,
          };
        countMap[lg.userId].count++;
      });
      setPerformers(
        Object.values(countMap)
          .sort((a, b) => b.count - a.count)
          .slice(0, 3),
      );
    } catch {
      setError("Could not load dashboard data.");
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const pendingTasks = tasks.filter((m) => !m.status === "DONE");
  const openBugs = bugs.filter((b) =>
    ["OPEN", "REOPENED", "IN_PROGRESS"].includes(b.status),
  );
  const logsThisWeek = logs.filter((l) => {
    const d = new Date(l.date || l.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo;
  });

  const stats = [
    {
      icon: FolderKanban,
      label: "My Projects",
      value: projects.length,
      color: "text-primary",
    },
    {
      icon: CheckSquare,
      label: "pendingTasks",
      value: pendingTasks.length,
      color: "text-[#e8a847]",
    },
    {
      icon: ClipboardList,
      label: "Logs This Week",
      value: logsThisWeek.length,
      color: "text-[#47c8ff]",
    },
    {
      icon: Bug,
      label: "Open Bugs",
      value: openBugs.length,
      color: openBugs.length > 0 ? "text-[#ff4747]" : "text-[#47ff8a]",
    },
  ];

  return (
    <>
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 border border-[#ff4747]/30 bg-[#ff4747]/5 text-[#ff4747]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-[12px]">{error}</span>
        </div>
      )}
      {dataLoading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-outline bg-surface-low">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-outline">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-primary" />
              <span className="text-[10px] tracking-[0.15em] uppercase font-bold text-foreground-muted">
                My Projects
              </span>
            </div>
            <button
              onClick={() => router.push("/employee/projects")}
              className="flex items-center gap-1 text-[10px] tracking-widest uppercase text-foreground-muted hover:text-primary transition-colors"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-outline">
            {projects.slice(0, 4).map((p) => (
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
            {projects.length === 0 && (
              <div className="flex items-center justify-center py-8 text-foreground-muted">
                <p className="text-[11px] tracking-widest uppercase">
                  No projects assigned yet
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="border border-outline bg-surface-low">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-outline">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#e8a847]" />
              <span className="text-[10px] tracking-[0.15em] uppercase font-bold text-foreground-muted">
                pendingTasks
              </span>
            </div>
            <span className="text-[10px] tracking-widest uppercase text-foreground-muted">
              {pendingTasks.length} task
              {pendingTasks.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="divide-y divide-outline">
            {pendingTasks.slice(0, 4).map((m) => (
              <div
                key={m._id}
                className="flex items-center justify-between px-5 py-3 hover:bg-surface-container transition-colors"
              >
                <p className="text-[12px] text-foreground font-medium">
                  {m.title}
                </p>
                <StatusBadge status={m.status} />
              </div>
            ))}
            {pendingTasks.length === 0 && (
              <div className="flex items-center justify-center gap-2 py-8 text-[#47ff8a]">
                <CheckCircle2 className="w-4 h-4" />
                <p className="text-[11px] tracking-widest uppercase">
                  All tasks up to date!
                </p>
              </div>
            )}
          </div>
        </div>
        <TopPerformersCard performers={performers} />
        <div className="border border-outline bg-surface-low">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-outline">
            <div className="flex items-center gap-2">
              <Bug className="w-4 h-4 text-[#ff4747]" />
              <span className="text-[10px] tracking-[0.15em] uppercase font-bold text-foreground-muted">
                My Open Bugs
              </span>
            </div>
            <button
              onClick={() => router.push("/employee/bugs")}
              className="flex items-center gap-1 text-[10px] tracking-widest uppercase text-foreground-muted hover:text-primary transition-colors"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-outline">
            {openBugs.slice(0, 4).map((b) => (
              <div
                key={b._id}
                className="flex items-center justify-between px-5 py-3 hover:bg-surface-container transition-colors"
              >
                <p className="text-[12px] text-foreground font-medium">
                  {b.title}
                </p>
                <span
                  className={`text-[10px] tracking-widest uppercase font-bold px-2 py-0.5 border ${
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
            ))}
            {openBugs.length === 0 && (
              <div className="flex items-center justify-center gap-2 py-8 text-[#47ff8a]">
                <CheckCircle2 className="w-4 h-4" />
                <p className="text-[11px] tracking-widest uppercase">
                  No open bugs — great work!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
