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
  console.log("departments", data);
  return data.allDepartments ?? data.departments ?? [];
}

/**
 * Fetch all users in a specific department
 * Real API → GET /departments/:id/members
 */
export async function getDepartmentMembers(departmentId) {
  const { data } = await api.get(`/departments/${departmentId}/members`);
  console.log("Department members response:", data);
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
    body.name = payload.newHeadName.trim();
    body.email = payload.newHeadEmail.trim().toLowerCase();
  }
  console.log(body);

  const { data } = await api.post("/departments", body);
  // backend returns { departments: <dept_doc>, user: <head_user_doc> }
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
    // If removing head, call server endpoint to clear head if available.
    // Fallback: refetch department
    const { data } = await api.get(`/departments/${departmentId}`);
    return data.depaartment ?? data.department;
  }

  await api.patch(`/users/${userId}`, {
    globalRole: "department_head",
    departmentId,
  });
  const { data } = await api.get(`/departments/${departmentId}`);
  return data.depaartment ?? data.department;
}

/**
 * Delete a department
 * Real API → DELETE /departments/:id
 */
export async function deleteDepartment(id) {
  await api.delete(`/departments/${id}`);
  return { success: true };
}
