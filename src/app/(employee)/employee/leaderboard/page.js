"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  Trophy,
  AlertCircle,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { TableSkeleton, HeaderSkeleton } from "@/components/skeletons";
import { getLeaderboard } from "@/services/userService";
import { useAuth } from "@/lib/auth/context";

const PERIODS = [
  { key: "all", label: "All Time" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "quarterly", label: "Quarterly" },
];

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

export default function EmployeeLeaderboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [deptAvg, setDeptAvg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterPeriod, setFilterPeriod] = useState("all");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getLeaderboard(filterPeriod);
      setData(result.data || []);
      setDeptAvg(result.departmentAverage || 0);
    } catch {
      setError("Failed to load leaderboard. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [filterPeriod]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <HeaderSkeleton hasButton={false} />
        <TableSkeleton rows={6} cols={5} />
      </div>
    );
  }

  const topScore = data[0]?.score || 0;
  const myEntry = data.find((e) => e.userId === user?._id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-foreground-muted mb-1">
            Department
          </p>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Leaderboard
          </h1>
        </div>
      </div>

      {/* My Score + Department Average */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="border border-outline bg-surface-low px-6 py-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-primary/10 border border-primary/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted">
              Your Score
            </p>
            <p className="text-xl font-bold text-foreground">
              {myEntry?.score ?? 0}{" "}
              <span className="text-[11px] text-foreground-muted font-normal">
                pts {myEntry ? `(Rank #${myEntry.rank})` : ""}
              </span>
            </p>
          </div>
        </div>
        <div className="border border-outline bg-surface-low px-6 py-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-[#47c8ff]/10 border border-[#47c8ff]/20 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-[#47c8ff]" />
          </div>
          <div>
            <p className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted">
              Department Average
            </p>
            <p className="text-xl font-bold text-foreground">
              {deptAvg}{" "}
              <span className="text-[11px] text-foreground-muted font-normal">
                pts
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Period Filter */}
      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setFilterPeriod(p.key)}
            className={`px-4 py-2 text-[10px] tracking-[0.12em] uppercase font-bold border transition-colors ${
              filterPeriod === p.key
                ? "bg-primary/10 border-primary/40 text-primary"
                : "border-outline text-foreground-muted hover:border-foreground-muted"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 border border-[#ff4747]/30 bg-[#ff4747]/5 text-[#ff4747]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-[12px]">{error}</span>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="overflow-x-auto">
        <div className="border border-outline bg-surface-low min-w-[640px]">
          <div className="grid grid-cols-[40px_2fr_1fr_1fr_120px] gap-4 px-6 py-3 border-b border-outline bg-surface-container">
            {["#", "Employee", "Tasks", "Overdue", "Score"].map((h) => (
              <span
                key={h}
                className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted font-bold"
              >
                {h}
              </span>
            ))}
          </div>

          {data.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-foreground-muted">
              <p className="text-[12px] tracking-[0.1em] uppercase">
                No data available
              </p>
            </div>
          ) : (
            <div className="divide-y divide-outline">
              {data.map((emp) => {
                const isMe = emp.userId === user?._id;
                const barWidth =
                  topScore > 0 ? Math.round((emp.score / topScore) * 100) : 0;
                return (
                  <div
                    key={emp.userId}
                    className={`grid grid-cols-[40px_2fr_1fr_1fr_120px] gap-4 px-6 py-4 items-center transition-colors ${
                      isMe
                        ? "bg-primary/5 border-l-2 border-l-primary"
                        : "hover:bg-surface-container"
                    }`}
                  >
                    {/* Rank */}
                    <div
                      className={`flex items-center justify-center w-7 h-7 text-[11px] font-bold border ${
                        emp.rank === 1
                          ? "border-[#e8a847]/40 text-[#e8a847] bg-[#e8a847]/10"
                          : emp.rank === 2
                            ? "border-foreground/20 text-foreground-muted bg-foreground/10"
                            : emp.rank === 3
                              ? "border-[#f87343]/40 text-[#f87343] bg-[#f87343]/10"
                              : "border-outline text-foreground-muted"
                      }`}
                    >
                      {emp.rank === 1 ? (
                        <Trophy className="w-3 h-3" />
                      ) : (
                        emp.rank
                      )}
                    </div>
                    {/* Name */}
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <Users className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <p className="text-[13px] font-semibold text-foreground">
                        {emp.name}
                        {isMe && (
                          <span className="ml-2 text-[9px] text-primary tracking-[0.1em] uppercase font-bold">
                            You
                          </span>
                        )}
                      </p>
                    </div>
                    {/* Tasks */}
                    <MetricChip
                      icon={CheckCircle2}
                      label="Done"
                      value={`${emp.tasksCompleted}/${emp.tasksTotal}`}
                      color="text-[#47ff8a]"
                    />
                    {/* Overdue */}
                    <MetricChip
                      icon={Clock}
                      label="Overdue"
                      value={emp.tasksOverdue}
                      color={
                        emp.tasksOverdue > 0
                          ? "text-[#ff4747]"
                          : "text-[#47ff8a]"
                      }
                    />
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
        Scores are calculated automatically from task completion, deadlines, and
        daily logs.
      </p>
    </div>
  );
}
