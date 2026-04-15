"use client";

import { useEffect } from "react";
import { Bug } from "lucide-react";
import AuthLoader from "@/components/AuthLoader";
import { useAuth } from "@/lib/auth/context";
import { useRouter } from "next/navigation";

export default function AdminBugsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) return <AuthLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-foreground-muted mb-1">
            Admin / Issues
          </p>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Issues
          </h1>
        </div>
      </div>

      <div className="border border-outline bg-surface-low p-6">
        <div className="flex items-center gap-3">
          <Bug className="w-5 h-5 text-[#ff4747]" />
          <p className="text-foreground-muted">Issues page coming soon.</p>
        </div>
      </div>
    </div>
  );
}
