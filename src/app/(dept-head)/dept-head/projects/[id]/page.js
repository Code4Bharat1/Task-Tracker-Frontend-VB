"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  FolderKanban,
  Circle,
  Users,
  Calendar,
  AlertCircle,
  Upload,
  FileText,
  Loader2,
} from "lucide-react";
import { getProject, updateProject } from "@/services/projectService";
import { getTasks, TASK_STATUS_META } from "@/services/taskService";
import { getUsers } from "@/services/userService";
import { uploadProjectSrs, deleteProjectSrs } from "@/services/projectService";

// ─── Status Meta ─────────────────────────────────────────────
const PROJECT_STATUS_META = {
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
  // legacy fallback for old DB records
  PLANNING:    { label: "In Progress", color: "text-[#47c8ff]", bg: "bg-[#47c8ff]/10", border: "border-[#47c8ff]/20" },
  CODE_REVIEW: { label: "In Progress", color: "text-[#47c8ff]", bg: "bg-[#47c8ff]/10", border: "border-[#47c8ff]/20" },
  QA_TESTING:  { label: "In Progress", color: "text-[#47c8ff]", bg: "bg-[#47c8ff]/10", border: "border-[#47c8ff]/20" },
  APPROVED:    { label: "Completed",   color: "text-[#47ff8a]", bg: "bg-[#47ff8a]/10", border: "border-[#47ff8a]/20" },
  DEPLOYED:    { label: "Completed",   color: "text-[#47ff8a]", bg: "bg-[#47ff8a]/10", border: "border-[#47ff8a]/20" },
};

