"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Plus,
  AlertCircle,
  CheckCircle2,
  X,
  CheckSquare,
  FolderKanban,
  Upload,
  Trash2,
  ChevronDown,
  Clock,
  Mic,
  Folder,
  SmilePlus,
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import AuthLoader from "@/components/AuthLoader";
import { TableSkeleton } from "@/components/skeletons";
import api from "@/lib/api";
import { getMyProjects } from "@/services/projectService";
import { getTasks } from "@/services/taskService";
import { uploadEntryScreenshot } from "@/services/dailyLogService";
import { List, AutoSizer } from "react-virtualized";
import { DatePicker } from "@/components/DatePicker";

// ─── Log Form Modal ───────────────────────────────────────────
function LogFormModal({ userId, projects, onClose, onSave, existing }) {
  const isEdit = !!existing;
  const today = new Date().toISOString().split("T")[0];
  const itemFileRefs = useRef([]);
  const lastItemRef = useRef(null);

  const [date, setDate] = useState(
    (existing?.logDate || existing?.date)?.split("T")[0] || today,
  );
  const [workItems, setWorkItems] = useState(
    existing
      ? existing.entries?.length
        ? existing.entries.map((e) => ({
            projectId: e.projectId || "",
            taskId: e.taskId || "",
            taskTitle: e.taskTitle || "",
            description: e.description || "",
            logType: e.logType || "task_work",
            startTime: e.startTime || "",
            endTime: e.endTime || "",
            screenshotFile: null,
            screenshotPreview: e.screenshotUrl || "",
          }))
        : [
            {
              projectId: existing.projectId || "",
              taskId: existing.taskId || "",
              taskTitle: existing.taskTitle || "",
              description: existing.description || "",
              logType: "task_work",
              startTime: "",
              endTime: "",
              screenshotFile: null,
              screenshotPreview: existing?.screenshotUrl || "",
            },
          ]
      : [
          {
            projectId: "",
            taskId: "",
            taskTitle: "",
            description: "",
            logType: "task_work",
            startTime: "",
            endTime: "",
            screenshotFile: null,
            screenshotPreview: "",
          },
        ],
  );
  const [tasksByProject, setTasksByProject] = useState({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function fetchTasksForProject(projectId) {
    if (!projectId) return;
    if (tasksByProject[projectId] !== undefined) return;
    try {
      const tasks = await getTasks(projectId);
      setTasksByProject((prev) => ({ ...prev, [projectId]: tasks }));
    } catch {
      setTasksByProject((prev) => ({ ...prev, [projectId]: [] }));
    }
  }

  useEffect(() => {
    workItems.forEach((item) => {
      if (item.projectId) fetchTasksForProject(item.projectId);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    function handleKey(e) {
      if (e.key === "Escape" && !saving) onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose, saving]);

  function updateWorkItem(index, field, value) {
    setWorkItems((prev) => {
      const updated = prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      );
      if (field === "projectId") {
        updated[index].taskId = "";
        updated[index].taskTitle = "";
        if (value) fetchTasksForProject(value);
      }
      if (field === "taskId") {
        const tasks = tasksByProject[updated[index].projectId] || [];
        const task = tasks.find((t) => t._id === value);
        updated[index].taskTitle = task?.title || "";
      }
      return updated;
    });
  }

  function addWorkItem() {
    setWorkItems((prev) => [
      ...prev,
      {
        projectId: "",
        taskId: "",
        taskTitle: "",
        description: "",
        logType: "task_work",
        startTime: "",
        endTime: "",
        screenshotFile: null,
        screenshotPreview: "",
      },
    ]);
    setTimeout(
      () =>
        lastItemRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      50,
    );
  }

  function removeWorkItem(index) {
    setWorkItems((prev) => prev.filter((_, i) => i !== index));
  }

  function handleItemFileChange(index, e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const oldPreview = workItems[index]?.screenshotPreview;
    if (oldPreview && oldPreview.startsWith("blob:"))
      URL.revokeObjectURL(oldPreview);
    const preview = URL.createObjectURL(file);
    setWorkItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, screenshotFile: file, screenshotPreview: preview }
          : item,
      ),
    );
  }

  function removeItemScreenshot(index) {
    const oldPreview = workItems[index]?.screenshotPreview;
    if (oldPreview && oldPreview.startsWith("blob:"))
      URL.revokeObjectURL(oldPreview);
    setWorkItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, screenshotFile: null, screenshotPreview: "" }
          : item,
      ),
    );
    if (itemFileRefs.current[index]) itemFileRefs.current[index].value = "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    const validItems = workItems.filter(
      (item) => item.projectId && item.description.trim(),
    );
    if (validItems.length === 0) {
      setFormError("At least one project with description is required.");
      return;
    }
    try {
      setSaving(true);
      const validItemsWithFiles = validItems.map((item) => {
        const { screenshotFile, screenshotPreview, ...rest } = item;
        return { ...rest, _screenshotFile: screenshotFile, _screenshotPreview: screenshotPreview };
      });

      let savedLog;
      if (isEdit && existing?._id) {
        const { data } = await api.patch(`/daily-logs/${existing._id}`, {
          logDate: date,
          entries: validItemsWithFiles.map((item) => ({
            projectId: item.projectId,
            taskId: item.taskId || null,
            description: item.description,
            logType: item.logType || "task_work",
            startTime: item.startTime || undefined,
            endTime: item.endTime || undefined,
          })),
        });
        savedLog = data.log ?? data;
      } else {
        const { data } = await api.post("/daily-logs", {
          logDate: date,
          entries: validItemsWithFiles.map((item) => ({
            projectId: item.projectId,
            taskId: item.taskId || null,
            description: item.description,
            logType: item.logType || "task_work",
            startTime: item.startTime || undefined,
            endTime: item.endTime || undefined,
          })),
        });
        savedLog = data.log ?? data;
      }

      // Upload screenshots for entries that have a new file
      const savedEntries = savedLog?.entries || [];
      await Promise.all(
        validItemsWithFiles.map(async (item, index) => {
          if (item._screenshotFile && savedEntries[index]?._id) {
            try {
              await uploadEntryScreenshot(savedLog._id, savedEntries[index]._id, item._screenshotFile);
            } catch {
              /* non-blocking: screenshot upload failure doesn't fail the whole submit */
            }
          }
        })
      );
      await onSave();
      onClose();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to submit log. Please try again.";
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-xl border border-outline bg-surface-low shadow-2xl z-10 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline shrink-0">
          <div className="flex items-center gap-3">
            <ClipboardList className="w-4 h-4 text-primary" />
            <p className="text-[11px] tracking-[0.15em] uppercase font-bold text-foreground">
              {isEdit ? "Edit Log" : "Submit Daily Log"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-foreground-muted hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {formError && (
            <div className="flex items-center gap-2 text-[#ff4747] text-[12px]">
              <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-[10px] tracking-[0.15em] uppercase text-foreground-muted mb-1.5">
              Date *
            </label>
            <DatePicker value={date} onChange={setDate} />
          </div>

          {/* Work Items */}
          <div className="space-y-3">
            <label className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted font-bold">
              Work Items *
            </label>

            {workItems.map((item, index) => (
              <div
                key={index}
                ref={index === workItems.length - 1 ? lastItemRef : null}
                className="border border-outline bg-surface-container p-4 space-y-3 relative"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted font-bold">
                    Item {index + 1}
                  </span>
                  {workItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeWorkItem(index)}
                      className="text-foreground-muted hover:text-[#ff4747] transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Project */}
                <div>
                  <label className="block text-[10px] tracking-[0.12em] uppercase text-foreground-muted mb-1">
                    Project *
                  </label>
                  <select
                    value={item.projectId}
                    onChange={(e) =>
                      updateWorkItem(index, "projectId", e.target.value)
                    }
                    className="w-full bg-surface-low border border-outline px-3 py-2 text-[12px] text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="">Select project...</option>
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Task */}
                <div>
                  <label className="block text-[10px] tracking-[0.12em] uppercase text-foreground-muted mb-1">
                    Task{" "}
                    <span className="text-[#47c8ff] normal-case tracking-normal font-normal">
                      (IN_PROGRESS only)
                    </span>
                  </label>
                  <select
                    value={item.taskId}
                    disabled={!item.projectId}
                    onChange={(e) =>
                      updateWorkItem(index, "taskId", e.target.value)
                    }
                    className="w-full bg-surface-low border border-outline px-3 py-2 text-[12px] text-foreground focus:outline-none focus:border-primary disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {item.projectId
                        ? "No specific task"
                        : "Select a project first..."}
                    </option>
                    {(tasksByProject[item.projectId] || [])
                      .filter((t) => t.status === "IN_PROGRESS")
                      .map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.title}
                        </option>
                      ))}
                  </select>
                  {item.projectId &&
                    (tasksByProject[item.projectId] || []).length > 0 &&
                    (tasksByProject[item.projectId] || []).filter(
                      (t) => t.status === "IN_PROGRESS",
                    ).length === 0 && (
                      <p className="text-[10px] text-[#e8a847] mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> No tasks are
                        currently IN_PROGRESS for this project.
                      </p>
                    )}
                </div>

                {/* Log Type & Time Range */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] tracking-[0.12em] uppercase text-foreground-muted mb-1">
                      Type
                    </label>
                    <select
                      value={item.logType}
                      onChange={(e) =>
                        updateWorkItem(index, "logType", e.target.value)
                      }
                      className="w-full bg-surface-low border border-outline px-3 py-2 text-[12px] text-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="task_work">Task Work</option>
                      <option value="meeting">Meeting</option>
                      <option value="ad_hoc">Ad-hoc</option>
                      <option value="review">Review</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-[0.12em] uppercase text-foreground-muted mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={item.startTime}
                      onChange={(e) =>
                        updateWorkItem(index, "startTime", e.target.value)
                      }
                      className="w-full bg-surface-low border border-outline px-3 py-2 text-[12px] text-foreground focus:outline-none focus:border-primary [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-[0.12em] uppercase text-foreground-muted mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={item.endTime}
                      onChange={(e) =>
                        updateWorkItem(index, "endTime", e.target.value)
                      }
                      className="w-full bg-surface-low border border-outline px-3 py-2 text-[12px] text-foreground focus:outline-none focus:border-primary [color-scheme:dark]"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] tracking-[0.12em] uppercase text-foreground-muted mb-1">
                    Description *
                  </label>
                  <div className="relative group">
                    <div className="absolute left-3 bottom-3 flex items-center gap-2.5 z-10">
                      <button type="button" className="text-foreground-muted hover:text-primary transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" className="text-foreground-muted hover:text-primary transition-colors">
                        <SmilePlus className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" className="text-foreground-muted hover:text-primary transition-colors">
                        <Folder className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <textarea
                      value={item.description}
                      onChange={(e) =>
                        updateWorkItem(index, "description", e.target.value)
                      }
                      rows={3}
                      placeholder="What did you work on?"
                      className="w-full bg-surface-low border border-outline pl-24 pr-10 py-2.5 text-[12px] text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary transition-colors resize-none min-h-[90px]"
                    />
                    <div className="absolute right-3 bottom-3 z-10">
                      <button type="button" className="text-foreground-muted hover:text-primary transition-colors">
                        <Mic className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Per-item Screenshot — temporarily commented out */}
                {/* <div>
                  <label className="block text-[10px] tracking-[0.12em] uppercase text-foreground-muted mb-1">
                    Screenshot (optional)
                  </label>
                  <input
                    ref={(el) => {
                      itemFileRefs.current[index] = el;
                    }}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleItemFileChange(index, e)}
                    className="hidden"
                  />
                  {item.screenshotPreview ? (
                    <div className="relative border border-outline">
                      <img
                        src={item.screenshotPreview}
                        alt="Screenshot preview"
                        className="w-full object-cover max-h-36"
                      />
                      <button
                        type="button"
                        onClick={() => removeItemScreenshot(index)}
                        className="absolute top-1 right-1 bg-black/70 text-white hover:bg-[#ff4747] transition-colors p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => itemFileRefs.current[index]?.click()}
                        className="absolute bottom-1 right-1 bg-black/70 text-white hover:bg-primary transition-colors px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold"
                      >
                        Replace
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => itemFileRefs.current[index]?.click()}
                      className="w-full border border-dashed border-outline bg-surface-low hover:border-primary hover:bg-primary/5 py-4 flex items-center justify-center gap-2 text-foreground-muted hover:text-primary transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      <span className="text-[10px] tracking-widest uppercase font-bold">
                        Attach screenshot
                      </span>
                    </button>
                  )}
                </div> */}
              </div>
            ))}

            <button
              type="button"
              onClick={addWorkItem}
              className="flex items-center gap-1.5 px-3 py-1 border border-primary text-primary hover:bg-primary hover:text-on-primary text-[11px] font-bold uppercase tracking-widest transition-colors"
            >
              <Plus className="w-3 h-3" /> Add Item
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-outline shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-outline text-foreground-muted hover:text-foreground hover:border-foreground-muted text-[11px] tracking-[0.15em] uppercase font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-primary text-on-primary hover:bg-primary/90 text-[11px] tracking-[0.15em] uppercase font-bold transition-colors disabled:opacity-50"
          >
            {saving ? "Submitting..." : isEdit ? "Save Changes" : "Submit Log"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Grouped Log List ─────────────────────────────────────────
function parseLogDate(l) {
  const r = l.logDate ?? l.log_date ?? l.date ?? l.createdAt ?? l.created_at;
  if (!r) return null;
  const dt = new Date(r);
  return isNaN(dt) ? null : dt;
}

function GroupedLogList({ logs, projects, today, onEdit, onDelete }) {
  const groups = useMemo(() => {
    const map = new Map();
    for (const l of logs) {
      const parsed = parseLogDate(l);
      const key = parsed ? parsed.toISOString().split("T")[0] : "unknown";
      if (!map.has(key)) map.set(key, { parsed, logs: [] });
      map.get(key).logs.push(l);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([key, val]) => ({ key, ...val }));
  }, [logs]);

  const [expanded, setExpanded] = useState(
    () => new Set(groups.map((g) => g.key)),
  );

  function toggle(key) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  return (
    <div className="divide-y divide-outline">
      {groups.map(({ key, parsed, logs: groupLogs }) => {
        const isToday = key === today;
        const isOpen = expanded.has(key);
        const dateStr = parsed
          ? parsed.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "Unknown Date";

        return (
          <div key={key}>
            {/* Date group header */}
            <button
              onClick={() => toggle(key)}
              className="w-full flex items-center gap-3 px-6 py-3.5 hover:bg-surface-container transition-colors text-left"
            >
              <ChevronDown
                className={`w-3.5 h-3.5 text-foreground-muted shrink-0 transition-transform ${isOpen ? "" : "-rotate-90"}`}
              />
              <div className="flex items-center gap-2 flex-1">
                <p className="text-[12px] font-semibold text-foreground">
                  {dateStr}
                </p>
                {isToday && (
                  <span className="text-[10px] tracking-widest uppercase text-[#47ff8a] font-bold">
                    Today
                  </span>
                )}
                <span className="text-[10px] text-foreground-muted">
                  {groupLogs.reduce(
                    (sum, l) => sum + (l.entries?.length || 1),
                    0,
                  )}{" "}
                  {groupLogs.reduce(
                    (sum, l) => sum + (l.entries?.length || 1),
                    0,
                  ) === 1
                    ? "entry"
                    : "entries"}
                </span>
              </div>
            </button>

            {/* Expanded entries */}
            {isOpen && (
              <div className="divide-y divide-outline/50">
                {groupLogs.flatMap((l) => {
                  const entryList = l.entries?.length
                    ? l.entries
                    : [
                        {
                          projectId: l.projectId,
                          taskId: l.taskId,
                          taskTitle: l.taskTitle,
                          description: l.description,
                        },
                      ];

                  return entryList.map((entry, idx) => {
                    const proj = projects.find(
                      (p) =>
                        p._id === (entry.projectId?._id || entry.projectId),
                    );
                    return (
                      <div
                        key={`${l._id}-${idx}`}
                        className="grid grid-cols-[1fr_2fr_auto] gap-4 pl-12 pr-6 py-3 items-center bg-surface-low hover:bg-surface-container transition-colors"
                      >
                        <div>
                          <p className="text-[12px] text-foreground">
                            {proj?.name || entry.projectName || entry.projectId}
                          </p>
                          {entry.taskTitle && (
                            <p className="text-[11px] text-foreground-muted flex items-center gap-1 mt-0.5">
                              <CheckSquare className="w-3 h-3" />{" "}
                              {entry.taskTitle}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-0.5">
                            {entry.logType && entry.logType !== "task_work" && (
                              <span className="text-[9px] tracking-[0.1em] uppercase font-bold text-[#c847ff] border border-[#c847ff]/30 bg-[#c847ff]/10 px-1.5 py-0.5">
                                {entry.logType.replace(/_/g, " ")}
                              </span>
                            )}
                            {(entry.startTime || entry.endTime) && (
                              <span className="text-[10px] text-foreground-muted flex items-center gap-1">
                                <Clock className="w-3 h-3" />{" "}
                                {entry.startTime || "—"} →{" "}
                                {entry.endTime || "—"}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-[12px] text-foreground-muted">
                          {entry.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onEdit(l)}
                            className="text-[10px] tracking-widest uppercase text-foreground-muted hover:text-primary transition-colors font-bold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onDelete(l)}
                            className="text-foreground-muted hover:text-[#ff4747] transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  });
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function EmployeeDailyLogsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("daily");
  const [projects, setProjects] = useState([]);
  const [todayLog, setTodayLog] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editLog, setEditLog] = useState(null);

  // Filtered logs based on filter type
  const filteredLogs = useMemo(() => {
    if (!logs.length) return [];
    const now = new Date();
    return logs.filter((log) => {
      const logDate = new Date(log.logDate || log.date || log.createdAt);
      switch (filter) {
        case "daily":
          return logDate.toDateString() === now.toDateString();
        case "weekly": {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          return logDate >= startOfWeek && logDate <= endOfWeek;
        }
        case "monthly":
          return (
            logDate.getFullYear() === now.getFullYear() &&
            logDate.getMonth() === now.getMonth()
          );
        case "quarterly": {
          const quarter = Math.floor(now.getMonth() / 3);
          const logQuarter = Math.floor(logDate.getMonth() / 3);
          return (
            logDate.getFullYear() === now.getFullYear() &&
            logQuarter === quarter
          );
        }
        case "yearly":
          return logDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });
  }, [logs, filter]);

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

  const loadData = useCallback(
    async (silent = false) => {
      if (!user) return;
      try {
        if (!silent) setDataLoading(true);
        const [logsR, projectsR] = await Promise.allSettled([
          api.get("/daily-logs", { params: { limit: 100 } }),
          getMyProjects(),
        ]);
        const myLogs =
          logsR.status === "fulfilled"
            ? (logsR.value?.data?.data ??
              logsR.value?.data?.logs ??
              (Array.isArray(logsR.value?.data) ? logsR.value.data : []))
            : [];
        const todayStr = new Date().toISOString().split("T")[0];
        const foundToday = myLogs.find((l) => {
          const d = l.logDate ?? l.date ?? l.createdAt;
          if (!d) return false;
          try {
            return new Date(d).toISOString().startsWith(todayStr);
          } catch {
            return String(d).startsWith(todayStr);
          }
        });
        setLogs(myLogs);
        setProjects(projectsR.status === "fulfilled" ? projectsR.value : []);
        setTodayLog(foundToday || null);
      } catch {
        setError("Failed to load daily logs.");
      } finally {
        setDataLoading(false);
      }
    },
    [user],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading || !user) return <AuthLoader />;

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-y-3">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-foreground-muted mb-1">
            Employee
          </p>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Daily Logs
          </h1>
        </div>
        <button
          onClick={() => {
            setEditLog(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary hover:bg-primary/90 text-[11px] tracking-[0.15em] uppercase font-bold transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Submit Log
        </button>
      </div>

      {/* Today's log status banner */}
      {!dataLoading && (
        <div
          className={`flex items-center gap-3 px-4 py-3 border ${
            todayLog
              ? "border-[#47ff8a]/30 bg-[#47ff8a]/5 text-[#47ff8a]"
              : "border-[#e8a847]/30 bg-[#e8a847]/5 text-[#e8a847]"
          }`}
        >
          {todayLog ? (
            <>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="text-[12px]">
                Today's log submitted on{" "}
                {projects.find((p) => p._id === todayLog.projectId)?.name ||
                  "project"}
                .
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="text-[12px]">
                No log submitted today. Don't forget to submit before the
                deadline!
              </span>
            </>
          )}
        </div>
      )}

      {/* Stats */}
      {!dataLoading && (
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-outline bg-surface-low px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="w-4 h-4 text-primary" />
              <span className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted font-bold">
                Total Logs
              </span>
            </div>
            <p className="text-2xl font-bold text-primary">{logs.length}</p>
          </div>
          <div className="border border-outline bg-surface-low px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <FolderKanban className="w-4 h-4 text-[#c847ff]" />
              <span className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted font-bold">
                Projects Logged
              </span>
            </div>
            <p className="text-2xl font-bold text-[#c847ff]">
              {new Set(logs.map((l) => l.projectId)).size}
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 border border-[#ff4747]/30 bg-[#ff4747]/5 text-[#ff4747]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-[12px]">{error}</span>
        </div>
      )}

      {/* Logs Table with Filter and Virtualization */}
      {dataLoading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : (
        <div className="border border-outline bg-surface-low">
          {/* Filter Bar */}
          <div className="flex items-center gap-2 px-6 py-3 border-b border-outline bg-surface-container">
            <span className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted font-bold mr-2">
              Filter:
            </span>
            {["daily", "weekly", "monthly", "quarterly", "yearly"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-1 rounded text-[11px] font-bold uppercase tracking-widest border transition-colors ${
                  filter === f
                    ? "bg-primary text-on-primary border-primary"
                    : "bg-surface-container border-outline text-foreground-muted hover:text-primary hover:border-primary"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          {/* Table Header */}
          <div className="grid grid-cols-[2fr_1fr_auto] gap-4 px-6 py-3 border-b border-outline bg-surface-container">
            {["Project / Task", "Description", ""].map((h) => (
              <span
                key={h}
                className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted font-bold"
              >
                {h}
              </span>
            ))}
          </div>
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-foreground-muted">
              <ClipboardList className="w-8 h-8" />
              <p className="text-[12px] tracking-widest uppercase">
                No logs found for this filter
              </p>
            </div>
          ) : (
            <GroupedLogList
              logs={filteredLogs}
              projects={projects}
              today={today}
              onEdit={(l) => {
                setEditLog(l);
                setShowModal(true);
              }}
              onDelete={async (l) => {
                if (!confirm("Delete this log?")) return;
                try {
                  await api.delete(`/daily-logs/${l._id}`);
                  await loadData(true);
                } catch {
                  alert("Failed to delete log.");
                }
              }}
            />
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <LogFormModal
          userId={user._id}
          projects={projects}
          existing={editLog}
          onClose={() => {
            setShowModal(false);
            setEditLog(null);
          }}
          onSave={() => loadData(true)}
        />
      )}
    </div>
  );
}
