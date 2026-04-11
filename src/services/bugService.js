/**
 * bugService.js
 *
 * SERVICE LAYER for Bug Management.
 * Field names match bugs.model.js exactly.
 *
 * ─── TO SWITCH TO REAL API ───────────────────────────────────
 * 1. Delete all MOCK_* arrays and SIMULATE_DELAY
 * 2. Uncomment `import api` line
 * 3. Replace each function body with the real API call shown.
 * ─────────────────────────────────────────────────────────────
 *
 * ─── MODEL REFERENCE (bugs.model.js) ─────────────────────────
 * _id            ObjectId
 * projectId      ObjectId  → ref: Project
 * projectName    String
 * moduleId       ObjectId  → ref: Module
 * moduleTitle    String
 * reportedBy     ObjectId  → ref: User (TESTER)
 * reportedByName String
 * assignedTo     ObjectId  → ref: User (DEVELOPER)
 * assignedToName String
 * title          String
 * description    String
 * severity       String    enum: ["LOW","MEDIUM","HIGH","CRITICAL"]
 * status         String    enum: ["OPEN","IN_PROGRESS","RESOLVED","CLOSED","REOPENED"]
 * created_at     Date
 * updated_at     Date
 * ─────────────────────────────────────────────────────────────
 */

import api from "@/lib/api";

export const BUG_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export const BUG_SEVERITY_META = {
  LOW: {
    label: "Low",
    color: "text-[#47c8ff]",
    bg: "bg-[#47c8ff]/10",
    border: "border-[#47c8ff]/20",
  },
  MEDIUM: {
    label: "Medium",
    color: "text-[#e8a847]",
    bg: "bg-[#e8a847]/10",
    border: "border-[#e8a847]/20",
  },
  HIGH: {
    label: "High",
    color: "text-[#f87343]",
    bg: "bg-[#f87343]/10",
    border: "border-[#f87343]/20",
  },
  CRITICAL: {
    label: "Critical",
    color: "text-[#ff4747]",
    bg: "bg-[#ff4747]/10",
    border: "border-[#ff4747]/20",
  },
};

export const BUG_STATUS_META = {
  OPEN: {
    label: "Open",
    color: "text-[#ff4747]",
    bg: "bg-[#ff4747]/10",
    border: "border-[#ff4747]/20",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "text-[#47c8ff]",
    bg: "bg-[#47c8ff]/10",
    border: "border-[#47c8ff]/20",
  },
  RESOLVED: {
    label: "Resolved",
    color: "text-[#47ff8a]",
    bg: "bg-[#47ff8a]/10",
    border: "border-[#47ff8a]/20",
  },
  CLOSED: {
    label: "Closed",
    color: "text-foreground-muted",
    bg: "bg-[#666]/10",
    border: "border-[#666]/20",
  },
  REOPENED: {
    label: "Reopened",
    color: "text-[#c847ff]",
    bg: "bg-[#c847ff]/10",
    border: "border-[#c847ff]/20",
  },
};

/**
 * Get all bugs (admin/dept head view)
 * Real API → GET /bugs
 */
export async function getAllBugs({ projectId, status, severity } = {}) {
  const { data } = await api.get("/bugs", {
    params: { projectId, status, severity },
  });
  return data.bugs ?? [];
}

/**
 * Get bugs assigned to the current developer
 * Real API → GET /bugs/my-bugs
 */
export async function getMyBugs() {
  const { data } = await api.get("/bugs/my-bugs");
  return data.bugs ?? [];
}

/**
 * Get bugs reported by the current tester
 * Real API → GET /bugs/reported-by-me
 */
export async function getBugsReportedByMe() {
  const { data } = await api.get("/bugs/reported-by-me");
  return data.bugs ?? [];
}

/**
 * Create a new bug report
 * Real API → POST /bugs
 */
export async function createBug(payload) {
  const { data } = await api.post("/bugs", payload);
  return data.bug ?? data;
}

/**
 * Update a bug (status change, reassign, etc.)
 * Real API → PATCH /bugs/:id
 */
export async function updateBug(id, payload) {
  const { data } = await api.patch(`/bugs/${id}`, payload);
  return data.bug ?? data;
}

/**
 * Delete a bug
 * Real API → DELETE /bugs/:id
 */
export async function deleteBug(id) {
  await api.delete(`/bugs/${id}`);
}
