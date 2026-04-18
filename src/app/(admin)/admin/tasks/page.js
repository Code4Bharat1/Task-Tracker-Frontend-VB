"use client";

import { useState, useEffect, useCallback } from "react";
import { ClipboardList, MessageSquare, Send, Circle, AlertCircle, Loader2, ChevronDown, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import AuthLoader from "@/components/AuthLoader";
import { useAuth } from "@/lib/auth/context";
import { getTasks, addTaskNote } from "@/services/taskService";
import { TableSkeleton } from "@/components/skeletons";

const STATUS_META = {
  TODO:        { label: "Pending",    color: "text-foreground-muted", bg: "bg-foreground/10",    border: "border-foreground/15" },
  IN_PROGRESS: { label: "In Progress",color: "text-[#47c8ff]",        bg: "bg-[#47c8ff]/10",    border: "border-[#47c8ff]/20" },
  DONE:        { label: "Completed",  color: "text-[#47ff8a]",        bg: "bg-[#47ff8a]/10",    border: "border-[#47ff8a]/20" },
  REJECTED:    { label: "Rejected",   color: "text-[#ff4747]",        bg: "bg-[#ff4747]/10",    border: "border-[#ff4747]/20" },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.TODO;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] tracking-[0.1em] uppercase font-bold border ${m.bg} ${m.border} ${m.color}`}>
      <Circle className="w-1.5 h-1.5 fill-current" />{m.label}
    </span>
  );
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminTasksPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      const resp = await getTasks();
      setTasks(Array.isArray(resp) ? resp : (resp?.data ?? []));
    } catch { setError("Failed to load tasks"); }
    finally { setDataLoading(false); }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading || !user) return <AuthLoader />;

  const filtered = tasks.filter((t) => {
    const matchSearch = !search || t.title?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  async function handleAddNote(taskId) {
    if (!noteText.trim()) return;
    try {
      setSavingId(taskId);
      const updated = await addTaskNote(taskId, noteText.trim(), user.name);
      setTasks((prev) => prev.map((t) => t._id === taskId ? updated : t));
      setNoteText("");
    } catch { setError("Failed to add note."); }
    finally { setSavingId(null); }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] tracking-[0.2em] uppercase text-foreground-muted mb-1">Admin / Tasks</p>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Tasks</h1>
      </div>

      {error && (
        <div className="flex items-center gap-3 px-4 py-3 border border-[#ff4747]/30 bg-[#ff4747]/5 text-[#ff4747]">
          <AlertCircle className="w-4 h-4 shrink-0" /><span className="text-[12px]">{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks..."
            className="w-full bg-surface-container border border-outline pl-9 pr-3 py-2.5 text-[12px] text-foreground focus:outline-none focus:border-primary"
          />
        </div>
        <div className="relative">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none bg-surface-container border border-outline px-3 py-2.5 pr-8 text-[12px] text-foreground focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground-muted pointer-events-none" />
        </div>
      </div>

      {/* Task list */}
      {dataLoading ? <TableSkeleton rows={5} cols={4} /> : (
        <div className="border border-outline bg-surface-low">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_40px] gap-4 px-6 py-3 border-b border-outline bg-surface-container">
            {["Task", "Status", "Assignees", "Deadline", ""].map((h) => (
              <span key={h} className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted font-bold">{h}</span>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-foreground-muted">
              <p className="text-[12px] tracking-[0.1em] uppercase">No tasks found</p>
            </div>
          ) : (
            <div className="divide-y divide-outline">
              {filtered.map((t) => {
                const isExpanded = expandedId === t._id;
                const cNames = (t.contributors || []).map(c => c.userId?.name || "—");
                const isDone = t.status === "DONE";

                return (
                  <div key={t._id}>
                    <div className="grid grid-cols-[2fr_1fr_1fr_1fr_40px] gap-4 px-6 py-4 items-center hover:bg-surface-container transition-colors">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-foreground truncate">{t.title}</p>
                        {t.description && <p className="text-[11px] text-foreground-muted mt-0.5 truncate">{t.description}</p>}
                        {t.completionNote && (
                          <p className="text-[10px] text-primary mt-0.5 truncate">Note: {t.completionNote}</p>
                        )}
                      </div>
                      <StatusBadge status={t.status} />
                      <p className="text-[12px] text-foreground-muted truncate">{cNames.join(", ") || "—"}</p>
                      <p className="text-[12px] text-foreground-muted">{formatDate(t.deadline)}</p>
                      {/* Notes button — only for completed tasks */}
                      <button
                        onClick={() => { setExpandedId(isExpanded ? null : t._id); setNoteText(""); }}
                        disabled={!isDone}
                        title={isDone ? "View / Add notes" : "Only available for completed tasks"}
                        className={`p-1.5 transition-colors ${isDone ? "text-foreground-muted hover:text-primary" : "opacity-20 cursor-not-allowed"} ${isExpanded ? "text-primary" : ""}`}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Notes panel — only for completed tasks */}
                    {isExpanded && isDone && (
                      <div className="px-6 pb-5 bg-surface-container border-t border-outline space-y-3">
                        <p className="text-[10px] tracking-[0.15em] uppercase font-bold text-foreground-muted pt-4">
                          Notes & Comments
                        </p>

                        {/* Existing notes */}
                        {(t.notes || []).length === 0 ? (
                          <p className="text-[12px] text-foreground-muted italic">No notes yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {(t.notes || []).map((n, i) => (
                              <div key={i} className="border border-outline bg-surface-low px-4 py-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[11px] font-bold text-foreground">{n.authorName || "Admin"}</span>
                                  <span className="text-[10px] text-foreground-muted">{formatDate(n.createdAt)}</span>
                                </div>
                                <p className="text-[12px] text-foreground-muted leading-relaxed">{n.text}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add note */}
                        <div className="flex gap-2">
                          <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            rows={2}
                            placeholder="Add a note or comment..."
                            className="flex-1 bg-surface-low border border-outline px-3 py-2 text-[12px] text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary resize-none"
                          />
                          <button
                            onClick={() => handleAddNote(t._id)}
                            disabled={!noteText.trim() || savingId === t._id}
                            className="px-4 py-2 bg-primary text-on-primary text-[11px] tracking-[0.1em] uppercase font-bold hover:bg-primary/90 transition-colors disabled:opacity-40 flex items-center gap-1.5 self-end"
                          >
                            {savingId === t._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            Add
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
