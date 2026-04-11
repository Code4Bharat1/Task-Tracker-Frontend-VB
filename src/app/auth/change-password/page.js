"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, X, CheckCircle } from "lucide-react";
import api from "@/lib/api";

function ChangePasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Invalid or missing reset token. Please request a new link.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.post(
        "/auth/change-password",
        { newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        "Failed to reset password. The link may have expired."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-surface">
      <div className="fixed inset-0 bg-dot-pattern pointer-events-none" />

      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] bg-primary/10" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] bg-primary/5" />
      </div>

      <main className="relative z-10 w-full max-w-[480px] px-6">
        <div className="mb-12 text-center">
          <h1 className="font-sans font-extrabold text-3xl tracking-widest text-foreground uppercase">
            Task Tracker
          </h1>
          <p className="text-sm mt-2 tracking-tight text-foreground-muted">
            Precision Instrument for Global Operations
          </p>
        </div>

        <div className="bg-surface-container border border-outline p-8 shadow-2xl">
          <div className="flex items-start gap-3 mb-8">
            <div className="p-2 bg-primary/10 border border-primary/20">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-sans text-2xl font-bold text-foreground">
                Set New Password
              </h2>
              <p className="text-sm text-foreground-muted mt-1">
                Choose a strong password for your account.
              </p>
            </div>
          </div>

          {success ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
              <p className="font-semibold text-foreground">Password updated!</p>
              <p className="text-sm text-foreground-muted">
                Redirecting you to sign in...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    className="w-full bg-surface-highest border border-outline focus:outline-none focus:ring-2 focus:ring-primary text-foreground py-3 px-4 pr-10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground transition-colors"
                    aria-label={showNew ? "Hide password" : "Show password"}
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                    className="w-full bg-surface-highest border border-outline focus:outline-none focus:ring-2 focus:ring-primary text-foreground py-3 px-4 pr-10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground transition-colors"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-xs text-red-500 bg-red-500/10 border border-red-500/20 px-3 py-2">
                  <X className="w-3.5 h-3.5 shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-on-primary font-sans font-bold py-3 hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Updating..." : "Set New Password"}
              </button>

              <p className="text-center text-xs text-foreground-muted">
                Remember your password?{" "}
                <a href="/login" className="text-primary hover:opacity-80 transition-opacity">
                  Sign in
                </a>
              </p>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ChangePasswordForm />
    </Suspense>
  );
}
