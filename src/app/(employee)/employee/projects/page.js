"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FolderKanban,
  Search,
  ChevronRight,
  Users,
  Calendar,
  AlertCircle,
  Circle,
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { getProjectDetailPath } from "@/lib/auth/utils";
import AuthLoader from "@/components/AuthLoader";
import { TableSkeleton, HeaderSkeleton } from "@/components/skeletons";
import { getMyProjects } from "@/services/projectService";

// ─── Helpers ──────────────────────────────────────────────────
const STATUS_META = {
  IN_PROGRESS: {
    label: "In Progress",
    color: "text-[#47c8ff] border-[#47c8ff]/30 bg-[#47c8ff]/10",
  },
  COMPLETED: {
    label: "Completed",
    color: "text-[#47ff8a] border-[#47ff8a]/30 bg-[#47ff8a]/10",
  },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || {
    label: status,
    color: "text-foreground-muted border-outline/30 bg-foreground/5",
  };
  return (
    <span
      className={`inline-flex px-2.5 py-0.5 text-[10px] tracking-[0.1em] uppercase font-bold border ${meta.color}`}
    >
      {meta.label}
    </span>
  );
}

function myRole(project, userId) {
  if (project.managerIds?.includes(userId)) return "Project Manager";
  if (project.testerIds?.includes(userId)) return "Tester";
  if (project.developerIds?.includes(userId)) return "Developer";
  return "Member";
}

function RoleBadge({ role }) {
  const map = {
    "Project Manager": "text-[#e8a847] border-[#e8a847]/30 bg-[#e8a847]/10",
    Tester: "text-[#c847ff] border-[#c847ff]/30 bg-[#c847ff]/10",
    Developer: "text-primary   border-primary/30   bg-primary/10",
    Member: "text-foreground-muted   border-foreground/15   bg-foreground/10",
  };
  return (
    <span
      className={`inline-flex px-2 py-0.5 text-[10px] tracking-[0.1em] uppercase font-bold border ${map[role] || map.Member}`}
    >
      {role}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function EmployeeProjectsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [projects, setProjects] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (
      !loading &&
      (!user ||
        !["employee", "project_manager", "developer", "tester"].includes(
          user?.role,
        ))
    )
      router.replace("/login");
  }, [user, loading, router]);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setDataLoading(true);
      const data = await getMyProjects(user._id);
      setProjects(data);
    } catch {
      setError("Failed to load projects. Please try again.");
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading || !user) return <AuthLoader />;

  const filtered = projects.filter((p) => {
    const matchSearch =
      !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusCounts = projects.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[10px] tracking-[0.2em] uppercase text-foreground-muted mb-1">
          Employee
        </p>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          My Projects
        </h1>
      </div>

      {/* Status Pills */}
      {!dataLoading && (
        <div className="flex flex-wrap gap-3">
          {[
            ["all", "All", projects.length],
            ...Object.entries(STATUS_META).map(([k, v]) => [
              k,
              v.label,
              statusCounts[k] || 0,
            ]),
          ].map(([key, label, count]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`flex items-center gap-2 px-3 py-1.5 border text-[10px] tracking-[0.12em] uppercase font-bold transition-colors
                ${statusFilter === key ? "bg-primary text-on-primary border-primary" : "border-outline text-foreground-muted hover:border-foreground-muted hover:text-foreground"}`}
            >
              <span>{label}</span>
              <span
                className={`text-[10px] ${statusFilter === key ? "text-on-primary/70" : "text-foreground-muted"}`}
              >
                {count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects..."
          className="w-full bg-surface-container border border-outline pl-9 pr-3 py-2.5 text-[12px] text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 border border-[#ff4747]/30 bg-[#ff4747]/5 text-[#ff4747]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-[12px]">{error}</span>
        </div>
      )}

      {/* Table */}
      {dataLoading ? (
        <div className="space-y-6">
          <HeaderSkeleton hasButton={false} />
          <TableSkeleton rows={4} cols={4} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="border border-outline bg-surface-low min-w-135">
            <div className="grid grid-cols-[3fr_1fr_1fr_1fr_40px] gap-4 px-6 py-3 border-b border-outline bg-surface-container">
              {["Project", "My Role", "Status", "Deadline", ""].map((h) => (
                <span
                  key={h}
                  className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted font-bold"
                >
                  {h}
                </span>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-foreground-muted">
                <FolderKanban className="w-8 h-8" />
                <p className="text-[12px] tracking-[0.1em] uppercase">
                  No projects found
                </p>
              </div>
            ) : (
              <div className="divide-y divide-outline">
                {filtered.map((p) => {
                  const role = myRole(p, user._id);
                  const deadline = p.deadline
                    ? new Date(p.deadline).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—";
                  return (
                    <div
                      key={p._id}
                      onClick={() => router.push(getProjectDetailPath(p._id))}
                      className="grid grid-cols-[3fr_1fr_1fr_1fr_40px] gap-4 px-6 py-4 items-center hover:bg-surface-container transition-colors cursor-pointer"
                    >
                      <div>
                        <p className="text-[13px] text-foreground font-semibold">
                          {p.name}
                        </p>
                        {p.description && (
                          <p className="text-[11px] text-foreground-muted mt-0.5 line-clamp-1">
                            {p.description}
                          </p>
                        )}
                      </div>
                      <RoleBadge role={role} />
                      <StatusBadge status={p.status} />
                      <div className="flex items-center gap-1.5 text-foreground-muted">
                        <Calendar className="w-3 h-3 text-foreground-muted" />
                        <span className="text-[12px]">{deadline}</span>
                      </div>
                      <div className="flex items-center justify-end">
                        <ChevronRight className="w-4 h-4 text-foreground-muted" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
