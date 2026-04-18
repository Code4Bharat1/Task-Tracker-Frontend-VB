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
  const [permState, setPermState] = useState({ permissions: DEFAULT_PERMS, loaded: false });
  const permissions = permState.permissions;
  const permissionsLoaded = permState.loaded;

  const loadPermissions = useCallback(async (role) => {
    if (role === "admin" || role === "super_admin" || role === "department_head") {
      setPermState({ permissions: DEFAULT_PERMS, loaded: true });
      return;
    }
    try {
      // 5 second timeout — never hang the app waiting for permissions
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const { data } = await api.get("/companies/permissions/roles", {
        params: { _t: Date.now() },
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      let roleKey;
      if (role === "lead") roleKey = "lead";
      else roleKey = "employee"; // contributor, reviewer, employee all use employee permissions

      const rolePerms = data?.rolePermissions?.[roleKey];

      if (rolePerms && Object.keys(rolePerms).length > 0) {
        const merged = {};
        for (const resource of Object.keys(DEFAULT_PERMS)) {
          if (rolePerms[resource] !== undefined) {
            merged[resource] = {
              create: rolePerms[resource].create ?? false,
              read:   rolePerms[resource].read   ?? false,
              update: rolePerms[resource].update ?? false,
              delete: rolePerms[resource].delete ?? false,
            };
          } else {
            merged[resource] = { create: false, read: false, update: false, delete: false };
          }
        }
        setPermState({ permissions: merged, loaded: true });
      } else {
        const denied = {};
        for (const resource of Object.keys(DEFAULT_PERMS)) {
          denied[resource] = { create: false, read: false, update: false, delete: false };
        }
        setPermState({ permissions: denied, loaded: true });
      }
    } catch (err) {
      console.error("[permissions] Failed to load permissions:", err?.response?.status, err?.message);
      const denied = {};
      for (const resource of Object.keys(DEFAULT_PERMS)) {
        denied[resource] = { create: false, read: false, update: false, delete: false };
      }
      setPermState({ permissions: denied, loaded: true });
    }
  }, []);

  useEffect(() => {
    const hadSession =
      typeof window !== "undefined" && localStorage.getItem("hasSession");
    if (!hadSession) {
      setUser(false);
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const { data: refreshData } = await api.post("/auth/refresh", {});
        setAccessToken(refreshData.accessToken);
        const { data: meData } = await api.get("/auth/me");
        const u = meData.user;
        if (u && !u.role && u.globalRole) u.role = u.globalRole;
        if (u && !u._id && u.id) u._id = u.id;
        setUser(u);
        await loadPermissions(u.role || u.globalRole);
      } catch {
        localStorage.removeItem("hasSession");
        setUser(false);
        // Ensure permissions are marked loaded so nothing stays stuck
        setPermState({ permissions: DEFAULT_PERMS, loaded: true });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Refresh permissions when tab regains focus (picks up admin changes without re-login)
  useEffect(() => {
    function handleFocus() {
      const role = user?.role || user?.globalRole;
      if (role && role !== "admin" && role !== "super_admin") {
        loadPermissions(role);
      }
    }
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [user, loadPermissions]);

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
      await loadPermissions(u.role || u.globalRole);
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
    setPermState({ permissions: DEFAULT_PERMS, loaded: false });
    router.replace("/login");
  }, [router]);

  // Helper: check if current user can perform action on resource
  function can(resource, action) {
    const role = user?.role || user?.globalRole;
    if (role === "admin" || role === "super_admin") return true;
    // department_head always gets full access (not permission-restricted)
    if (role === "department_head") return true;
    return permissions?.[resource]?.[action] ?? false;
  }

  return (
    <AuthContext.Provider value={{ user, loading, permissionsLoaded, login, logout, setUser, permissions, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
