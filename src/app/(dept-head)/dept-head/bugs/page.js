"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import AuthLoader from "@/components/AuthLoader";
import { getAllBugs } from "@/services/bugService";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function DeptHeadBugsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [bugs, setBugs] = useState([]);
  const [loadingBugs, setLoadingBugs] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    (async () => {
      try {
        setLoadingBugs(true);
        const data = await getAllBugs();
        if (mounted) setBugs(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        if (mounted) setError("Failed to load bugs.");
      } finally {
        if (mounted) setLoadingBugs(false);
      }
    })();
    return () => (mounted = false);
  }, [user]);

  if (loading || loadingBugs) return <AuthLoader />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] tracking-[0.2em] uppercase text-foreground-muted mb-1">
          Department
        </p>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Issues
        </h1>
      </div>

      {error && <div className="text-[#ff4747]">{error}</div>}

      <div className="border border-outline bg-surface-low">
        <div className="px-6 py-4 border-b border-outline">
          <span className="text-[11px] tracking-[0.2em] uppercase font-bold text-foreground">
            All Open Issues
          </span>
        </div>
        <div className="divide-y divide-outline">
          {bugs.length === 0 ? (
            <div className="py-12 text-center text-foreground-muted">
              No issues found
            </div>
          ) : (
            bugs.map((b) => (
              <div
                key={b._id}
                className="px-6 py-4 flex items-center justify-between"
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-foreground truncate">
                    {b.title}
                  </p>
                  <p className="text-[10px] text-foreground-muted mt-1">
                    {b.projectName || b.project?.name || "—"}
                  </p>
                </div>
                <div className="text-[10px] text-foreground-muted">
                  {b.status}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
