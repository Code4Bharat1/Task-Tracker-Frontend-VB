"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import api, { clearAccessToken, setAccessToken } from "@/lib/api";
import { getRedirectPath } from "@/lib/auth/utils";

const AuthContext = createContext(null);

// Default permissions — all true so existing behaviour is preserved
// when no permissions are configured yet
const DEFAULT_PERMS = {
  projects:     { create: true, read: true, update: true, delete: true },
  tasks:        { create: true, read: true, update: true, delete: true },
  dailyLogs:    { create: true, read: true, update: true, delete: true },
  bugs:         { create: true, read: true, update: true, delete: true },
  reports:      { create: true, read: true, update: true, delete: true },
  ktDocuments:  { create: true, read: true, update: true, delete: true },
  leaderboard:  { create: false, read: true, update: false, delete: false },
  activityLogs: { create: false, read: true, update: false, delete: false },
  users:        { create: true, read: true, update: true, delete: true },
};

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState(DEFAULT_PERMS);

  async function loadPermissions(role, companyId) {
    // Admin always has full access — no need to fetch
    if (role === "admin" || role === "super_admin") {
      setPermissions(DEFAULT_PERMS);
      return;
    }
    try {
      const { data } = await api.get("/companies/permissions/roles");
      const roleKey = role === "department_head" ? "department_head" : "employee";
      const rolePerms = data?.rolePermissions?.[roleKey];
      if (rolePerms) {
        setPermissions({ ...DEFAULT_PERMS, ...rolePerms });
      }
    } catch {
      // fallback to defaults
      setPermissions(DEFAULT_PERMS);
    }
  }

  useEffect(() => {
    const hadSession =
      typeof window !== "undefined" && localStorage.getItem("hasSession");
    if (!hadSession) {
      setUser(false);
      setLoading(false);
      return;
    }
    api
      .post("/auth/refresh", {})
      .then(({ data }) => {
        setAccessToken(data.accessToken);
        return api.get("/auth/me");
      })
      .then(({ data }) => {
        const u = data.user;
        if (u && !u.role && u.globalRole) u.role = u.globalRole;
        if (u && !u._id && u.id) u._id = u.id;
        setUser(u);
        return loadPermissions(u.role || u.globalRole, u.companyId);
      })
      .catch(() => {
        localStorage.removeItem("hasSession");
        setUser(false);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(
    async (email, password) => {
      const { data } = await api.post("/auth/login", { email, password });

      if (data.requirePasswordChange) {
        return { requirePasswordChange: true, tempToken: data.tempToken };
      }

      setAccessToken(data.accessToken);
      const { data: meData } = await api.get("/auth/me");
      const u = meData.user;
      if (u && !u.role && u.globalRole) u.role = u.globalRole;
      if (u && !u._id && u.id) u._id = u.id;
      setUser(u);
      await loadPermissions(u.role || u.globalRole, u.companyId);
      localStorage.setItem("hasSession", "1");
      router.push(getRedirectPath(u.role));
      return { requirePasswordChange: false };
    },
    [router],
  );

  const logout = useCallback(() => {
    clearAccessToken();
    localStorage.removeItem("hasSession");
    setUser(false);
    setPermissions(DEFAULT_PERMS);
    router.replace("/login");
  }, [router]);

  // Helper: check if current user can perform action on resource
  function can(resource, action) {
    const role = user?.role || user?.globalRole;
    if (role === "admin" || role === "super_admin" || role === "lead") return true;
    return permissions?.[resource]?.[action] ?? true;
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser, permissions, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
