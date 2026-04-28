import { useState } from "react";
import { NavLink, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { Avatar } from "../ui";
import NotificationBell from "../shared/NotificationBell";
import logo from "../../assets/logo.jpeg";

import {
  Home, Users, ShoppingBag, Wrench, MessageSquare, Bell,
  LogOut, Building2, Menu, X, Tag, FileSpreadsheet,CalendarCheck, ChevronRight, Sun, Moon,
} from "lucide-react";

const NAV_USER = [
  { to: "/dashboard",     icon: Home,          label: "Dashboard" },
  { to: "/marketplace",   icon: ShoppingBag,   label: "Marketplace" },
  { to: "/services",      icon: Wrench,        label: "Services" },
  { to: "/bookings",      icon: CalendarCheck, label: "My Bookings" },
  { to: "/complaints",    icon: MessageSquare, label: "Complaints" },
  { to: "/notifications", icon: Bell,          label: "Notifications" },
];
const NAV_ADMIN = [
  { to: "/admin",               icon: Home,            label: "Dashboard" },
  { to: "/admin/residents",     icon: Users,           label: "Residents" },
  { to: "/admin/flats",         icon: Building2,       label: "Flats" },
  { to: "/admin/import",        icon: FileSpreadsheet, label: "Import Excel" },
  { to: "/admin/categories",    icon: Tag,             label: "Categories" },
  { to: "/admin/complaints",    icon: MessageSquare,   label: "Complaints" },
  { to: "/admin/services",      icon: Wrench,          label: "Services" },
   { to: "/admin/bookings",      icon: CalendarCheck,   label: "Bookings" },
  { to: "/admin/notifications", icon: Bell,            label: "Notifications" },
];
const NAV_SUPERADMIN = [
  { to: "/superadmin",           icon: Home,      label: "Dashboard" },
  { to: "/superadmin/societies", icon: Building2, label: "Societies" },
];

const SidebarContent = ({ onNavClick }) => {
  const { user, logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();

  const navItems =
    user?.role === "SUPER_ADMIN" ? NAV_SUPERADMIN :
    user?.role === "ADMIN" ? NAV_ADMIN : NAV_USER;

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
  <div className="px-5 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden">
        <img src={logo} alt="UrbanNest Logo" className="w-full h-full object-cover rounded-xl" />
      </div>
      <div>
        <span className="text-base font-bold" style={{ fontFamily: "Syne", color: "var(--text-primary)" }}>
          UrbanNest
        </span>
        <p className="text-xs" style={{ color: "var(--text-muted)", marginTop: "-1px" }}>
          {user?.role === "SUPER_ADMIN" ? "Super Admin" : user?.role === "ADMIN" ? "Admin Portal" : "Resident"}
        </p>
      </div>
    </div>
  </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to.split("/").length <= 2}
            onClick={onNavClick}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            <Icon size={16} className="shrink-0" />
            <span className="flex-1 text-sm">{label}</span>
            {/* active indicator */}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: theme + user */}
      <div className="px-3 py-4" style={{ borderTop: "1px solid var(--border)" }}>
        {/* Theme toggle */}
        <button onClick={toggle}
          className="nav-item w-full mb-2"
          style={{ color: "var(--text-secondary)" }}>
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
          <span className="text-sm">{isDark ? "Light Mode" : "Dark Mode"}</span>
        </button>

        {/* User info */}
        <div className="flex items-center gap-2.5 px-2 py-2 mb-2 rounded-xl"
          style={{ background: "var(--surface-2)" }}>
          <Avatar src={user?.avatar?.url} name={user?.name || user?.email} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
              {user?.name || user?.email}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{user?.role}</p>
          </div>
        </div>

        <button onClick={handleLogout}
          className="nav-item w-full"
          style={{ color: "#EF4444" }}>
          <LogOut size={16} />
          <span className="text-sm">Sign out</span>
        </button>
      </div>
    </div>
  );
};

export const Sidebar = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
        <Menu size={18} />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 z-50"
            style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}>
            <button onClick={() => setOpen(false)}
              className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg btn-ghost"
              style={{ color: "var(--text-muted)" }}>
              <X size={16} />
            </button>
            <SidebarContent onNavClick={() => setOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 h-screen sticky top-0 shrink-0"
        style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}>
        <SidebarContent onNavClick={() => {}} />
      </aside>
    </>
  );
};

/* ── Page Layout ──────────────────────────────────────────────────────────── */
export const PageLayout = ({ children }) => (
  <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
    <Sidebar />
    <main className="flex-1 overflow-auto min-w-0">
      {/* Top bar */}
      <div className="hidden lg:flex items-center justify-end px-8 pt-5 pb-0 gap-3">
        <NotificationBell />
      </div>
      <div className="px-4 sm:px-6 lg:px-8 pb-10 pt-4 max-w-7xl mx-auto">
        {children}
      </div>
    </main>
  </div>
);

/* ── Page Header ──────────────────────────────────────────────────────────── */
export const PageHeader = ({ title, description, action }) => (
  <div className="flex items-start justify-between mb-8 gap-4 pt-1">
    <div>
      <h1 className="page-title">{title}</h1>
      {description && (
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{description}</p>
      )}
    </div>
    {action && <div className="shrink-0 mt-1">{action}</div>}
  </div>
);

/* ── Protected Route ──────────────────────────────────────────────────────── */
export const ProtectedRoute = ({ children, roles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return (
    <div className="flex items-center justify-center h-screen" style={{ background: "var(--bg)" }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-transparent animate-spin"
          style={{ borderTopColor: "var(--emerald)", borderRightColor: "var(--emerald-glow)" }} />
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading…</p>
      </div>
    </div>
  );

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/unauthorized" replace />;
  return children;
};