"use client";

// Dept Head Reports page — reuses the same UI as the employee reports page
// but fetches all department projects and all department reports

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ChevronDown, Search, Pencil, Trash2, Plus, X, Check,
  FileText, Loader2, AlertCircle,
} from "lucide-react";
import PermissionGuard from "@/components/PermissionGuard";
import { useAuth } from "@/lib/auth/context";
import { getProjects } from "@/services/projectService";
import {
  getMyReports, createReport, updateReport, deleteReport,
} from "@/services/reportService";

const UPDATE_TYPES = [
  { key: "call",      label: "Call",            color: "bg-sky-600 text-white" },
  { key: "email",     label: "Email",           color: "bg-pink-500 text-white" },
  { key: "demo",      label: "Demo",            color: "bg-amber-400 text-black" },
  { key: "whatsapp",  label: "WhatsApp update", color: "bg-emerald-600 text-white" },
  { key: "review",    label: "Review meeting",  color: "bg-amber-700 text-white" },
];

function typeMeta(key) {
  return UPDATE_TYPES.find((o) => o.key === key) || { label: key, color: "bg-foreground/10 text-foreground" };
}

function TypeBadge({ typeKey }) {
  const m = typeMeta(typeKey);
  return (
    <span className={`${m.color} px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap`}>
      {m.label}
    </span>
  );
}

