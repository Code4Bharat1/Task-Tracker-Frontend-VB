import api from "@/lib/api";

// Get all daily logs (admin / dept-head view) – GET /daily-logs
export async function getAllLogs({ date, projectId, userId } = {}) {
  const { data } = await api.get("/daily-logs", {
    params: { date, projectId, userId },
  });
  return data.data ?? data.logs ?? (Array.isArray(data) ? data : []);
}

// Get logs for the current user – GET /daily-logs (backend filters by role)
export async function getMyLogs() {
  const { data } = await api.get("/daily-logs");
  return data.data ?? data.logs ?? (Array.isArray(data) ? data : []);
}

// Get today's log – GET /daily-logs/today
export async function getTodayLog() {
  const { data } = await api.get("/daily-logs/today");
  return data.log ?? data.data ?? null;
}

// Submit a new log – POST /daily-logs
export async function submitLog(payload) {
  const { data } = await api.post("/daily-logs", payload);
  return data.log ?? data;
}

// Update a log – PATCH /daily-logs/:id
export async function updateLog(id, payload) {
  const { data } = await api.patch(`/daily-logs/${id}`, payload);
  return data.log ?? data;
}

// Delete a log – DELETE /daily-logs/:id
export async function deleteLog(id) {
  const { data } = await api.delete(`/daily-logs/${id}`);
  return data;
}
