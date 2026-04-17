"use client";

import { useState, useEffect } from "react";
import { ClipboardList, MessageSquare, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import AuthLoader from "@/components/AuthLoader";
import { useAuth } from "@/lib/auth/context";
import { getTasks, updateTask } from "@/services/taskService";
import { TableSkeleton } from "@/components/skeletons";

function formatDateTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminTasksPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [tasksArr, setTasksArr] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [savingNoteId, setSavingNoteId] = useState(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    async function load() {
      setDataLoading(true);
      try {
        const resp = await getTasks();
        const data = Array.isArray(resp) ? resp : (resp?.data ?? []);
        if (mounted) setTasksArr(data);
      } catch (e) {
        console.error("Failed to load tasks", e);
        if (mounted) setError("Failed to load tasks");
      } finally {
        if (mounted) setDataLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [user]);

  if (loading || !user) return <AuthLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-foreground-muted mb-1">
            Admin / Tasks
          </p>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Tasks
          </h1>
        </div>
      </div>

      <div className="border border-outline bg-surface-low">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-outline">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-[#c847ff]" />
            <span className="text-[10px] tracking-[0.15em] uppercase font-bold text-foreground-muted">
              Tasks
            </span>
          </div>
        </div>

        {dataLoading ? (
          <div className="p-6">
            <TableSkeleton rows={6} cols={3} />
          </div>
        ) : error ? (
          <div className="p-6 text-[#ff4747]">{error}</div>
        ) : tasksArr.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-foreground-muted">
            <p className="text-[11px] tracking-[0.1em] uppercase">
              No tasks found
            </p>
          </div>
        ) : (
          <div className="divide-y divide-outline">
            {tasksArr.map((t, idx) => (
              <div
                key={t._id ?? t.id ?? idx}
                className="px-5 py-3 hover:bg-surface-container transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[12px] text-foreground truncate">
                      {t.title}
                    </p>
                    <p className="text-[11px] text-foreground-muted mt-0.5">
                      {t.created_by?.name || t.created_by || "Admin"}
                    </p>
                    {t.adminNote && editingNoteId !== (t._id ?? t.id) && (
                      <p className="text-[11px] text-foreground-muted italic mt-2">
                        {t.adminNote}
                      </p>
                    )}
                    {editingNoteId === (t._id ?? t.id) && (
                      <div className="mt-3">
                        <textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          rows={3}
                          className="w-full p-2 bg-surface-low border border-outline text-foreground"
                          placeholder="Add a short admin note"
                        />
                      </div>
                    )}

                    {/* Timing Details */}
                    <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-outline/30">
                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase tracking-wider text-foreground-muted mb-0.5">Start</span>
                        <span className="text-[10px] text-foreground whitespace-nowrap">{formatDateTime(t.developerStartedAt)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase tracking-wider text-foreground-muted mb-0.5">Finish</span>
                        <span className="text-[10px] text-foreground whitespace-nowrap">{formatDateTime(t.developerFinishedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {editingNoteId === (t._id ?? t.id) ? (
                      <>
                        <button
                          onClick={async () => {
                            const id = t._id ?? t.id ?? idx;
                            try {
                              setSavingNoteId(id);
                              const updated = await updateTask(id, {
                                adminNote: noteText,
                              });
                              setTasksArr((prev) =>
                                prev.map((it) =>
                                  it._id === id || it.id === id
                                    ? {
                                        ...it,
                                        adminNote:
                                          updated?.adminNote ?? noteText,
                                      }
                                    : it,
                                ),
                              );
                              setEditingNoteId(null);
                              setNoteText("");
                            } catch (err) {
                              console.error("Failed to save note", err);
                              setError("Failed to save note");
                            } finally {
                              setSavingNoteId(null);
                            }
                          }}
                          className="flex items-center gap-2 px-3 py-1 bg-primary text-on-primary rounded-sm"
                          disabled={savingNoteId === (t._id ?? t.id)}
                        >
                          <Check className="w-4 h-4" />
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingNoteId(null);
                            setNoteText("");
                          }}
                          className="flex items-center gap-2 px-3 py-1 border border-outline rounded-sm text-foreground-muted"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            const id = t._id ?? t.id ?? idx;
                            setEditingNoteId(id);
                            setNoteText(t.adminNote ?? t.note ?? "");
                          }}
                          title="Add / Edit note"
                          className="p-1 rounded hover:bg-surface-low"
                        >
                          <MessageSquare className="w-4 h-4 text-foreground-muted" />
                        </button>
                        <span
                          className={`text-[10px] tracking-[0.1em] uppercase font-bold px-2 py-0.5 border`}
                        >
                          {t.status}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
