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

// ─── Status Meta ─────────────────────────────────────────────
const STATUS_META = {
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

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.PLANNING;
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
  const [loading, setLoading] = useState(true);
  const [projectStatuses, setProjectStatuses] = useState({});

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "department_head")) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  const loadData = useCallback(async () => {
    try {
      const [pR, lR, bR] = await Promise.allSettled([
        getProjects(),
        getAllLogs(),
        getAllBugs(),
      ]);
      setProjects(pR.status === "fulfilled" ? pR.value : []);
      setLogs(lR.status === "fulfilled" ? lR.value : []);
      setBugs(bR.status === "fulfilled" ? bR.value : []);
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
    (p) => p?.status !== "DEPLOYED",
  );
  const deployedProjects = (projects || []).filter(
    (p) => p?.status === "DEPLOYED",
  );
  const openBugs = (bugs || []).filter((b) =>
    ["OPEN", "REOPENED"].includes(b?.status),
  );
  const today = new Date().toISOString().split("T")[0];
  const todayLogs = (logs || []).filter((l) => l?.logDate === today);
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
        <p className="hidden sm:block text-[10px] tracking-[0.15em] uppercase text-foreground-muted">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Projects"
          value={activeProjects.length}
          sub={`${deployedProjects.length} deployed`}
          icon={FolderKanban}
          accent="text-[#47c8ff]"
        />
        <StatCard
          label="Open Bugs"
          value={openBugs.length}
          sub="Across all projects"
          icon={AlertCircle}
          accent="text-[#ff4747]"
        />
        <StatCard
          label="Logs Today"
          value={todayLogs.length}
          sub="Work entries submitted"
          icon={Clock}
          accent="text-[#e8a847]"
        />
        <StatCard
          label="Deployed"
          value={deployedProjects.length}
          sub="Projects completed"
          icon={CheckCircle2}
          accent="text-[#47ff8a]"
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

      {/* Open Bugs + Today's Logs */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="border border-outline bg-surface-low">
          <div className="flex items-center justify-between px-6 py-4 border-b border-outline">
            <span className="text-[11px] tracking-[0.2em] uppercase font-bold text-foreground">
              Open Bugs
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
              Today&apos;s Logs
            </span>
          </div>
          <div className="divide-y divide-outline">
            {todayLogs.slice(0, 4).map((log) => (
              <div
                key={log._id}
                className="px-6 py-3.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Users className="w-2.5 h-2.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[12px] text-foreground font-medium">
                      {log.userName}
                    </p>
                    <p className="text-[10px] text-foreground-muted">
                      {log.projectName}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {todayLogs.length === 0 && (
              <div className="flex items-center justify-center py-8 text-foreground-muted">
                <p className="text-[12px] tracking-[0.1em] uppercase">
                  No logs today
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
