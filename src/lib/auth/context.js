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

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // const [user, setUser] = useState({
  //   _id: "u3",
  //   name: "Ali Hassan",
  //   email: "ali@company.com",
  //   role: "admin",
  // }); // ✅ back to null
  // const [loading, setLoading] = useState(false); // ✅ back to true

  // ✅ Real session restore — only attempt if user previously logged in
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
        // normalize: backend may expose globalRole instead of role
        if (u && !u.role && u.globalRole) u.role = u.globalRole;
        // normalize: backend returns id not _id
        if (u && !u._id && u.id) u._id = u.id;
        setUser(u);
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
      // normalize: backend may expose globalRole instead of role
      if (u && !u.role && u.globalRole) u.role = u.globalRole;
      // normalize: backend returns id not _id
      if (u && !u._id && u.id) u._id = u.id;
      setUser(u);
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
    router.replace("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
