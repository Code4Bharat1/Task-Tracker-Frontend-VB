"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  ClipboardList,
  Bug,
  LogOut,
  UserCircle,
  Briefcase,
  Code,
  FlaskConical,
  CheckSquare,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Menu,
  Trophy,
  FileText,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import Avatar from "@/components/Avatar";
import { useAuth } from "@/lib/auth/context";
import AuthLoader from "@/components/AuthLoader";
import { getMyProjects } from "@/services/projectService";

// Permission key mapping: nav href → resource key
const NAV_PERMISSION_MAP = {
  "/employee/projects": "projects",
  "/employee/tasks":    "tasks",
  "/employee/daily-logs": "dailyLogs",
  "/employee/bugs":     "bugs",
  "/employee/reports":  "reports",
  "/employee/leaderboard": "leaderboard",
};

/* ── Role-specific nav configs ─────────────────────────────── */
const NAV_CONFIG = {
  employee: {
    icon: UserCircle,
    label: "Employee Portal",
    breadcrumb: "Employee",
    items: [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/employee/dashboard",
      },
      { label: "My Projects", icon: FolderKanban, href: "/employee/projects" },
      { label: "Tasks", icon: CheckSquare, href: "/employee/tasks" },
      {
        label: "Daily Logs",
        icon: ClipboardList,
        href: "/employee/daily-logs",
      },
      { label: "Issues", icon: Bug, href: "/employee/bugs" },
      { label: "Leaderboard", icon: Trophy, href: "/employee/leaderboard" },
    ],
  },
  lead: {
    icon: Briefcase,
    label: "Employee Portal",
    breadcrumb: "Employee",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/employee/dashboard" },
      { label: "Projects", icon: FolderKanban, href: "/employee/projects" },
      { label: "Tasks", icon: CheckSquare, href: "/employee/tasks" },
      { label: "Reports", icon: FileText, href: "/employee/reports" },
      { label: "Daily Logs", icon: ClipboardList, href: "/employee/daily-logs" },
      { label: "Issues", icon: Bug, href: "/employee/bugs" },
      { label: "Leaderboard", icon: Trophy, href: "/employee/leaderboard" },
    ],
  },
  project_manager: {
    icon: Briefcase,
    label: "Employee Portal",
    breadcrumb: "Employee",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/employee/dashboard" },
      { label: "Projects", icon: FolderKanban, href: "/employee/projects" },
      { label: "Tasks", icon: CheckSquare, href: "/employee/tasks" },
      { label: "Reports", icon: FileText, href: "/employee/reports" },
      { label: "Daily Logs", icon: ClipboardList, href: "/employee/daily-logs" },
      { label: "Leaderboard", icon: Trophy, href: "/employee/leaderboard" },
    ],
  },
  developer: {
    icon: Code,
    label: "Employee Portal",
    breadcrumb: "Employee",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/employee/dashboard" },
      { label: "My Projects", icon: FolderKanban, href: "/employee/projects" },
      { label: "My Tasks", icon: CheckSquare, href: "/employee/tasks" },
      { label: "Daily Logs", icon: ClipboardList, href: "/employee/daily-logs" },
      { label: "Issues", icon: Bug, href: "/employee/bugs" },
      { label: "Leaderboard", icon: Trophy, href: "/employee/leaderboard" },
    ],
  },
  contributor: {
    icon: Code,
    label: "Employee Portal",
    breadcrumb: "Employee",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/employee/dashboard" },
      { label: "My Projects", icon: FolderKanban, href: "/employee/projects" },
      { label: "My Tasks", icon: CheckSquare, href: "/employee/tasks" },
      { label: "Daily Logs", icon: ClipboardList, href: "/employee/daily-logs" },
      { label: "Issues", icon: Bug, href: "/employee/bugs" },
      { label: "Leaderboard", icon: Trophy, href: "/employee/leaderboard" },
    ],
  },
  tester: {
    icon: FlaskConical,
    label: "Employee Portal",
    breadcrumb: "Employee",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/employee/dashboard" },
      { label: "Projects", icon: FolderKanban, href: "/employee/projects" },
      { label: "Tasks", icon: CheckSquare, href: "/employee/tasks" },
      { label: "Test Cases", icon: ShieldCheck, href: "/employee/testing" },
      { label: "Issues", icon: Bug, href: "/employee/bugs" },
      { label: "Leaderboard", icon: Trophy, href: "/employee/leaderboard" },
    ],
  },
  reviewer: {
    icon: FlaskConical,
    label: "Employee Portal",
    breadcrumb: "Employee",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/employee/dashboard" },
      { label: "Projects", icon: FolderKanban, href: "/employee/projects" },
      { label: "Tasks", icon: CheckSquare, href: "/employee/tasks" },
      { label: "Issues", icon: Bug, href: "/employee/bugs" },
      { label: "Leaderboard", icon: Trophy, href: "/employee/leaderboard" },
    ],
  },
};

const ALLOWED_ROLES = ["employee", "project_manager", "developer", "tester", "lead", "contributor", "reviewer"];

