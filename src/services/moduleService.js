/**
 * moduleService.js
 *
 * SERVICE LAYER for Module Management.
 * Field names match modules.model.js exactly.
 *
 * ─── TO SWITCH TO REAL API ───────────────────────────────────
 * 1. Delete all MOCK_* arrays and SIMULATE_DELAY
 * 2. Uncomment `import api` line
 * 3. Replace each function body with the real API call shown.
 * ─────────────────────────────────────────────────────────────
 *
 * ─── MODEL REFERENCE (modules.model.js) ──────────────────────
 * _id            ObjectId
 * projectId      ObjectId  → ref: Project
 * title          String
 * description    String
 * status         String    enum: ["TODO","IN_PROGRESS","DEV_COMPLETE","CODE_REVIEW","QA_TESTING","APPROVED","DEPLOYED"]
 * assignedTo     ObjectId  → ref: User (DEVELOPER)
 * assignedName   String
 * deadline       Date
 * created_at     Date
 * updated_at     Date
 * ─────────────────────────────────────────────────────────────
 */

import api from "@/lib/api";

// Module lifecycle from SRS §9
export const MODULE_STATUSES = [
  "TODO",
  "IN_PROGRESS",
  "DEV_COMPLETE",
  "CODE_REVIEW",
  "QA_TESTING",
  "APPROVED",
  "DEPLOYED",
];

export const MODULE_STATUS_META = {
  TODO: {
    label: "To Do",
    color: "text-foreground-muted",
    bg: "bg-[#666]/10",
    border: "border-[#666]/20",
    next: "IN_PROGRESS",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "text-[#47c8ff]",
    bg: "bg-[#47c8ff]/10",
    border: "border-[#47c8ff]/20",
    next: "DEV_COMPLETE",
  },
  DEV_COMPLETE: {
    label: "Dev Complete",
    color: "text-[#e8a847]",
    bg: "bg-[#e8a847]/10",
    border: "border-[#e8a847]/20",
    next: "CODE_REVIEW",
  },
  CODE_REVIEW: {
    label: "Code Review",
    color: "text-[#f87343]",
    bg: "bg-[#f87343]/10",
    border: "border-[#f87343]/20",
    next: "QA_TESTING",
  },
  QA_TESTING: {
    label: "QA Testing",
    color: "text-[#c847ff]",
    bg: "bg-[#c847ff]/10",
    border: "border-[#c847ff]/20",
    next: "APPROVED",
  },
  APPROVED: {
    label: "Approved",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
    next: "DEPLOYED",
  },
  DEPLOYED: {
    label: "Deployed",
    color: "text-[#47ff8a]",
    bg: "bg-[#47ff8a]/10",
    border: "border-[#47ff8a]/20",
    next: null,
  },
};

