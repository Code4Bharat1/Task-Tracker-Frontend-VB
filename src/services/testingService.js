/**
 * testingService.js
 *
 * SERVICE LAYER for Testing Lifecycle.
 * Maps to SRS §12 — Testing Process.
 *
 * ─── Testing Phases (SRS §12) ────────────────────────────────
 * Phase              Weight
 * Frontend Testing   25%
 * Backend Testing    25%
 * Cybersecurity      25%
 * SEO / Performance  25%
 * ─────────────────────────────────────────────────────────────
 */

import api from "@/lib/api";

export const TESTING_PHASES = [
  { key: "frontend", label: "Frontend Testing", weight: 25 },
  { key: "backend", label: "Backend Testing", weight: 25 },
  { key: "security", label: "Cybersecurity Testing", weight: 25 },
  { key: "seo", label: "SEO / Performance", weight: 25 },
];

/**
 * Get test results for a project
 * Real API → GET /projects/:projectId/test-results
 */
export async function getTestResults(projectId) {
  const { data } = await api.get(`/projects/${projectId}/test-results`);
  return data.results || data.testResults || [];
}

/**
 * Get all test results for the tester
 * Real API → GET /test-results/my-results
 */
export async function getMyTestResults() {
  const { data } = await api.get(`/test-results/my-results`);
  return data.results || data.testResults || [];
}

/**
 * Submit or update a test result for a project
 * Real API → POST /projects/:projectId/test-results
 */
export async function submitTestResult(projectId, payload) {
  const { data } = await api.post(
    `/projects/${projectId}/test-results`,
    payload,
  );
  return data.result || data.testResult || data;
}
