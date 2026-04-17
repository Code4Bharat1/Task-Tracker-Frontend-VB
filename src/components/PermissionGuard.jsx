"use client";

import { useAuth } from "@/lib/auth/context";
import { ShieldOff } from "lucide-react";

/**
 * PermissionGuard — wraps a page and shows a 403 screen if the user
 * doesn't have the required permission.
 *
 * Usage:
 *   <PermissionGuard resource="tasks" action="read">
 *     <TasksPage />
 *   </PermissionGuard>
 */
export default function PermissionGuard({ resource, action = "read", children }) {
  const { can, loading } = useAuth();

  if (loading) return null;

  if (!can(resource, action)) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4 text-foreground-muted">
        <div className="w-14 h-14 bg-[#ff4747]/10 border border-[#ff4747]/20 flex items-center justify-center">
          <ShieldOff className="w-7 h-7 text-[#ff4747]" />
        </div>
        <div className="text-center">
          <p className="text-[13px] font-bold text-foreground mb-1">Access Restricted</p>
          <p className="text-[12px] text-foreground-muted">
            You don&apos;t have permission to view this page.
          </p>
          <p className="text-[11px] text-foreground-muted mt-1">
            Contact your admin to request access.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
