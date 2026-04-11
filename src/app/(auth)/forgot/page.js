"use client";

import { useState } from "react";
import api from "@/lib/api";
import AuthLoader from "@/components/AuthLoader";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await api.post("/auth/forgot", { email });
      setMessage(
        "If an account exists, an email has been sent with reset instructions.",
      );
    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to request password reset.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <main className="w-full max-w-md p-8">
        <div className="bg-surface-container border border-outline p-8 shadow-2xl">
          <h2 className="text-2xl font-bold mb-2">Reset your password</h2>
          <p className="text-sm text-foreground-muted mb-6">
            Enter the email associated with your account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@company.com"
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
              {loading ? "Sending..." : "Send reset email"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
