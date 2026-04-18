"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FlaskConical,
  Check,
  X,
  Clock,
  AlertCircle,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import AuthLoader from "@/components/AuthLoader";
import { getMyProjects } from "@/services/projectService";
import {
  TESTING_PHASES,
  getTestResults,
  submitTestResult,
} from "@/services/testingService";
import { ProjectsSkeleton } from "@/components/skeletons";

const PHASE_STATUS_META = {
  PASS: {
    label: "Pass",
    color: "text-[#47ff8a]",
    bg: "bg-[#47ff8a]/10",
    border: "border-[#47ff8a]/20",
    icon: Check,
  },
  FAIL: {
    label: "Fail",
    color: "text-[#ff4747]",
    bg: "bg-[#ff4747]/10",
    border: "border-[#ff4747]/20",
    icon: X,
  },
  PENDING: {
    label: "Pending",
    color: "text-[#e8a847]",
    bg: "bg-[#e8a847]/10",
    border: "border-[#e8a847]/20",
    icon: Clock,
  },
};

export default function TestingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!loading && (!user || !["employee", "tester", "reviewer"].includes(user?.role)))
      router.replace("/login");
  }, [user, loading, router]);

  const loadProjects = useCallback(async () => {
    if (!user) return;
    try {
      setDataLoading(true);
      const projs = await getMyProjects(user._id);
      const testerProjs = projs.filter((p) => p.testerIds?.includes(user._id));
      setProjects(testerProjs);
      if (testerProjs.length > 0 && !selectedProject) {
        setSelectedProject(testerProjs[0]._id);
      }
    } catch {
      setError("Failed to load projects.");
    } finally {
      setDataLoading(false);
    }
  }, [user, selectedProject]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (!selectedProject) return;
    (async () => {
      try {
        const results = await getTestResults(selectedProject);
        setTestResult(results[0] || null);
      } catch {
        setTestResult(null);
      }
    })();
  }, [selectedProject]);

  async function handlePhaseUpdate(phaseKey, status, notes) {
    try {
      setSaving(true);
      const payload = {
        testerId: user._id,
        testerName: user.name,
        [phaseKey]: { status, notes: notes || "" },
      };
      if (testResult) {
        TESTING_PHASES.forEach((p) => {
          if (p.key !== phaseKey && testResult[p.key]) {
            payload[p.key] = testResult[p.key];
          }
        });
      }
      const phases = TESTING_PHASES.map((p) =>
        p.key === phaseKey
          ? { status, notes }
          : testResult?.[p.key] || { status: "PENDING", notes: "" },
      );
      const allPass = phases.every((p) => p.status === "PASS");
      const anyFail = phases.some((p) => p.status === "FAIL");
      payload.overallStatus = allPass
        ? "PASS"
        : anyFail
          ? "FAIL"
          : "IN_PROGRESS";

      const updated = await submitTestResult(selectedProject, payload);
      setTestResult(updated);
    } catch {
      setError("Failed to update test result.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !user) return <AuthLoader />;

  const currentProject = projects.find((p) => p._id === selectedProject);

  const phaseResults = TESTING_PHASES.map((p) => ({
    ...p,
    result: testResult?.[p.key] || { status: "PENDING", notes: "" },
  }));
  const passCount = phaseResults.filter(
    (p) => p.result.status === "PASS",
  ).length;
  const overallProgress = Math.round((passCount / TESTING_PHASES.length) * 100);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] tracking-[0.2em] uppercase text-foreground-muted mb-1">
          Tester
        </p>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Test Cases
        </h1>
      </div>

      {error && (
        <div className="flex items-center gap-3 px-4 py-3 border border-[#ff4747]/30 bg-[#ff4747]/5 text-[#ff4747]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-[12px]">{error}</span>
        </div>
      )}

      {dataLoading ? (
        <ProjectsSkeleton />
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-foreground-muted">
          <FlaskConical className="w-8 h-8 mb-3 opacity-40" />
          <p className="text-[11px] tracking-[0.1em] uppercase">
            No projects assigned for testing
          </p>
        </div>
      ) : (
        <>
          {/* Project Selector */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted font-bold">
              Project:
            </span>
            <div className="relative">
              <select
                value={selectedProject || ""}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="appearance-none bg-surface-low border border-outline px-4 py-2.5 pr-10 text-[12px] text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted pointer-events-none" />
            </div>
          </div>

          {/* Overall Progress */}
          <div className="border border-outline bg-surface-low p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#c847ff]/10 border border-[#c847ff]/20 flex items-center justify-center">
                  <FlaskConical className="w-5 h-5 text-[#c847ff]" />
                </div>
                <div>
                  <h2 className="text-[13px] font-bold text-foreground">
                    {currentProject?.name}
                  </h2>
                  <p className="text-[10px] text-foreground-muted mt-0.5">
                    Testing Progress — {passCount}/{TESTING_PHASES.length}{" "}
                    phases passed
                  </p>
                </div>
              </div>
              <span
                className={`text-lg font-bold ${overallProgress === 100 ? "text-[#47ff8a]" : "text-[#e8a847]"}`}
              >
                {overallProgress}%
              </span>
            </div>
            <div className="h-2 bg-surface-high overflow-hidden">
              <div
                className="h-full bg-[#c847ff] transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          {/* Test Phases */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {phaseResults.map((phase) => {
              const meta = PHASE_STATUS_META[phase.result.status];
              const Icon = meta?.icon || Clock;
              return (
                <PhaseCard
                  key={phase.key}
                  phase={phase}
                  meta={meta}
                  Icon={Icon}
                  saving={saving}
                  onUpdate={(status, notes) =>
                    handlePhaseUpdate(phase.key, status, notes)
                  }
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function PhaseCard({ phase, meta, Icon, saving, onUpdate }) {
  const [notes, setNotes] = useState(phase.result.notes || "");
  const [editing, setEditing] = useState(false);

  return (
    <div
      className={`border bg-surface-low p-5 ${meta?.border || "border-outline"}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted font-bold">
            {phase.label}
          </p>
          <p className="text-[9px] text-foreground-muted mt-0.5">
            Weight: {phase.weight}%
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] tracking-[0.1em] uppercase font-bold border ${meta?.bg} ${meta?.border} ${meta?.color}`}
        >
          <Icon className="w-3 h-3" /> {meta?.label}
        </span>
      </div>

      {editing ? (
        <div className="space-y-2">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Testing notes…"
            className="w-full bg-surface-container border border-outline px-3 py-2 text-[11px] text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary transition-colors resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                onUpdate("PASS", notes);
                setEditing(false);
              }}
              disabled={saving}
              className="flex-1 py-2 text-[10px] tracking-[0.1em] uppercase font-bold bg-[#47ff8a]/10 text-[#47ff8a] border border-[#47ff8a]/20 hover:bg-[#47ff8a]/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {saving ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Check className="w-3 h-3" />
              )}{" "}
              Pass
            </button>
            <button
              onClick={() => {
                onUpdate("FAIL", notes);
                setEditing(false);
              }}
              disabled={saving}
              className="flex-1 py-2 text-[10px] tracking-[0.1em] uppercase font-bold bg-[#ff4747]/10 text-[#ff4747] border border-[#ff4747]/20 hover:bg-[#ff4747]/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {saving ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <X className="w-3 h-3" />
              )}{" "}
              Fail
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-3 py-2 text-[10px] tracking-[0.1em] uppercase font-bold border border-outline text-foreground-muted hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          {phase.result.notes && (
            <p className="text-[11px] text-foreground-muted mb-2">
              {phase.result.notes}
            </p>
          )}
          <button
            onClick={() => setEditing(true)}
            className="text-[10px] tracking-[0.1em] uppercase text-primary hover:underline"
          >
            {phase.result.status === "PENDING"
              ? "Start Testing"
              : "Update Result"}
          </button>
        </div>
      )}
    </div>
  );
}
