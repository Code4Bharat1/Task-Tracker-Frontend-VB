"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  FolderKanban,
  Bug,
  ClipboardList,
  Settings,
  LogOut,
  Shield,
  ChevronLeft,
  ChevronRight,
  BookCheck,
  Trophy,
  Menu,
  User,
  ChevronDown,
  Crown,
  Mail,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import Avatar from "@/components/Avatar";
import { useAuth } from "@/lib/auth/context";
import { getRedirectPath } from "@/lib/auth/utils";
import AuthLoader from "@/components/AuthLoader";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin/dashboard",
  },
  {
    label: "User Management",
    icon: Users,
    href: "/admin/users",
  },
  {
    label: "Departments",
    icon: Building2,
    href: "/admin/departments",
  },
  {
    label: "Projects Overview",
    icon: FolderKanban,
    href: "/admin/projects",
  },
  {
    label: "Issues",
    icon: Bug,
    href: "/admin/bugs",
  },
  {
    label: "Tasks",
    icon: ClipboardList,
    href: "/admin/tasks",
  },
  {
    label: "Daily Logs",
    icon: BookCheck,
    href: "/admin/daily-logs",
  },
  {
    label: "Leaderboard",
    icon: Trophy,
    href: "/admin/leaderboard",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/admin/settings",
  },
  {
    label: "Permissions",
    icon: Shield,
    href: "/admin/permissions",
  },
];

// ─── Profile Dropdown Component ─────────────────────────────────
function ProfileDropdown({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const roleLabel = user?.globalRole || user?.role;
  const roleDisplay = roleLabel
    ?.replace(/_/g, " ")
    ?.replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div className="relative" ref={dropdownRef}>
<div
  role="button"
  tabIndex={0}
  onClick={() => setIsOpen(!isOpen)}
  onKeyDown={(e) => e.key === 'Enter' && setIsOpen(!isOpen)}
  className={`flex items-center gap-2 pl-1 pr-2 py-1 rounded-full transition-all duration-200 cursor-pointer ${
    isOpen
      ? "bg-primary/10 ring-2 ring-primary/30"
      : "hover:bg-surface-container hover:ring-1 hover:ring-outline"
  }`}
>
  <Avatar
    name={user?.name}
    src={user?.profilePic?.url}
    size={8}
    className="shrink-0"
  />
  <div className="hidden sm:flex flex-col items-start leading-none">
    <span className="text-[11px] font-semibold text-foreground">
      {user?.name || "Admin"}
    </span>
    <span className="text-[9px] text-foreground-muted mt-0.5">{roleDisplay}</span>
  </div>
</div>  {/* ← closing tag also changed from </button> */}
      {/* Dropdown Menu */}
      <div
        className={`absolute right-0 mt-2 w-64 bg-surface border border-outline shadow-lg rounded-lg overflow-hidden transition-all duration-200 z-50 ${
          isOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        {/* Header with banner */}
        <div className="relative h-16 bg-linear-to-r from-primary/20 via-primary/10 to-surface-container">
          <div className="absolute -bottom-6 left-4">
            <Avatar
              name={user?.name}
              src={user?.profilePic?.url}
              size={14}
              className="ring-4 ring-surface"
            />
          </div>
        </div>

        {/* User info */}
        <div className="pt-8 pb-3 px-4 border-b border-outline">
          <h3 className="font-semibold text-sm text-foreground truncate">
            {user?.name || "Admin User"}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            <Crown className="w-3 h-3 text-primary" />
            <span className="text-[10px] text-foreground-muted">{roleDisplay}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[10px] text-foreground-muted">
            <Mail className="w-3 h-3" />
            <span className="truncate">{user?.email}</span>
          </div>
        </div>

        {/* Menu items */}
        <div className="p-1.5">
          <button
            onClick={() => {
              setIsOpen(false);
              router.push("/admin/settings");
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-muted hover:text-foreground hover:bg-surface-container rounded transition-colors"
          >
            <User className="w-4 h-4" />
            My Profile
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              router.push("/admin/settings");
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-muted hover:text-foreground hover:bg-surface-container rounded transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <div className="h-px bg-outline my-1.5" />
          <button
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#ff4747] hover:bg-red-500/5 rounded transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function handleLogout() {
    logout();
  }

  function handleNav(href) {
    router.push(href);
  }

  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (loading) return; // wait for session restore
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "admin") {
      router.replace(getRedirectPath(user.role));
    }
  }, [user, loading, router]);

  if (loading || !user) return <AuthLoader />;

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
        style={{ width: collapsed ? "72px" : "240px" }}
        className={`fixed md:relative inset-y-0 left-0 z-50 md:z-auto flex flex-col border-r border-outline bg-surface transition-all duration-300 ease-in-out shrink-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-outline overflow-hidden">
          <div className="flex items-center justify-center w-8 h-8 bg-[--primary] shrink-0">
            <Shield className="w-4 h-4 text-on-primary" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-none">
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-foreground">
                Task Tracker
              </span>
              <span className="text-[9px] tracking-[0.15em] uppercase text-foreground-muted"></span>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex flex-col gap-1 px-2 pt-4 flex-1">
          {NAV_ITEMS.map(({ label, icon: Icon, href }) => {
            const isActive = pathname === href;
            return (
              <button
                key={href}
                onClick={() => handleNav(href)}
                title={collapsed ? label : undefined}
                className={`
                  group flex items-center gap-3 px-3 py-2.5 text-left transition-all duration-150 relative overflow-hidden
                  ${
                    isActive
                      ? "bg-primary text-on-primary"
                      : "text-foreground-muted hover:text-foreground hover:bg-surface-low"
                  }
                `}
              >
                {/* Active left bar */}
                {isActive && (
                  <span className="absolute left-0 top-0 h-full w-[3px] bg-foreground" />
                )}
                <Icon
                  className={`w-4 h-4 shrink-0 ${isActive ? "text-on-primary" : "text-current"}`}
                />
                {!collapsed && (
                  <span
                    className={`text-[11px] tracking-[0.12em] uppercase font-bold ${
                      isActive ? "text-on-primary" : "text-current"
                    }`}
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
          className="hidden md:flex absolute -right-3 top-18 z-10 items-center justify-center w-6 h-6 border border-outline text-foreground-muted hover:text-foreground hover:bg-surface-high transition-all"
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
            {/* Breadcrumb — shows current section */}
            <span className="text-[10px] tracking-[0.2em] uppercase text-foreground-muted">
              Admin
            </span>
            <span className="text-foreground-muted">/</span>
            <span className="text-[10px] tracking-[0.2em] uppercase text-primary">
              {NAV_ITEMS.find((i) => i.href === pathname)?.label ?? "Dashboard"}
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
              <ProfileDropdown user={user} onLogout={handleLogout} />
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
