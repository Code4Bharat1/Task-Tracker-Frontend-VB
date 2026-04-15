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
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import Avatar from "@/components/Avatar";
import { useAuth } from "@/lib/auth/context";
import AuthLoader from "@/components/AuthLoader";

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
  project_manager: {
    icon: Briefcase,
    label: "Project Manager",
    breadcrumb: "PM",
    items: [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/employee/dashboard",
      },
      { label: "Projects", icon: FolderKanban, href: "/employee/projects" },
      { label: "Tasks", icon: CheckSquare, href: "/employee/tasks" },
      {
        label: "Daily Logs",
        icon: ClipboardList,
        href: "/employee/daily-logs",
      },
      { label: "Leaderboard", icon: Trophy, href: "/employee/leaderboard" },
    ],
  },
  developer: {
    icon: Code,
    label: "Developer",
    breadcrumb: "Developer",
    items: [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/employee/dashboard",
      },
      {
        label: "My Projects",
        icon: FolderKanban,
        href: "/employee/projects",
      },
      {
        label: "My Tasks",
        icon: CheckSquare,
        href: "/employee/tasks",
      },
      {
        label: "Daily Logs",
        icon: ClipboardList,
        href: "/employee/daily-logs",
      },
      { label: "Issues", icon: Bug, href: "/employee/bugs" },
      { label: "Leaderboard", icon: Trophy, href: "/employee/leaderboard" },
    ],
  },
  tester: {
    icon: FlaskConical,
    label: "Tester",
    breadcrumb: "Tester",
    items: [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/employee/dashboard",
      },
      {
        label: "Projects",
        icon: FolderKanban,
        href: "/employee/projects",
      },
      {
        label: "Test Cases",
        icon: ShieldCheck,
        href: "/employee/testing",
      },
      { label: "Issues", icon: Bug, href: "/employee/bugs" },
      { label: "Leaderboard", icon: Trophy, href: "/employee/leaderboard" },
    ],
  },
};

const ALLOWED_ROLES = ["employee", "project_manager", "developer", "tester"];

export default function EmployeeLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
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

  if (loading || !user) return <AuthLoader />;

  const role = ALLOWED_ROLES.includes(user?.role) ? user.role : "employee";
  const config = NAV_CONFIG[role] ?? NAV_CONFIG.employee;
  const SidebarIcon = config.icon;
  const navItems = config.items;

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
