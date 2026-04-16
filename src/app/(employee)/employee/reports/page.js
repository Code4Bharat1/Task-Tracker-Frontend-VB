"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Pencil, Trash2, Plus, X } from "lucide-react";
import { getMyProjects } from "@/services/projectService";
import {
  getMyReports,
  createReport,
  updateReport,
  deleteReport,
} from "@/services/reportService";

const OPTIONS = [
  { key: "call", label: "Call", color: "bg-sky-600 text-white" },
  { key: "email", label: "Email", color: "bg-pink-500 text-white" },
  { key: "demo", label: "Demo", color: "bg-amber-400 text-black" },
  {
    key: "whatsapp",
    label: "WhatsApp update",
    color: "bg-emerald-600 text-white",
  },
  { key: "review", label: "Review meeting", color: "bg-amber-700 text-white" },
];

function typeToColor(key) {
  return (
    OPTIONS.find((o) => o.key === key)?.color ||
    "bg-foreground/10 text-foreground"
  );
}

export default function ReportsPage() {
  const [open, setOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [reports, setReports] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const ref = useRef();

  useEffect(() => {
    // try load from server, fallback to localStorage
    (async () => {
      try {
        const remote = await getMyReports();
        if (Array.isArray(remote) && remote.length > 0) {
          const mapped = remote.map((r) => ({
            id: r._id ?? r.id,
            types: r.types ?? [],
            projectId: r.projectId ?? "",
            projectName: r.projectName ?? r.project?.name ?? "-",
            date: r.date
              ? new Date(r.date).toISOString().slice(0, 10)
              : new Date().toISOString().slice(0, 10),
            notes: r.notes ?? "",
          }));
          setReports(mapped);
        } else {
          try {
            const raw = localStorage.getItem("reports_v1");
            if (raw) setReports(JSON.parse(raw));
          } catch (e) {}
        }
      } catch (err) {
        try {
          const raw = localStorage.getItem("reports_v1");
          if (raw) setReports(JSON.parse(raw));
        } catch (e) {}
      }

      // load projects
      (async () => {
        try {
          const p = await getMyProjects();
          setProjects(Array.isArray(p) ? p : []);
        } catch {
          setProjects([]);
        }
      })();
    })();
  }, []);

  useEffect(() => {
    function onDoc(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("reports_v1", JSON.stringify(reports));
    } catch {}
  }, [reports]);

  function toggleType(key) {
    setSelectedTypes((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key],
    );
  }

  function resetForm() {
    setSelectedTypes([]);
    setProjectId("");
    setDate(new Date().toISOString().slice(0, 10));
    setNotes("");
    setEditingId(null);
  }

  function handleSave() {
    if (!selectedTypes.length) return;
    const project = projects.find((p) => String(p._id) === String(projectId));
    const body = {
      types: selectedTypes,
      projectId: projectId || null,
      date,
      notes,
    };

    if (editingId) {
      // try server update, fallback to local
      (async () => {
        try {
          const updated = await updateReport(editingId, body);
          const mapped = {
            id: updated._id ?? editingId,
            types: updated.types ?? selectedTypes,
            projectId: updated.projectId ?? projectId,
            projectName: updated.projectName ?? project?.name ?? "-",
            date: updated.date
              ? new Date(updated.date).toISOString().slice(0, 10)
              : date,
            notes: updated.notes ?? notes,
          };
          setReports((prev) =>
            prev.map((r) => (r.id === editingId ? mapped : r)),
          );
        } catch (err) {
          const payload = {
            id: editingId,
            types: selectedTypes,
            projectId: projectId || null,
            projectName: project?.name || "-",
            date,
            notes,
          };
          setReports((prev) =>
            prev.map((r) => (r.id === editingId ? payload : r)),
          );
        } finally {
          resetForm();
          setOpen(false);
        }
      })();
    } else {
      (async () => {
        try {
          const created = await createReport(body);
          const mapped = {
            id: created._id ?? created.id ?? Date.now().toString(),
            types: created.types ?? selectedTypes,
            projectId: created.projectId ?? projectId,
            projectName: created.projectName ?? project?.name ?? "-",
            date: created.date
              ? new Date(created.date).toISOString().slice(0, 10)
              : date,
            notes: created.notes ?? notes,
          };
          setReports((prev) => [mapped, ...prev]);
        } catch (err) {
          const payload = {
            id: Date.now().toString(),
            types: selectedTypes,
            projectId: projectId || null,
            projectName: project?.name || "-",
            date,
            notes,
          };
          setReports((prev) => [payload, ...prev]);
        } finally {
          resetForm();
          setOpen(false);
        }
      })();
    }
  }

  function handleEdit(id) {
    const r = reports.find((x) => x.id === id);
    if (!r) return;
    setSelectedTypes(r.types || []);
    setProjectId(r.projectId || "");
    setDate(r.date || new Date().toISOString().slice(0, 10));
    setNotes(r.notes || "");
    setEditingId(id);
    setOpen(true);
  }

  function handleDelete(id) {
    if (!confirm("Delete this report?")) return;
    (async () => {
      try {
        await deleteReport(id);
        setReports((prev) => prev.filter((r) => r.id !== id));
      } catch (err) {
        // fallback: local delete
        setReports((prev) => prev.filter((r) => r.id !== id));
      }
    })();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-widest text-foreground">
            Reports
          </h1>
          <p className="text-[12px] text-foreground-muted mt-1">
            Project manager reports and activity updates
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="max-w-2xl">
          <label className="block text-[10px] tracking-[0.12em] uppercase text-foreground-muted mb-2">
            Update Type
          </label>
          <div ref={ref} className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="w-full text-left bg-surface-container border border-outline px-3 py-2.5 flex items-center gap-3 justify-between"
            >
              <div className="flex items-center gap-2 flex-wrap">
                {selectedTypes.length === 0 ? (
                  <span className="text-[12px] text-foreground-muted">
                    Select update type...
                  </span>
                ) : (
                  selectedTypes.map((k) => (
                    <span
                      key={k}
                      className={`${typeToColor(k)} px-2 py-1 rounded-full text-[12px] font-semibold`}
                    >
                      {OPTIONS.find((o) => o.key === k)?.label}
                    </span>
                  ))
                )}
              </div>
              <ChevronDown className="w-4 h-4 text-foreground-muted" />
            </button>

            {open && (
              <div className="absolute z-20 w-full mt-2 bg-surface-low border border-outline shadow-md max-h-60 overflow-auto">
                <div className="p-3">
                  <input
                    placeholder="Search..."
                    className="w-full bg-surface-container border border-outline px-3 py-2 text-[12px] text-foreground placeholder-foreground-muted"
                  />
                </div>
                <div className="divide-y divide-outline">
                  {OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => toggleType(opt.key)}
                      className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-surface-high"
                    >
                      <span
                        className={`${opt.color} inline-block w-28 text-center px-2 py-1 rounded-full text-[12px]`}
                      >
                        {opt.label}
                      </span>
                      <span className="text-[12px] text-foreground-muted ml-auto">
                        {selectedTypes.includes(opt.key) ? "Selected" : "Add"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            <div>
              <label className="block text-[10px] tracking-[0.12em] uppercase text-foreground-muted mb-2">
                Project
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-surface-container border border-outline px-3 py-2 text-[12px]"
              >
                <option value="">(none)</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] tracking-[0.12em] uppercase text-foreground-muted mb-2">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-surface-container border border-outline px-3 py-2 text-[12px]"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSave}
                className="ml-auto flex items-center gap-2 px-3 py-2 bg-primary text-on-primary rounded"
              >
                <Plus className="w-4 h-4" />{" "}
                {editingId ? "Update Report" : "Add Report"}
              </button>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-[10px] tracking-[0.12em] uppercase text-foreground-muted mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-surface-container border border-outline px-3 py-2 text-[12px]"
            />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-foreground mb-2">
            Recent Reports
          </h2>
          {reports.length === 0 ? (
            <div className="border border-outline bg-surface-container px-6 py-8 min-h-[160px] flex items-center justify-center">
              <div className="text-center">
                <p className="text-[20px] text-foreground-muted">
                  No reports yet
                </p>
                <p className="text-[12px] text-foreground-muted mt-2">
                  Use the Update Type selector to add or filter reports.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <div
                  key={r.id}
                  className="border border-outline bg-surface-low px-4 py-3 flex items-start gap-3"
                >
                  <div className="flex flex-col gap-2 w-64">
                    <div className="flex items-center gap-2 flex-wrap">
                      {r.types.map((t) => (
                        <span
                          key={t}
                          className={`${typeToColor(t)} px-2 py-1 rounded-full text-[12px] font-semibold`}
                        >
                          {OPTIONS.find((o) => o.key === t)?.label}
                        </span>
                      ))}
                    </div>
                    <div className="text-[12px] text-foreground-muted">
                      {r.projectName} • {new Date(r.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] text-foreground">
                      {r.notes || (
                        <span className="text-foreground-muted">
                          No details
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <button
                      onClick={() => handleEdit(r.id)}
                      className="text-foreground-muted hover:text-foreground"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-foreground-muted hover:text-foreground"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
