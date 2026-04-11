"use client";

/**
 * /auth/callback
 *
 * Landing page after a successful Google OAuth redirect.
 * The backend sets the httpOnly refreshToken cookie and redirects here with
 * the access token in the URL fragment:
 *   /auth/callback#token=<accessToken>
 *
 * Steps:
 *  1. Read accessToken from the fragment (never sent to the server).
 *  2. Store it in the in-memory store via setAccessToken.
 *  3. Mark the session so the AuthProvider can restore it on next load.
 *  4. Fetch /auth/me and redirect to the appropriate dashboard.
 *  5. On any error, redirect to /login?error=...
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { setAccessToken } from "@/lib/api";
import api from "@/lib/api";
import { getRedirectPath } from "@/lib/auth/utils";
import AuthLoader from "@/components/AuthLoader";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function handleCallback() {
      try {
        // Read token from URL fragment — fragments are never sent to the server
        const fragment = window.location.hash.slice(1); // remove leading '#'
        const params = new URLSearchParams(fragment);
        const accessToken = params.get("token");

        if (!accessToken) {
          throw new Error("No access token received from Google login.");
        }

        // Store in-memory so axios interceptor attaches it to requests
        setAccessToken(accessToken);

        // Persist session flag so AuthProvider restores state on refresh
        localStorage.setItem("hasSession", "1");

        // Fetch user profile
        const { data } = await api.get("/auth/me");
        const u = data.user;
        if (u && !u.role && u.globalRole) u.role = u.globalRole;

        // Clear the fragment from the URL before redirecting
        window.history.replaceState(null, "", window.location.pathname);

        router.replace(getRedirectPath(u.role));
      } catch (err) {
        const message = encodeURIComponent(
          err.response?.data?.message || err.message || "Google login failed.",
        );
        router.replace(`/login?error=${message}`);
      }
    }

    handleCallback();
  }, [router]);

  return <AuthLoader />;
}
