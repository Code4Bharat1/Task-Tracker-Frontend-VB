"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  Trophy,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Circle,
  Users,
  CheckCircle2,
  Bug,
  Clock,
  ClipboardList,
  Pencil,
} from "lucide-react";
import { TableSkeleton, HeaderSkeleton } from "@/components/skeletons";
import { getProjects } from "@/services/projectService";
import { getUsers, updateUser } from "@/services/userService";
import { getAllLogs } from "@/services/dailyLogService";
import { getAllBugs } from "@/services/bugService";
import { getModules } from "@/services/moduleService";

// ─── Period filter helper ─────────────────────────────────────
const PERIODS = [
  { key: "all", label: "All Time" },
  { key: "weekly", label: "Weekly", days: 7 },
  { key: "monthly", label: "Monthly", days: 30 },
  { key: "quarterly", label: "Quarterly", days: 90 },
];

function getDateThreshold(periodKey) {
  const period = PERIODS.find((p) => p.key === periodKey);
  if (!period || !period.days) return null;
  const d = new Date();
  d.setDate(d.getDate() - period.days);
  return d;
}

// ─── Score calculation ─────────────────────────────────────────
// SRS §14 — Performance Scoreboard metrics
function calcScore({
  logsCount,
  bugsCount,
  modulesCompleted,
  modulesTotal,
  reworkCount,
}) {
  // Scoring: each metric weighted
  const logScore = Math.min(logsCount * 2, 40); // max 40 pts
  const bugPenalty = Math.min(bugsCount * 5, 30); // up to -30
  const moduleScore =
    modulesTotal > 0 ? Math.round((modulesCompleted / modulesTotal) * 40) : 0;
  const reworkPenalty = Math.min(reworkCount * 3, 20); // up to -20
  return Math.max(0, logScore + moduleScore - bugPenalty - reworkPenalty);
}