// ─── Mock Data ────────────────────────────────────────────────
let MOCK_MODULES = [
  // Project p1 — Website Redesign
  {
    _id: "m1",
    projectId: "p1",
    title: "Homepage Layout",
    description:
      "Design and implement the new homepage layout with hero section.",
    status: "DEPLOYED",
    assignedTo: "u3",
    assignedName: "Ali Hassan",
    deadline: "2024-03-15",
    created_at: "2024-02-05T00:00:00Z",
  },
  {
    _id: "m2",
    projectId: "p1",
    title: "Navigation Component",
    description: "Reusable sticky navigation with mobile responsive menu.",
    status: "DEPLOYED",
    assignedTo: "u8",
    assignedName: "Zara Siddiqui",
    deadline: "2024-03-10",
    created_at: "2024-02-05T00:00:00Z",
  },
  {
    _id: "m3",
    projectId: "p1",
    title: "Contact Form & Validation",
    description: "Server-validated contact form with email notifications.",
    status: "APPROVED",
    assignedTo: "u3",
    assignedName: "Ali Hassan",
    deadline: "2024-03-20",
    created_at: "2024-02-10T00:00:00Z",
  },
  {
    _id: "m4",
    projectId: "p1",
    title: "Blog Section",
    description: "Dynamic blog listing with pagination and tag filtering.",
    status: "CODE_REVIEW",
    assignedTo: "u8",
    assignedName: "Zara Siddiqui",
    deadline: "2024-04-01",
    created_at: "2024-02-10T00:00:00Z",
  },
  {
    _id: "m5",
    projectId: "p1",
    title: "SEO Optimization",
    description: "Meta tags, sitemap, structured data for all pages.",
    status: "IN_PROGRESS",
    assignedTo: "u3",
    assignedName: "Ali Hassan",
    deadline: "2024-04-15",
    created_at: "2024-02-15T00:00:00Z",
  },
  {
    _id: "m6",
    projectId: "p1",
    title: "Performance Audit",
    description: "Lighthouse audit and Core Web Vitals optimization.",
    status: "TODO",
    assignedTo: "u8",
    assignedName: "Zara Siddiqui",
    deadline: "2024-05-01",
    created_at: "2024-02-15T00:00:00Z",
  },
  // Project p2 — Mobile App
  {
    _id: "m7",
    projectId: "p2",
    title: "Auth Module",
    description: "JWT-based login, register, and password reset flow.",
    status: "DEPLOYED",
    assignedTo: "u3",
    assignedName: "Ali Hassan",
    deadline: "2024-02-15",
    created_at: "2024-01-20T00:00:00Z",
  },
  {
    _id: "m8",
    projectId: "p2",
    title: "Dashboard Screen",
    description: "Main app dashboard with stats cards and quick actions.",
    status: "DEPLOYED",
    assignedTo: "u7",
    assignedName: "Bilal Ahmed",
    deadline: "2024-02-20",
    created_at: "2024-01-20T00:00:00Z",
  },
  {
    _id: "m9",
    projectId: "p2",
    title: "Push Notifications",
    description: "FCM integration for real-time push alerts.",
    status: "CODE_REVIEW",
    assignedTo: "u7",
    assignedName: "Bilal Ahmed",
    deadline: "2024-03-10",
    created_at: "2024-02-01T00:00:00Z",
  },
  // Project p3 — HR Portal
  {
    _id: "m10",
    projectId: "p3",
    title: "Employee Directory",
    description: "Searchable employee directory with profile pages.",
    status: "APPROVED",
    assignedTo: "u9",
    assignedName: "Hassan Raza",
    deadline: "2024-04-01",
    created_at: "2024-03-05T00:00:00Z",
  },
  {
    _id: "m11",
    projectId: "p3",
    title: "Leave Management",
    description: "Request, approve, and track employee leave.",
    status: "QA_TESTING",
    assignedTo: "u10",
    assignedName: "Nadia Iqbal",
    deadline: "2024-04-15",
    created_at: "2024-03-05T00:00:00Z",
  },
  // Project p4 — Design System
  {
    _id: "m12",
    projectId: "p4",
    title: "Color Tokens",
    description: "Define and export all color design tokens.",
    status: "IN_PROGRESS",
    assignedTo: "u6",
    assignedName: "Ayesha Malik",
    deadline: "2024-05-01",
    created_at: "2024-04-10T00:00:00Z",
  },
  {
    _id: "m13",
    projectId: "p4",
    title: "Button Components",
    description: "Primary, secondary, ghost, danger button variants.",
    status: "TODO",
    assignedTo: "u6",
    assignedName: "Ayesha Malik",
    deadline: "2024-05-15",
    created_at: "2024-04-10T00:00:00Z",
  },
];

// ─── Service Functions ────────────────────────────────────────

/**
 * Get all modules for a project
 * Real API → GET /modules?projectId=
 */
export async function getModules(projectId) {
  const { data } = await api.get(`/modules`, { params: { projectId } });
  return data.data ?? data.modules ?? (Array.isArray(data) ? data : []);
}

/**
 * Get all modules assigned to the current user
 * Real API → GET /modules?assignedTo=:userId
 */
export async function getMyModules(userId) {
  const { data } = await api.get("/modules", { params: { assignedTo: userId, limit: 100 } });
  return data.data ?? data.modules ?? (Array.isArray(data) ? data : []);
}

/**
 * Create a new module
 * Real API → POST /modules
 */
export async function createModule(projectId, payload) {
  const { data } = await api.post(`/modules`, { projectId, ...payload });
  return data.module ?? data;
}

/**
 * Update a module
 * Real API → PATCH /modules/:id
 */
export async function updateModule(id, payload) {
  const { data } = await api.patch(`/modules/${id}`, payload);
  return data.module ?? data;
}

/**
 * Advance a module to its next status
 * Real API → PATCH /modules/:id/advance
 */
export async function advanceModuleStatus(id) {
  const { data } = await api.patch(`/modules/${id}/advance`);
  return data.module ?? data;
}

/**
 * Delete a module
 * Real API → DELETE /modules/:id
 */
export async function deleteModule(id) {
  await api.delete(`/modules/${id}`);
}
