"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";

function ChangePasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!token) {
      setError("Missing or invalid reset token.");
      return;
    }

    setLoading(true);
    try {
      await api.post(
        "/auth/change-password",
        { newPassword },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMessage("Password updated. Redirecting to login...");
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <main className="w-full max-w-md p-8">
        <div className="bg-surface-container border border-outline p-8 shadow-2xl">
          <h2 className="text-2xl font-bold mb-2">Set a new password</h2>
          <p className="text-sm text-foreground-muted mb-6">
            Enter a new password to continue.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Min. 8 characters"
                className="w-full bg-surface-highest border border-outline py-3 px-4"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="Re-enter password"
                className="w-full bg-surface-highest border border-outline py-3 px-4"
              />
            </div>

            {error && <div className="text-sm text-red-500">{error}</div>}
            {message && <div className="text-sm text-green-600">{message}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary py-3 font-bold disabled:opacity-50"
            >
              {loading ? "Updating..." : "Set new password"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function ChangePasswordPage() {
  return (
    <Suspense>
      <ChangePasswordForm />
    </Suspense>
  );
}
