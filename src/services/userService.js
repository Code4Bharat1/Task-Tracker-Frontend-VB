/**
 * userService.js
 *
 * SERVICE LAYER for User Management.
 * Field names match users.model.js exactly.
 *
 * ─── TO SWITCH TO REAL API ───────────────────────────────────
 * 1. Delete MOCK_USERS, MOCK_DEPARTMENTS and SIMULATE_DELAY
 * 2. Uncomment `import api` line
 * 3. Replace each function body with the real API call shown
 *    in the comment above it.
 * Pages don't need to change at all.
 * ─────────────────────────────────────────────────────────────
 *
 * ─── MODEL REFERENCE (users.model.js) ────────────────────────
 * _id              ObjectId
 * companyId        ObjectId  → ref: Company
 * departmentId     ObjectId  → ref: Department (nullable)
 * name             String
 * email            String    (lowercase, unique)
 * globalRole       String    enum: ["admin","department_head","employee"]
 * isActive         Boolean   (true = active, false = inactive)
 * mustChangePassword Boolean
 * created_at       Date
 * updated_at       Date
 * ─────────────────────────────────────────────────────────────
 *
 * ─── MODEL REFERENCE (departments.model.js) ──────────────────
 * _id              ObjectId
 * companyId        ObjectId  → ref: Company
 * departmentName   String    (lowercase)
 * created_at       Date
 * ─────────────────────────────────────────────────────────────
 */

import api from "@/lib/api";

// ─── Service Functions (real API) ────────────────────────────

/**
 * Fetch all departments (used to populate department dropdown)
 * Real API → GET /departments
 */
export async function getDepartments() {
  const { data } = await api.get("/departments");
  return data.allDepartments ?? data.departments ?? [];
}

/**
 * Fetch all users.
 * Admins/dept-heads → GET /users (full list)
 * Employees/PMs/etc → GET /users/colleagues (read-only, same company)
 */
export async function getUsers({ filterRole, limit, page, search } = {}) {
  try {
    const { data } = await api.get("/users", {
      params: { filterRole, limit, page, search },
    });
    return data.data ?? data.users ?? [];
  } catch (err) {
    if (err?.response?.status === 403) {
      const { data } = await api.get("/users/colleagues");
      return data.data ?? [];
    }
    throw err;
  }
}

/**
 * Create a new user
 * Real API → POST /users
 *
 * Payload: { name, email, globalRole, departmentId, isActive }
 */
export async function createUser(payload) {
  const { data } = await api.post("/users", payload);
  return data.user;
}

/**
 * Update an existing user
 * Real API → PATCH /users/:id
 *
 * Payload: { name?, email?, globalRole?, departmentId?, isActive? }
 */
export async function updateUser(id, payload) {
  const { data } = await api.patch(`/users/${id}`, payload);
  return data.user;
}

/**
 * Delete a user
 * Real API → DELETE /users/:id
 */
export async function deleteUser(id) {
  await api.delete(`/users/${id}`);
  return { success: true };
}

/**
 * Update own profile (any authenticated user)
 * Real API → PATCH /users/me
 */
export async function updateMe(payload) {
  const { data } = await api.patch("/users/me", payload);
  return data.user;
}

/**
 * Upload profile picture
 * Real API → POST /users/:id/profile-pic
 */
export async function uploadProfilePic(id, file) {
  const form = new FormData();
  form.append("profilePic", file);
  const { data } = await api.post(`/users/${id}/profile-pic`, form);
  return data.user;
}

