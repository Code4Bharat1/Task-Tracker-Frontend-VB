/**
 * taskService.js
 *
 * SERVICE LAYER for Task Management.
 * Field names match task.model.js exactly.
 *
 * ─── MODEL REFERENCE ──────────────────────────────────────────
 * _id           ObjectId
 * projectId     ObjectId  → ref: Project
 * title         String
 * description   String
 * priority      String    enum: ["LOW","MEDIUM","HIGH"]
 * status        String    enum: ["TODO","IN_PROGRESS","IN_REVIEW","DONE","REJECTED"]
 * contributors  [{ userId: ObjectId, assignedAt: Date }]
 * reviewers     [{ userId: ObjectId, assignedAt: Date }]
 * completionNote String
 * deadline      Date
 * completedAt   Date
 * created_by    ObjectId  → ref: User
 * ─────────────────────────────────────────────────────────────
 */

import api from "@/lib/api";

export const TASK_STATUSES = [
  "TODO",
  "DONE",
];

export const TASK_PRIORITY_META = {
  LOW: {
    label: "Low",
    color: "text-foreground-muted",
    bg: "bg-foreground/10",
    border: "border-foreground/15",
  },
  MEDIUM: {
    label: "Medium",
    color: "text-[#47c8ff]",
    bg: "bg-[#47c8ff]/10",
    border: "border-[#47c8ff]/20",
  },
  HIGH: {
    label: "High",
    color: "text-[#ff4747]",
    bg: "bg-[#ff4747]/10",
    border: "border-[#ff4747]/20",
  },
};

export const TASK_STATUS_META = {
  TODO: {
    label: "Pending",
    color: "text-foreground-muted",
    bg: "bg-foreground/10",
    border: "border-foreground/15",
    next: "IN_PROGRESS",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "text-[#47c8ff]",
    bg: "bg-[#47c8ff]/10",
    border: "border-[#47c8ff]/30",
    next: "DONE",
  },
  DONE: {
    label: "Completed",
    color: "text-[#10b981]",
    bg: "bg-[#10b981]/10",
    border: "border-[#10b981]/30",
    next: null,
  },
  REJECTED: {
    label: "Rejected",
    color: "text-[#ff4747]",
    bg: "bg-[#ff4747]/10",
    border: "border-[#ff4747]/20",
    next: null,
  },
};

/**
 * Get all tasks for a project — GET /tasks?projectId=
 */
export async function getTasks(projectId, params = {}) {
  const { data } = await api.get("/tasks", {
    params: { ...(projectId ? { projectId } : {}), ...params },
  });
  return data.data ?? data.tasks ?? (Array.isArray(data) ? data : []);
}

/**
 * Get tasks assigned to the current user (as contributor or reviewer)
 * GET /tasks?assignedTo=:userId
 */
export async function getMyTasks(userId) {
  const { data } = await api.get("/tasks", {
    params: { assignedTo: userId, limit: 100 },
  });
  return data.data ?? data.tasks ?? (Array.isArray(data) ? data : []);
}

/**
 * Get a single task — GET /tasks/:id
 */
export async function getTaskById(id) {
  const { data } = await api.get(`/tasks/${id}`);
  return data.task ?? data;
}

/**
 * Create a new task (Lead only) — POST /tasks
 */
export async function createTask(projectId, payload) {
  const { data } = await api.post("/tasks", { projectId, ...payload });
  return data.task ?? data;
}

/**
 * Update task fields — PATCH /tasks/:id
 */
export async function updateTask(id, payload) {
  const { data } = await api.patch(`/tasks/${id}`, payload);
  return data.task ?? data;
}

/**
 * Assign / replace contributors and reviewers (Lead only)
 * PATCH /tasks/:id/assign
 */
export async function assignTask(id, { contributors, reviewers }) {
  const { data } = await api.patch(`/tasks/${id}/assign`, {
    contributors,
    reviewers,
  });
  return data.task ?? data;
}

/**
 * Advance a task to its next status — PATCH /tasks/:id/advance
 */
export async function advanceTaskStatus(id) {
  const { data } = await api.patch(`/tasks/${id}/advance`);
  return data.task ?? data;
}

/**
 * Start tester review timing — PATCH /tasks/:id/start-review
 */
export async function startTesterReview(id) {
  const { data } = await api.patch(`/tasks/${id}/start-review`);
  return data.task ?? data;
}

/**
 * Delete a task (Lead only) — DELETE /tasks/:id
 */
export async function deleteTask(id) {
  await api.delete(`/tasks/${id}`);
}

/**
 * Upload an attachment to a task — POST /tasks/:id/attachments
 */
export async function uploadTaskAttachment(id, file) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post(`/tasks/${id}/attachments`, form);
  return data.task ?? data;
}

/**
 * Delete an attachment from a task — DELETE /tasks/:id/attachments
 */
export async function deleteTaskAttachment(id, publicId) {
  const { data } = await api.delete(`/tasks/${id}/attachments`, {
    data: { publicId },
  });
  return data.task ?? data;
}