function ScoreBadge({ score }) {
  const cls =
    score >= 80
      ? "text-[#47ff8a] bg-[#47ff8a]/10 border-[#47ff8a]/20"
      : score >= 60
        ? "text-primary bg-primary/10 border-primary/20"
        : score >= 40
          ? "text-[#e8a847] bg-[#e8a847]/10 border-[#e8a847]/20"
          : "text-[#ff4747] bg-[#ff4747]/10 border-[#ff4747]/20";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] tracking-[0.1em] uppercase font-bold border ${cls}`}
    >
      {score} pts
    </span>
  );
}

function MetricChip({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className={`w-3 h-3 ${color}`} />
      <span className="text-[10px] text-foreground-muted">{label}:</span>
      <span className={`text-[11px] font-bold ${color}`}>{value}</span>
    </div>
  );
}

function ScoreboardSkeleton() {
  return (
    <div className="space-y-6">
      <HeaderSkeleton hasButton={false} />
      <TableSkeleton rows={6} cols={6} />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function ScoreboardPage() {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [bugs, setBugs] = useState([]);
  const [allModules, setAllModules] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [behaviourScores, setBehaviourScores] = useState({});
  const [editingBehaviourId, setEditingBehaviourId] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersR, logsR, bugsR, projectsR] = await Promise.allSettled([
        getUsers(),
        getAllLogs(),
        getAllBugs(),
        getProjects(),
      ]);
      const usersData = usersR.status === "fulfilled" ? usersR.value : [];
      const logsData = logsR.status === "fulfilled" ? logsR.value : [];
      const bugsData = bugsR.status === "fulfilled" ? bugsR.value : [];
      const projectsData =
        projectsR.status === "fulfilled" ? projectsR.value : [];
      setUsers(usersData);
      // initialize behaviour scores from server if present
      const initialBehaviour = {};
      usersData.forEach((u) => {
        if (u.behaviourScore !== undefined && u.behaviourScore !== null) {
          initialBehaviour[u._id] = u.behaviourScore;
        }
      });
      setBehaviourScores(initialBehaviour);
      setLogs(logsData);
      setBugs(bugsData);
      setProjects(projectsData);

      // Load all modules
      const modulesResults = await Promise.allSettled(
        projectsData.map((p) => getModules(p._id)),
      );
      setAllModules(
        modulesResults
          .filter((r) => r.status === "fulfilled")
          .flatMap((r) => r.value),
      );
    } catch {
      setError("Failed to load scoreboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Persist behaviour score to server
  const saveBehaviourScore = async (userId) => {
    const val = behaviourScores[userId];
    if (val === undefined || val === "" || isNaN(Number(val))) return;
    try {
      const updated = await updateUser(userId, { behaviourScore: Number(val) });
      // update local caches with persisted value
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId
            ? { ...u, behaviourScore: updated.behaviourScore ?? Number(val) }
            : u,
        ),
      );
      setBehaviourScores((prev) => ({
        ...prev,
        [userId]: updated.behaviourScore ?? Number(val),
      }));
    } catch (err) {
      console.error("Failed to save behaviour score", err);
    }
  };

  if (loading) return <ScoreboardSkeleton />;

  // Build scoreboard: only include employees
  const employees = users.filter((u) => u.globalRole === "employee");
  const threshold = getDateThreshold(filterPeriod);

  const scoreboard = employees
    .map((u) => {
      const userLogs = logs.filter(
        (l) =>
          l.userId === u._id && (!threshold || new Date(l.date) >= threshold),
      );
      const userBugs = bugs.filter(
        (b) =>
          b.assignedTo === u._id &&
          (!threshold || new Date(b.created_at) >= threshold),
      );
      const openBugs = userBugs.filter((b) =>
        ["OPEN", "REOPENED"].includes(b.status),
      ).length;
      const userModules = allModules.filter((m) => m.assignedTo === u._id);
      const completed = userModules.filter((m) =>
        ["APPROVED", "DEPLOYED"].includes(m.status),
      ).length;
      const reworks = userModules.filter(
        (m) => m.status === "CODE_REVIEW",
      ).length; // proxy for rework

      const score = calcScore({
        logsCount: userLogs.length,
        bugsCount: openBugs,
        modulesCompleted: completed,
        modulesTotal: userModules.length,
        reworkCount: reworks,
      });

      return {
        ...u,
        logsCount: userLogs.length,
        openBugs,
        totalBugs: userBugs.length,
        completed,
        totalModules: userModules.length,
        reworks,
        score,
      };
    })
    .sort((a, b) => b.score - a.score);

  const topScore = scoreboard[0]?.score || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-foreground-muted mb-1">
            Department
          </p>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Performance Scoreboard
          </h1>
        </div>
      </div>

      {/* Metric Legend */}
      <div className="border border-outline bg-surface-low px-6 py-4">
        <div className="flex flex-wrap gap-6 text-[11px]">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-3.5 h-3.5 text-[#47c8ff]" />
            <span className="text-foreground-muted">
              Work Log Discipline: +2 pts per log (max 40)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#47ff8a]" />
            <span className="text-foreground-muted">
              Module Completion: up to 40 pts
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Bug className="w-3.5 h-3.5 text-[#ff4747]" />
            <span className="text-foreground-muted">
              Open Bugs: -5 pts each (max -30)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="w-3.5 h-3.5 text-[#e8a847]" />
            <span className="text-foreground-muted">
              Rework Rate: -3 pts each (max -20)
            </span>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 border border-[#ff4747]/30 bg-[#ff4747]/5 text-[#ff4747]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-[12px]">{error}</span>
        </div>
      )}

      {/* Scoreboard Table */}
      <div className="overflow-x-auto">
        <div className="border border-outline bg-surface-low min-w-175">
          <div className="grid grid-cols-[40px_2fr_1fr_1fr_1fr_90px_120px] gap-4 px-6 py-3 border-b border-outline bg-surface-container">
            {[
              "#",
              "Employee",
              "Logs",
              "Modules",
              "Bugs",
              "Behaviour",
              "Score",
            ].map((h) => (
              <span
                key={h}
                className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted font-bold"
              >
                {h}
              </span>
            ))}
          </div>

          {scoreboard.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-foreground-muted">
              <p className="text-[12px] tracking-[0.1em] uppercase">
                No employee data available
              </p>
            </div>
          ) : (
            <div className="divide-y divide-outline">
              {scoreboard.map((emp, idx) => {
                const isTop = idx === 0;
                const isBottom =
                  idx === scoreboard.length - 1 && scoreboard.length > 1;
                const barWidth =
                  topScore > 0 ? Math.round((emp.score / topScore) * 100) : 0;
                return (
                  <div
                    key={emp._id}
                    className={`grid grid-cols-[40px_2fr_1fr_1fr_1fr_90px_120px] gap-4 px-6 py-4 items-center transition-colors ${isTop ? "bg-[#47ff8a]/3" : "hover:bg-surface-container"}`}
                  >
                    {/* Rank */}
                    <div
                      className={`flex items-center justify-center w-7 h-7 text-[11px] font-bold border ${
                        idx === 0
                          ? "border-[#e8a847]/40 text-[#e8a847] bg-[#e8a847]/10"
                          : idx === 1
                            ? "border-foreground/20 text-foreground-muted bg-foreground/10"
                            : idx === 2
                              ? "border-[#f87343]/40 text-[#f87343] bg-[#f87343]/10"
                              : "border-outline text-foreground-muted"
                      }`}
                    >
                      {idx === 0 ? <Trophy className="w-3 h-3" /> : idx + 1}
                    </div>
                    {/* Employee */}
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <Users className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <p className="text-[13px] font-semibold text-foreground">
                        {emp.name}
                      </p>
                    </div>
                    {/* Logs */}
                    <MetricChip
                      icon={ClipboardList}
                      label="Logs"
                      value={emp.logsCount}
                      color="text-[#47c8ff]"
                    />
                    {/* Modules */}
                    <MetricChip
                      icon={CheckCircle2}
                      label="Done"
                      value={`${emp.completed}/${emp.totalModules}`}
                      color="text-[#47ff8a]"
                    />
                    {/* Bugs */}
                    <MetricChip
                      icon={Bug}
                      label="Open"
                      value={emp.openBugs}
                      color={
                        emp.openBugs > 0 ? "text-[#ff4747]" : "text-[#47ff8a]"
                      }
                    />
                    {/* Behaviour Score */}
                    <div className="flex items-center gap-1.5">
                      {editingBehaviourId === emp._id ? (
                        <input
                          type="number"
                          min={0}
                          max={100}
                          autoFocus
                          value={behaviourScores[emp._id] ?? ""}
                          onChange={(e) =>
                            setBehaviourScores((prev) => ({
                              ...prev,
                              [emp._id]: e.target.value,
                            }))
                          }
                          onBlur={async () => {
                            await saveBehaviourScore(emp._id);
                            setEditingBehaviourId(null);
                          }}
                          onKeyDown={async (e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              await saveBehaviourScore(emp._id);
                              setEditingBehaviourId(null);
                            }
                          }}
                          placeholder="0"
                          className="input-number-themed w-16 bg-surface-container border border-primary px-2 py-1.5 text-[12px] text-foreground text-center focus:outline-none transition-colors"
                        />
                      ) : (
                        <button
                          onClick={() => setEditingBehaviourId(emp._id)}
                          className="flex items-center gap-1.5 group/beh"
                        >
                          <Pencil className="w-3 h-3 text-foreground-muted group-hover/beh:text-primary transition-colors" />
                          <span className="text-[12px] text-foreground font-bold">
                            {behaviourScores[emp._id] !== undefined &&
                            behaviourScores[emp._id] !== "" ? (
                              behaviourScores[emp._id]
                            ) : (
                              <span className="text-foreground-muted">—</span>
                            )}
                          </span>
                        </button>
                      )}
                    </div>
                    {/* Score */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <ScoreBadge score={emp.score} />
                      </div>
                      <div className="h-1 bg-surface-high w-full">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <p className="text-[10px] tracking-[0.1em] uppercase text-foreground-muted">
        Scores are calculated in real-time from logs, modules, and bug data.
      </p>
    </div>
  );
}
