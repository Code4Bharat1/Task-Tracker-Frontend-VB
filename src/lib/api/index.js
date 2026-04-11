import axios from "axios";

const COOKIE_NAME = "access_token";
const COOKIE_MAX_AGE = 60 * 15; // 15 minutes (matches typical JWT expiry)

// ─── Cookie helpers ───────────────────────────────────────────
function setCookie(value) {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Strict`;
}

function getCookie() {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${COOKIE_NAME}=`));
  return match ? match.split("=")[1] : null;
}

function deleteCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Strict`;
}

// ─── Public API ───────────────────────────────────────────────
export function setAccessToken(token) {
  setCookie(token);
}

export function clearAccessToken() {
  deleteCookie();
}

export function getTokenPayload() {
  const token = getCookie();
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch { return null; }
}

// ─── Axios instance ───────────────────────────────────────────
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1",
  withCredentials: true, // send httpOnly refreshToken cookie
});

// Attach access token from cookie to every request
api.interceptors.request.use((config) => {
  const token = getCookie();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Token refresh queue ──────────────────────────────────────
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
}

// ─── Response interceptor ─────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Never intercept the login endpoint — 401 there means wrong credentials
      if (originalRequest.url?.includes("/auth/login")) {
        return Promise.reject(error);
      }
      // No session — don't attempt refresh
      if (typeof window !== "undefined" && !localStorage.getItem("hasSession")) {
        clearAccessToken();
        window.location.replace("/login");
        return Promise.reject(error);
      }
      // Refresh endpoint itself failed — clear and redirect
      if (originalRequest.url?.includes("/auth/refresh")) {
        clearAccessToken();
        if (typeof window !== "undefined") {
          localStorage.removeItem("hasSession");
          window.location.replace("/login");
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
        const { data } = await axios.post(
          `${base}/auth/refresh`,
          {},
          { withCredentials: true },
        );

        setAccessToken(data.accessToken);
        processQueue(null, data.accessToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAccessToken();
        if (typeof window !== "undefined") {
          localStorage.removeItem("hasSession");
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