function IncludedBadge({ value, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-bold border transition-colors ${
        value
          ? "bg-[#47ff8a]/10 border-[#47ff8a]/30 text-[#47ff8a]"
          : "bg-[#ff4747]/10 border-[#ff4747]/30 text-[#ff4747]"
      }`}
    >
      {value ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
      {value ? "Yes" : "No"}
      <ChevronDown className="w-3 h-3 opacity-60" />
    </button>
  );
}

function TypeSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef();

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = UPDATE_TYPES.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left bg-surface-container border border-outline px-3 py-2.5 flex items-center gap-2 justify-between min-h-[42px]"
      >
        <div className="flex items-center gap-1.5 flex-wrap">
          {value.length === 0 ? (
            <span className="text-[12px] text-foreground-muted">Select type…</span>
          ) : (
            value.map((k) => <TypeBadge key={k} typeKey={k} />)
          )}
        </div>
        <ChevronDown className="w-4 h-4 text-foreground-muted shrink-0" />
      </button>
      {open && (
        <div className="absolute z-30 w-full mt-1 bg-surface-low border border-outline shadow-xl">
          <div className="p-2 border-b border-outline">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground-muted" />
              <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
                className="w-full bg-surface-container border border-outline pl-7 pr-2 py-1.5 text-[11px] text-foreground focus:outline-none"
              />
            </div>
          </div>
          <div className="divide-y divide-outline max-h-52 overflow-y-auto">
            {filtered.map((opt) => {
              const selected = value.includes(opt.key);
              return (
                <button key={opt.key} type="button"
                  onClick={() => onChange(selected ? value.filter((k) => k !== opt.key) : [...value, opt.key])}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface-container transition-colors"
                >
                  <TypeBadge typeKey={opt.key} />
                  <span className="ml-auto text-[11px] text-foreground-muted">{selected ? "✓ Selected" : "Add"}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ReportModal({ initial, projects, onClose, onSave, saving }) {
  const isEdit = !!initial;
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    types: initial?.types ?? [],
    projectId: initial?.projectId ?? "",
    date: initial?.date ?? today,
    notes: initial?.notes ?? "",
    clientResponse: initial?.clientResponse ?? "",
    weeklyIncluded: initial?.weeklyIncluded ?? false,
    monthlyIncluded: initial?.monthlyIncluded ?? false,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    function handleKey(e) { if (e.key === "Escape" && !saving) onClose(); }
    window.addEventListener("keydown", handleKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", handleKey); };
  }, [onClose, saving]);

  function handleSubmit() {
    if (!form.types.length) { setError("Select at least one update type."); return; }
    onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={!saving ? onClose : undefined} />
      <div className="relative w-full max-w-lg bg-surface-low border border-outline shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline">
          <span className="text-[11px] tracking-[0.2em] uppercase font-bold text-foreground">
            {isEdit ? "Edit Report" : "Add Report"}
          </span>
          <button onClick={onClose} disabled={saving} className="text-foreground-muted hover:text-foreground disabled:opacity-40">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && <div className="flex items-center gap-2 text-[#ff4747] text-[12px]"><AlertCircle className="w-4 h-4 shrink-0" /> {error}</div>}
          <div>
            <label className="block text-[10px] tracking-[0.15em] uppercase text-foreground-muted mb-1.5">Update Type *</label>
            <TypeSelect value={form.types} onChange={(v) => setForm({ ...form, types: v })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] tracking-[0.15em] uppercase text-foreground-muted mb-1.5">Project</label>
              <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                className="w-full bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground focus:outline-none focus:border-primary"
              >
                <option value="">(none)</option>
                {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] tracking-[0.15em] uppercase text-foreground-muted mb-1.5">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] tracking-[0.15em] uppercase text-foreground-muted mb-1.5">Update / Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3}
              placeholder="What was discussed or done…"
              className="w-full bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground focus:outline-none focus:border-primary resize-none"
            />
          </div>
          <div>
            <label className="block text-[10px] tracking-[0.15em] uppercase text-foreground-muted mb-1.5">Client Response</label>
            <textarea value={form.clientResponse} onChange={(e) => setForm({ ...form, clientResponse: e.target.value })} rows={2}
              placeholder="Client's response or feedback…"
              className="w-full bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground focus:outline-none focus:border-primary resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[["weeklyIncluded", "Weekly Report"], ["monthlyIncluded", "Monthly Report"]].map(([field, label]) => (
              <div key={field}>
                <label className="block text-[10px] tracking-[0.15em] uppercase text-foreground-muted mb-1.5">{label}</label>
                <div className="flex gap-2">
                  {[true, false].map((v) => (
                    <button key={String(v)} type="button" onClick={() => setForm({ ...form, [field]: v })}
                      className={`flex-1 py-2 text-[11px] font-bold uppercase border transition-colors ${form[field] === v ? "bg-primary border-primary text-on-primary" : "border-outline text-foreground-muted"}`}
                    >{v ? "Yes" : "No"}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2 px-6 pb-5 pt-2">
          <button onClick={onClose} disabled={saving} className="flex-1 py-2.5 text-[11px] tracking-[0.15em] uppercase font-bold border border-outline text-foreground-muted hover:text-foreground disabled:opacity-40">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="flex-1 py-2.5 text-[11px] tracking-[0.15em] uppercase font-bold bg-primary text-on-primary hover:bg-primary/90 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            {isEdit ? "Save Changes" : "Add Report"}
          </button>
        </div>
      </div>
    </div>
  );
}

function normalize(r) {
  const proj = r.projectId;
  return {
    id: r._id ?? r.id,
    types: r.types ?? [],
    projectId: typeof proj === "object" ? proj?._id : proj ?? "",
    projectName: typeof proj === "object" ? proj?.name : "",
    date: r.date ? new Date(r.date).toISOString().slice(0, 10) : "",
    notes: r.notes ?? "",
    clientResponse: r.clientResponse ?? "",
    weeklyIncluded: r.weeklyIncluded ?? false,
    monthlyIncluded: r.monthlyIncluded ?? false,
  };
}

function DeptHeadReportsPageInner() {
  const { can } = useAuth();
  const [reports, setReports] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterProject, setFilterProject] = useState("all");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [remote, projs] = await Promise.all([
        getMyReports().catch(() => []),
        getProjects().catch(() => []),
      ]);
      setProjects(Array.isArray(projs) ? projs : []);
      setReports(Array.isArray(remote) ? remote.map(normalize) : []);
    } catch {
      setError("Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleSave(form) {
    try {
      setSaving(true);
      const proj = projects.find((p) => String(p._id) === String(form.projectId));
      if (modal?.type === "edit") {
        const updated = await updateReport(modal.report.id, form);
        const mapped = { ...normalize(updated), projectName: proj?.name ?? modal.report.projectName };
        setReports((prev) => prev.map((r) => (r.id === modal.report.id ? mapped : r)));
      } else {
        const created = await createReport(form);
        const mapped = { ...normalize(created), projectName: proj?.name ?? "" };
        setReports((prev) => [mapped, ...prev]);
      }
      setModal(null);
    } catch {
      setError("Failed to save report.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this report?")) return;
    try {
      await deleteReport(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError("Failed to delete report.");
    }
  }

  async function toggleField(id, field) {
    const report = reports.find((r) => r.id === id);
    if (!report) return;
    const updated = { ...report, [field]: !report[field] };
    setReports((prev) => prev.map((r) => (r.id === id ? updated : r)));
    try { await updateReport(id, { [field]: updated[field] }); }
    catch { setReports((prev) => prev.map((r) => (r.id === id ? report : r))); }
  }

  const filtered = reports.filter((r) => {
    if (search && !r.notes?.toLowerCase().includes(search.toLowerCase()) &&
        !r.projectName?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType !== "all" && !r.types.includes(filterType)) return false;
    if (filterProject !== "all" && String(r.projectId) !== filterProject) return false;
    return true;
  });

  const stats = {
    total: reports.length,
    weekly: reports.filter((r) => r.weeklyIncluded).length,
    monthly: reports.filter((r) => r.monthlyIncluded).length,
    thisMonth: reports.filter((r) => {
      if (!r.date) return false;
      const d = new Date(r.date); const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-y-3">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-foreground-muted mb-1">Department</p>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Reports</h1>
        </div>
        {can("reports", "create") && (
          <button onClick={() => setModal({ type: "add" })}
            className="flex items-center gap-2 px-4 py-2.5 text-[11px] tracking-[0.15em] uppercase font-bold bg-primary text-on-primary hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Report
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Reports", value: stats.total, accent: "text-foreground" },
          { label: "This Month", value: stats.thisMonth, accent: "text-[#47c8ff]" },
          { label: "In Weekly", value: stats.weekly, accent: "text-[#47ff8a]" },
          { label: "In Monthly", value: stats.monthly, accent: "text-[#e8a847]" },
        ].map(({ label, value, accent }) => (
          <div key={label} className="border border-outline bg-surface-low p-4">
            <p className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted mb-2">{label}</p>
            <p className={`text-2xl font-bold ${accent}`}>{value}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-3 px-4 py-3 border border-[#ff4747]/30 bg-[#ff4747]/5 text-[#ff4747]">
          <AlertCircle className="w-4 h-4 shrink-0" /><span className="text-[12px]">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notes, project…"
            className="w-full bg-surface-container border border-outline pl-9 pr-3 py-2.5 text-[12px] text-foreground focus:outline-none focus:border-primary"
          />
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground focus:outline-none focus:border-primary"
        >
          <option value="all">All Types</option>
          {UPDATE_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
        <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)}
          className="bg-surface-container border border-outline px-3 py-2.5 text-[12px] text-foreground focus:outline-none focus:border-primary"
        >
          <option value="all">All Projects</option>
          {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto">
        <div className="border border-outline bg-surface-low min-w-[800px]">
          <div className="grid grid-cols-[120px_160px_1fr_1fr_130px_130px_60px] gap-0 border-b border-outline bg-surface-container">
            {["Date", "Update Type", "Update", "Client Response", "Weekly", "Monthly", ""].map((h) => (
              <div key={h} className="px-4 py-3 text-[10px] tracking-[0.15em] uppercase text-foreground-muted font-bold border-r border-outline last:border-r-0">{h}</div>
            ))}
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-foreground-muted">
              <Loader2 className="w-5 h-5 animate-spin" /><span className="text-[12px] tracking-[0.1em] uppercase">Loading…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-foreground-muted">
              <FileText className="w-8 h-8 mb-3 opacity-40" />
              <p className="text-[12px] tracking-[0.1em] uppercase">No reports found</p>
            </div>
          ) : (
            <div className="divide-y divide-outline">
              {filtered.map((r) => (
                <div key={r.id} className="grid grid-cols-[120px_160px_1fr_1fr_130px_130px_60px] gap-0 hover:bg-surface-container transition-colors group">
                  <div className="px-4 py-3 border-r border-outline flex items-center">
                    <span className="text-[12px] text-foreground-muted">
                      {r.date ? new Date(r.date).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—"}
                    </span>
                  </div>
                  <div className="px-4 py-3 border-r border-outline flex items-center gap-1.5 flex-wrap">
                    {r.types.length === 0 ? <span className="text-[12px] text-foreground-muted">—</span> : r.types.map((t) => <TypeBadge key={t} typeKey={t} />)}
                  </div>
                  <div className="px-4 py-3 border-r border-outline flex items-center">
                    <p className="text-[12px] text-foreground line-clamp-2">{r.notes || <span className="text-foreground-muted">—</span>}</p>
                  </div>
                  <div className="px-4 py-3 border-r border-outline flex items-center">
                    <p className="text-[12px] text-foreground line-clamp-2">{r.clientResponse || <span className="text-foreground-muted">—</span>}</p>
                  </div>
                  <div className="px-4 py-3 border-r border-outline flex items-center">
                    <IncludedBadge value={r.weeklyIncluded} onChange={() => toggleField(r.id, "weeklyIncluded")} />
                  </div>
                  <div className="px-4 py-3 border-r border-outline flex items-center">
                    <IncludedBadge value={r.monthlyIncluded} onChange={() => toggleField(r.id, "monthlyIncluded")} />
                  </div>
                  <div className="px-3 py-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {can("reports", "update") && <button onClick={() => setModal({ type: "edit", report: r })} className="p-1.5 text-foreground-muted hover:text-foreground transition-colors"><Pencil className="w-3.5 h-3.5" /></button>}
                    {can("reports", "delete") && <button onClick={() => handleDelete(r.id)} className="p-1.5 text-foreground-muted hover:text-[#ff4747] transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modal?.type === "add" && <ReportModal projects={projects} onClose={() => setModal(null)} onSave={handleSave} saving={saving} />}
      {modal?.type === "edit" && <ReportModal initial={modal.report} projects={projects} onClose={() => setModal(null)} onSave={handleSave} saving={saving} />}
    </div>
  );
}

export default function DeptHeadReportsPage() {
  return (
    <PermissionGuard resource="reports" action="read">
      <DeptHeadReportsPageInner />
    </PermissionGuard>
  );
}
