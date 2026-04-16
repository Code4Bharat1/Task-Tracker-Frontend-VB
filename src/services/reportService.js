import api from "@/lib/api";

export async function getMyReports() {
  const { data } = await api.get("/reports/my-reports");
  return data?.data ?? [];
}

export async function getReports() {
  const { data } = await api.get("/reports");
  return data?.data ?? [];
}

export async function createReport(payload) {
  const { data } = await api.post("/reports", payload);
  return data?.data ?? data;
}

export async function updateReport(id, payload) {
  const { data } = await api.patch(`/reports/${id}`, payload);
  return data?.data ?? data;
}

export async function deleteReport(id) {
  const { data } = await api.delete(`/reports/${id}`);
  return data?.success ?? true;
}
