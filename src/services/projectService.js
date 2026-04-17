/**
 * projectService.js
 *
 * SERVICE LAYER for Project Management.
 * Field names match projects.model.js exactly.
 *
 * ─── TO SWITCH TO REAL API ───────────────────────────────────
 * 1. Delete all MOCK_* arrays and SIMULATE_DELAY
 * 2. Uncomment `import api` line
 * 3. Replace each function body with the real API call shown
 *    in the comment above it.
 * Pages don't need to change at all.
 * ─────────────────────────────────────────────────────────────
 *
 * ─── MODEL REFERENCE (projects.model.js) ─────────────────────
 * _id            ObjectId
 * companyId      ObjectId  → ref: Company
 * departmentId   ObjectId  → ref: Department
 * name           String
 * description    String
 * status         String    enum: ["PLANNING","IN_PROGRESS","CODE_REVIEW","QA_TESTING","APPROVED","DEPLOYED"]
 * managerId      ObjectId  → ref: User (PROJECT_MANAGER)
 * testerId       ObjectId  → ref: User (TESTER)
 * developerIds   [ObjectId] → ref: User[] (DEVELOPERS)
 * deadline       Date
 * created_at     Date
 * updated_at     Date
 * ─────────────────────────────────────────────────────────────
 */

import api from "@/lib/api";

function normalizeProjectsResponse(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.projects)) return data.projects;
  if (Array.isArray(data.data?.projects)) return data.data.projects;
  return [];
}

/**
 * Get all projects (optionally filtered by departmentId)
 * Real API → GET /projects?departmentId=...
 */
export async function getProjects({ departmentId } = {}) {
  const { data } = await api.get("/projects", { params: { departmentId } });
  return normalizeProjectsResponse(data);
}

/**
 * Get a single project by ID
 * Real API → GET /projects/:id
 */
export async function getProject(id) {
  const { data } = await api.get(`/projects/${id}`);
  return data?.project ?? data;
}

/**
 * Get projects assigned to a specific user (as PM, developer, or tester)
 * Real API → GET /projects/my-projects
 */
export async function getMyProjects() {
  const { data } = await api.get("/projects/my-projects");
  return normalizeProjectsResponse(data);
}

/**
 * Create a new project
 * Real API → POST /projects
 */
export async function createProject(payload) {
  const { data } = await api.post("/projects", payload);
  return data?.project ?? data;
}

/**
 * Update a project
 * Real API → PATCH /projects/:id
 */
export async function updateProject(id, payload) {
  const { data } = await api.patch(`/projects/${id}`, payload);
  return data?.project ?? data;
}

/**
 * Delete a project
 * Real API → DELETE /projects/:id
 */
export async function deleteProject(id) {
  await api.delete(`/projects/${id}`);
}

/**
 * Assign team members to a project (PM, Tester, Developers)
 * Real API → PATCH /projects/:id/team
 */
export async function assignProjectTeam(id, teamPayload) {
  const { data } = await api.patch(`/projects/${id}/team`, teamPayload);
  return data?.project ?? data;
}

/**
 * Update a specific testing phase on a project (tester/PM only)
 * Real API → PATCH /projects/:id/testing-phases
 */
export async function updateTestingPhase(id, phaseIndex, status) {
  const { data } = await api.patch(`/projects/${id}/testing-phases`, {
    phaseIndex,
    status,
  });
  return data?.project ?? data;
}

/**
 * Upload SRS document for a project (department_head only)
 * Real API → POST /projects/:id/srs
 */
export async function uploadProjectSrs(id, file) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post(`/projects/${id}/srs`, form);
  return data?.project ?? data;
}

/**
 * Delete SRS document from a project (department_head only)
 * Real API → DELETE /projects/:id/srs
 */
export async function deleteProjectSrs(id) {
  const { data } = await api.delete(`/projects/${id}/srs`);
  return data?.project ?? data;
}