function StatusBadge({ status, meta }) {
  const m = meta[status];
  if (!m) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] tracking-[0.1em] uppercase font-bold border ${m.bg} ${m.border} ${m.color}`}
    >
      <Circle className="w-1.5 h-1.5 fill-current" />
      {m.label}
    </span>
  );
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Main Page ────────────────────────────────────────────────
export default function ProjectDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [srsUploading, setSrsUploading] = useState(false);
  const srsInputRef = useRef(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [projR, modsR, usersR] = await Promise.allSettled([
        getProject(id),
        getTasks(id),
        getUsers(),
      ]);
      if (projR.status === "fulfilled") {
        const usersArr =
          usersR.status === "fulfilled"
            ? Array.isArray(usersR.value)
              ? usersR.value
              : []
            : [];
        const idToName = Object.fromEntries(
          usersArr.map((u) => [String(u._id ?? u.id ?? ""), u.name]),
        );
        const p = projR.value;
        const managerIds = Array.isArray(p.managerIds) ? p.managerIds : [];
        const testerIds = Array.isArray(p.testerIds) ? p.testerIds : [];
        const developerIds = Array.isArray(p.developerIds)
          ? p.developerIds
          : [];
        setProject({
          ...p,
          managerIds,
          testerIds,
          developerIds,
          managerNames: managerIds
            .map((id) => idToName[String(id)])
            .filter(Boolean),
          testerNames: testerIds
            .map((id) => idToName[String(id)])
            .filter(Boolean),
          developerNames: developerIds
            .map((id) => idToName[String(id)])
            .filter(Boolean),
        });
        setUsers(usersArr);
      } else {
        setError("Failed to load project. Please try again.");
        return;
      }
      setTasks(modsR.status === "fulfilled" ? modsR.value : []);
    } catch {
      setError("Failed to load project. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSrsUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setSrsUploading(true);
      setError(null);
      const updated = await uploadProjectSrs(id, file);
      setProject((prev) => ({ ...prev, srsDocument: updated?.srsDocument }));
    } catch {
      setError("Failed to upload SRS document.");
    } finally {
      setSrsUploading(false);
      e.target.value = "";
    }
  }

  async function handleSrsDelete() {
    try {
      setSrsUploading(true);
      setError(null);
      const updated = await deleteProjectSrs(id);
      setProject((prev) => ({ ...prev, srsDocument: updated?.srsDocument ?? { url: null, publicId: null } }));
    } catch {
      setError("Failed to delete SRS document.");
    } finally {
      setSrsUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 bg-surface-high animate-pulse" />
        <div className="h-32 w-full bg-surface-high animate-pulse" />
        <div className="h-64 w-full bg-surface-high animate-pulse" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-foreground-muted">
        <AlertCircle className="w-8 h-8" />
        <p className="text-[12px] tracking-[0.1em] uppercase">
          {error || "Project not found"}
        </p>
        <button
          onClick={() => router.back()}
          className="text-[11px] text-primary tracking-[0.1em] uppercase"
        >
          ← Go Back
        </button>
      </div>
    );
  }

  const completedTasks = tasks.filter((t) => t.status === "DONE").length;
  const showProgress = tasks.length > 0;

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push("/dept-head/projects")}
        className="flex items-center gap-2 text-[10px] tracking-[0.15em] uppercase text-foreground-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        All Projects
      </button>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 border border-[#ff4747]/30 bg-[#ff4747]/5 text-[#ff4747]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-[12px]">{error}</span>
        </div>
      )}

      {/* Project Header */}
      <div className="border border-outline bg-surface-low p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <FolderKanban className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {project.name}
              </h1>
              {project.description && (
                <p className="text-[12px] text-foreground-muted mt-1">
                  {project.description}
                </p>
              )}
            </div>
          </div>
          <select
            value={project.status}
            onChange={async (e) => {
              const newStatus = e.target.value;
              setProject((prev) => ({ ...prev, status: newStatus }));
              try {
                await updateProject(id, { status: newStatus });
              } catch {
                setError("Failed to update project status.");
              }
            }}
            className={`appearance-none px-3 py-1 text-[10px] tracking-[0.1em] uppercase font-bold border cursor-pointer focus:outline-none
              ${PROJECT_STATUS_META[project.status]?.bg ?? "bg-surface-container"}
              ${PROJECT_STATUS_META[project.status]?.border ?? "border-outline"}
              ${PROJECT_STATUS_META[project.status]?.color ?? "text-foreground"}`}
          >
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        <div
          className={`grid grid-cols-2 ${showProgress ? "sm:grid-cols-5" : "sm:grid-cols-4"} gap-4 pt-4 border-t border-outline`}
        >
          <div>
            <p className="text-[10px] tracking-[0.12em] uppercase text-foreground-muted mb-1">
              Project Manager
            </p>
            <p className="text-[12px] text-foreground font-medium">
              {project.managerNames?.length
                ? project.managerNames.join(", ")
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] tracking-[0.12em] uppercase text-foreground-muted mb-1">
              Tester
            </p>
            <p className="text-[12px] text-foreground font-medium">
              {project.testerNames?.length
                ? project.testerNames.join(", ")
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] tracking-[0.12em] uppercase text-foreground-muted mb-1">
              Developer
            </p>
            <p className="text-[12px] text-foreground font-medium">
              {project.developerNames?.length
                ? project.developerNames.join(", ")
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] tracking-[0.12em] uppercase text-foreground-muted mb-1">
              Timeline
            </p>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-foreground-muted" />
              <p className="text-[12px] text-foreground font-medium">
                {formatDate(project.startDate)} – {formatDate(project.endDate)}
              </p>
            </div>
          </div>
          {showProgress && (
            <div>
              <p className="text-[10px] tracking-[0.12em] uppercase text-foreground-muted mb-1">
                Progress
              </p>
              <p className="text-[12px] text-foreground font-medium">
                {completedTasks}/{tasks.length} tasks done
              </p>
            </div>
          )}
        </div>

        {/* SRS Document */}
        <div className="mt-4 pt-4 border-t border-outline flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-[0.12em] uppercase text-foreground-muted mb-1">
              SRS Document
            </p>
            {project.srsDocument?.url ? (
              <div className="flex items-center gap-3">
                <a
                  href={project.srsDocument.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[12px] text-primary hover:underline"
                >
                  <FileText className="w-3.5 h-3.5" />
                  View SRS
                </a>
                <button
                  onClick={handleSrsDelete}
                  disabled={srsUploading}
                  className="text-[11px] text-[#ff4747] hover:underline disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
            ) : (
              <p className="text-[12px] text-foreground-muted">
                No SRS uploaded
              </p>
            )}
          </div>
          <label className={`flex items-center gap-2 px-3 py-2 border border-outline text-[10px] tracking-[0.12em] uppercase font-bold transition-colors cursor-pointer shrink-0 ${srsUploading ? "opacity-40 pointer-events-none" : "text-foreground-muted hover:text-foreground hover:border-foreground-muted"}`}>
            {srsUploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            {srsUploading ? "Uploading..." : "Upload SRS"}
            <input
              ref={srsInputRef}
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={handleSrsUpload}
            />
          </label>
        </div>
      </div>

      {/* Modules */}
      <div className="border border-outline bg-surface-low">
        <div className="flex items-center px-6 py-4 border-b border-outline">
          <span className="text-[11px] tracking-[0.2em] uppercase font-bold text-foreground">
            Tasks
          </span>
        </div>

        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-foreground-muted">
            <p className="text-[12px] tracking-[0.1em] uppercase">
              No tasks yet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-outline">
            {tasks.map((t) => {
              const cNames = (t.contributors || [])
                .map((c) => c.userId?.name || c.userId)
                .filter(Boolean);
              const rNames = (t.reviewers || [])
                .map((r) => r.userId?.name || r.userId)
                .filter(Boolean);
              return (
                <div
                  key={t._id}
                  className="flex items-center gap-5 px-6 py-4 hover:bg-surface-container transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-foreground">
                      {t.title}
                    </p>
                    {t.description && (
                      <p className="text-[11px] text-foreground-muted mt-0.5 truncate">
                        {t.description}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={t.status} meta={TASK_STATUS_META} />
                  <div className="flex items-center gap-1.5 text-foreground-muted shrink-0">
                    <Users className="w-3 h-3" />
                    <span className="text-[11px]">
                      {cNames.length > 0 ? cNames.join(", ") : "Unassigned"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-foreground-muted shrink-0">
                    <Calendar className="w-3 h-3" />
                    <span className="text-[11px]">
                      {formatDate(t.deadline)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