export default function EmployeeLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout, can, permissionsLoaded } = useAuth();
  const [isManager, setIsManager] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    }
  }, [user, loading, router]);
  // Compute role info and setup nav state BEFORE any early return so hooks order is stable
  const rawRole = (user?.role || user?.globalRole || "")
    .toString()
    .toLowerCase();
  let roleKey = "employee";
  if (NAV_CONFIG[rawRole]) {
    roleKey = rawRole;
  } else if (rawRole === "project_manager") {
    roleKey = "project_manager";
  }
  const config = NAV_CONFIG[roleKey] ?? NAV_CONFIG.employee;
  const SidebarIcon = config.icon;
  // Normalize user role for fine-grained checks (role or globalRole)
  const userRoleNormalized = (user?.role || user?.globalRole || "")
    .toString()
    .toLowerCase();
  const canSeeReports =
    userRoleNormalized === "lead" ||
    userRoleNormalized === "project_manager" ||
    userRoleNormalized === "project manager";

  // Start with the configured items. We'll inject Reports if role or manager status allows it.
  const navItemsBase = [...(config.items || [])];

  useEffect(() => {
    let mounted = true;
    async function checkManager() {
      if (!user) return;
      try {
        const projs = await getMyProjects();
        if (!mounted) return;
        // If any project has managerId equal to current user, mark as manager
        const manages =
          Array.isArray(projs) &&
          projs.some((p) => {
            return (
              (p.managerId && String(p.managerId) === String(user._id)) ||
              (p.managerIds &&
                p.managerIds.map(String).includes(String(user._id)))
            );
          });
        setIsManager(!!manages);
      } catch (e) {
        // ignore
      }
    }
    checkManager();
    return () => (mounted = false);
  }, [user]);

  if (loading || !user) return <AuthLoader />;

  const canSeeReportsFinal = canSeeReports || isManager;
  const navItems = [...navItemsBase].filter((item) => {
    const resource = NAV_PERMISSION_MAP[item.href];
    if (!resource) return true;
    return can(resource, "read");
  });
  if (
    canSeeReportsFinal &&
    can("reports", "read") &&
    !navItems.some((i) => i.href === "/employee/reports")
  ) {
    const insertAt = Math.min(3, navItems.length);
    navItems.splice(insertAt, 0, {
      label: "Reports",
      icon: FileText,
      href: "/employee/reports",
    });
  }

  function handleLogout() {
    logout();
  }
  function handleNav(href) {
    router.push(href);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface font-sans">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        style={{ width: collapsed ? "72px" : "220px" }}
        className={`fixed md:relative inset-y-0 left-0 z-50 md:z-auto flex flex-col border-r border-outline bg-surface transition-all duration-300 ease-in-out shrink-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-outline overflow-hidden">
          <div className="flex items-center justify-center w-8 h-8 bg-[--primary] shrink-0">
            <SidebarIcon className="w-4 h-4 text-on-primary" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-none">
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-foreground">
                Task Tracker
              </span>
              <span className="text-[9px] tracking-[0.15em] uppercase text-foreground-muted">
                {config.label}
              </span>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex flex-col gap-1 px-2 pt-4 flex-1">
          {navItems.map(({ label, icon: Icon, href }) => {
            const isActive =
              pathname === href || pathname.startsWith(href + "/");
            return (
              <button
                key={href}
                onClick={() => handleNav(href)}
                title={collapsed ? label : undefined}
                className={`group flex items-center gap-3 px-3 py-2.5 text-left transition-all duration-150 relative overflow-hidden
                  ${
                    isActive
                      ? "bg-primary text-on-primary"
                      : "text-foreground-muted hover:text-foreground hover:bg-surface-low"
                  }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-0 h-full w-[3px] bg-foreground" />
                )}
                <Icon
                  className={`w-4 h-4 shrink-0 ${isActive ? "text-on-primary" : "text-current"}`}
                />
                {!collapsed && (
                  <span
                    className={`text-[11px] tracking-[0.12em] uppercase font-bold ${isActive ? "text-on-primary" : "text-current"}`}
                  >
                    {label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-2 pb-4 border-t border-outline pt-3">
          <button
            onClick={handleLogout}
            title={collapsed ? "Sign Out" : undefined}
            className="flex items-center gap-3 px-3 py-2.5 w-full text-foreground-muted hover:text-[#ff4747] hover:bg-red-500/5 transition-all duration-150"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && (
              <span className="text-[11px] tracking-[0.12em] uppercase font-bold">
                Sign Out
              </span>
            )}
          </button>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex absolute -right-3 top-[72px] z-10 items-center justify-center w-6 h-6 border border-outline text-foreground-muted hover:text-foreground hover:bg-surface-high transition-all"
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </button>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-4 md:px-8 py-4 border-b border-outline bg-surface">
          <div className="flex items-center gap-2">
            <button
              className="md:hidden p-1 -ml-1 mr-1 text-foreground-muted hover:text-foreground transition-colors"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-[10px] tracking-[0.2em] uppercase text-foreground-muted">
              {config.breadcrumb}
            </span>
            <span className="text-foreground-muted">/</span>
            <span className="text-[10px] tracking-[0.2em] uppercase text-primary">
              {navItems.find(
                (i) => pathname === i.href || pathname.startsWith(i.href + "/"),
              )?.label ?? "Dashboard"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] tracking-[0.15em] uppercase text-foreground-muted">
                  Live
                </span>
              </div>
              <Avatar
                name={user?.name}
                src={user?.profilePhoto}
                size={8}
                onClick={() => router.push("/employee/settings")}
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 overflow-auto scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
