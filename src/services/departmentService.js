/**
 * departmentService.js
 *
 * SERVICE LAYER for Department Management.
 * Field names match departments.model.js + users.model.js exactly.
 *
 * ─── TO SWITCH TO REAL API ───────────────────────────────────
 * 1. Delete all MOCK_* arrays and SIMULATE_DELAY
 * 2. Uncomment `import api` line
 * 3. Replace each function body with the real API call shown
 *    in the comment above it.
 * Pages don't need to change at all.
 * ─────────────────────────────────────────────────────────────
 *
 * ─── MODEL REFERENCE (departments.model.js) ──────────────────
 * _id             ObjectId
 * companyId       ObjectId  → ref: Company
 * departmentName  String    (lowercase, trimmed, unique per company)
 * created_at      Date
 * updated_at      Date
 *
 * NOTE: No status, no head, no employee count on this model.
 * - Department head  → derived from users where globalRole = "department_head"
 *                      and departmentId matches
 * - Employee count   → derived from users where departmentId matches
 * ─────────────────────────────────────────────────────────────
 */

import api from "@/lib/api";

/**
 * Fetch all departments
 * Real API → GET /departments
 */
export async function getDepartments() {
  const { data } = await api.get("/departments");
  return data.allDepartments ?? data.departments ?? [];
}

/**
 * Fetch all users in a specific department
 * Real API → GET /departments/:id/members
 */
export async function getDepartmentMembers(departmentId) {
  const { data } = await api.get(`/departments/${departmentId}/members`);
  return data.members ?? data.users ?? [];
}

/**
 * Create a new department
 * Real API → POST /departments
 *
 * Payload: { departmentName }
 */
export async function createDepartment(payload) {
  const body = {
    departmentName: payload.departmentName.toLowerCase().trim(),
  };

  if (payload.newHeadName && payload.newHeadEmail) {
    // Create department + new head user
    body.name = payload.newHeadName.trim();
    body.email = payload.newHeadEmail.trim().toLowerCase();
  } else if (payload.headId) {
    // Create department + assign existing user as head
    body.headId = payload.headId;
  }
  // else: create department only — no head

  const { data } = await api.post("/departments", body);
  return {
    department: data.departments ?? data.department ?? null,
    head: data.user ?? null,
  };
}

/**
 * Update a department name
 * Real API → PATCH /departments/:id
 */
export async function updateDepartment(id, payload) {
  const { data } = await api.patch(`/departments/${id}`, {
    departmentName: payload.departmentName.toLowerCase().trim(),
  });
  return data.department;
}

/**
 * Assign a department head by promoting the user to `department_head`.
 * Real API → PATCH /users/:userId  { globalRole: "department_head", departmentId }
 * Returns updated department (backend should return enriched department).
 */
export async function assignDepartmentHead(departmentId, userId) {
  if (!userId) {
    const { data } = await api.get(`/departments/${departmentId}`);
    return data.depaartment ?? data.department ?? null;
  }
  await api.patch(`/users/${userId}`, {
    globalRole: "department_head",
    departmentId,
  });
  const { data } = await api.get(`/departments/${departmentId}`);
  return data.depaartment ?? data.department ?? null;
}

/**
 * Delete a department
 * Real API → DELETE /departments/:id
 */
export async function deleteDepartment(id) {
  await api.delete(`/departments/${id}`);
  return { success: true };
}
