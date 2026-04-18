"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AtSign, Eye, EyeOff, LogIn, HelpCircle, Lock, X } from "lucide-react";
import { getRedirectPath } from "@/lib/auth/utils";
import api from "@/lib/api";
import AuthLoader from "@/components/AuthLoader";
import { useAuth } from "@/lib/auth/context";
import ToggleTheme from "@/UI/ToggleTheme";

// ─── Forced Password Change Modal ────────────────────────────────────────────

function ChangePasswordModal({ tempToken, onSuccess }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

    setLoading(true);
    try {
      await api.post(
        "/auth/change-password",
        { newPassword },
        { headers: { Authorization: `Bearer ${tempToken}` } },
      );
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-surface-container border border-outline p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-start gap-3 mb-6">
          <div className="p-2 bg-primary/10 border border-primary/20">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-sans font-bold text-lg text-foreground">
              Password Reset Required
            </h2>
            <p className="text-xs text-foreground-muted mt-0.5">
              Your account requires a new password before you can continue.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New password */}
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
                {showNew ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm password */}
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
                {showConfirm ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
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
        </form>
      </div>
    </div>
  );
}

// ─── Login Page ───────────────────────────────────────────────────────────────

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, login } = useAuth();

  // All hooks must be declared before any conditional returns
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [requirePasswordChange, setRequirePasswordChange] = useState(false);
  const [tempToken, setTempToken] = useState("");

  // Redirect already-authenticated users — must be in useEffect, not render
  useEffect(() => {
    if (!loading && user) {
      router.replace(getRedirectPath(user.role));
    }
  }, [user, loading, router]);

  // Show error passed back from Google OAuth redirect
  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (oauthError) setError(oauthError);
  }, [searchParams]);

  // Don't flash the login form while auth state is being determined or redirect is in progress
  if (loading) return null;
  if (!loading && user) return null;

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Email is required."); return; }
    if (!password) { setError("Password is required."); return; }
    setFormLoading(true);

    try {
      const result = await login(email, password);
      if (result.requirePasswordChange) {
        setTempToken(result.tempToken);
        setRequirePasswordChange(true);
      }
      // on success, login() handles redirect internally
    } catch (err) {
      setError(err.response?.data?.message || "Login failed.");
    } finally {
      setFormLoading(false);
    }
  }

  function handlePasswordChangeSuccess() {
    setRequirePasswordChange(false);
    setTempToken("");
    setError("");
    setEmail("");
    setPassword("");
    setError("✓ Password updated. Please sign in with your new password.");
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-surface">
      {requirePasswordChange && (
        <ChangePasswordModal
          tempToken={tempToken}
          onSuccess={handlePasswordChangeSuccess}
        />
      )}

      {/* Dot pattern */}
      <div className="fixed inset-0 bg-dot-pattern pointer-events-none" />

      {/* Ambient glow blobs */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] bg-primary/10" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] bg-primary/5" />
      </div>

      <main className="relative z-10 w-full max-w-[480px] px-6">
        {/* Brand header */}
        <div className="mb-12 text-center">
          <h1 className="font-sans font-extrabold text-3xl tracking-widest text-foreground uppercase">
            Task Tracker
          </h1>
          <p className="text-sm mt-2 tracking-tight text-foreground-muted">
            Precision Instrument for Global Operations
          </p>
        </div>

        {/* Login card */}
        <div className="bg-surface-container border border-outline p-8 shadow-2xl">
          <header className="mb-8">
            <h2 className="font-sans text-2xl font-bold text-foreground">
              Sign In
            </h2>
            <p className="text-sm text-foreground-muted mt-1">
              Please enter your credentials to access the platform.
            </p>
          </header>

          <form className="space-y-5" onSubmit={handleLogin} noValidate>
            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-foreground-muted"
              >
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full bg-surface-highest border border-outline focus:outline-none focus:ring-2 focus:ring-primary text-foreground py-3 px-4 pr-10 transition-all"
                />
                <AtSign className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground-muted w-4 h-4" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-foreground-muted"
                >
                  Password
                </label>
                <a
                  href="/forgot"
                  className="text-xs text-primary hover:opacity-80 transition-opacity"
                >
                  Forgot?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-surface-highest border border-outline focus:outline-none focus:ring-2 focus:ring-primary text-foreground py-3 px-4 pr-10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error / success message */}
            {error && (
              <div
                className={`flex items-center gap-2 text-xs px-3 py-2 border ${error.startsWith("✓")
                  ? "text-green-600 bg-green-500/10 border-green-500/20"
                  : "text-red-500 bg-red-500/10 border-red-500/20"
                  }`}
              >
                {!error.startsWith("✓") && (
                  <X className="w-3.5 h-3.5 shrink-0" />
                )}
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={formLoading}
              className="w-full bg-primary text-on-primary font-sans font-bold py-3 hover:opacity-90 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{formLoading ? "Signing in..." : "Secure Sign In"}</span>
              {!formLoading && (
                <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-outline" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface-container px-4 text-foreground-muted tracking-widest">
                or continue with
              </span>
            </div>
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={() => {
              window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/auth/google`;
            }}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-outline hover:bg-surface-high transition-colors text-sm text-foreground"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign-in with Google
          </button>
        </div>

        {/* Role footer */}
        <footer className="mt-8">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 items-center opacity-60">
            <span className="text-[10px] uppercase font-bold tracking-widest text-foreground-muted">
              Authorized Roles:
            </span>
            {["Administrator", "Dept Head", "Employee"].map((role) => (
              <span key={role} className="text-[10px] text-foreground">
                {role}
              </span>
            ))}
          </div>
        </footer>
      </main>

      {/* Support FAB */}
      <div className="fixed bottom-8 right-8 z-50 flex items-center gap-3">
        <ToggleTheme />
        <button
          type="button"
          className="flex items-center gap-3 bg-surface-highest px-6 py-3 shadow-xl hover:bg-primary hover:text-on-primary transition-all duration-300 group border border-outline"
        >
          <HelpCircle className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">
            Support
          </span>
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthLoader />}>
      <LoginContent />
    </Suspense>
  );
}
