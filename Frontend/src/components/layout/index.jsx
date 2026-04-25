import { useState } from "react";
import { NavLink, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Avatar } from "../ui";
import NotificationBell from "../shared/NotificationBell";
import {
  Home, Users, ShoppingBag, Wrench, MessageSquare,
  Bell, LogOut, Building2, Menu, X, Tag, FileSpreadsheet, CalendarCheck,
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

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const navItems =
    user?.role === "SUPER_ADMIN" ? NAV_SUPERADMIN :
    user?.role === "ADMIN"       ? NAV_ADMIN       : NAV_USER;

  const handleLogout = () => { logout(); navigate("/login"); };

  const Content = () => (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-extrabold text-gray-900">UrbanNest</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to.split("/").length <= 2}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`
            }
          >
            <Icon size={17} className="shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-3 px-1">
          <Avatar src={user?.avatar?.url} name={user?.name || user?.email} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{user?.name || user?.email}</p>
            <p className="text-xs text-gray-400">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut size={15} /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 w-10 h-10 bg-white shadow-card rounded-xl flex items-center justify-center"
      >
        <Menu size={20} />
      </button>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl z-50">
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
              <X size={18} />
            </button>
            <Content />
          </div>
        </div>
      )}

      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-gray-100 h-screen sticky top-0 shrink-0">
        <Content />
      </aside>
    </>
  );
};

export const PageLayout = ({ children }) => (
  <div className="flex min-h-screen bg-background">
    <Sidebar />
    <main className="flex-1 overflow-auto min-w-0">
      <div className="hidden lg:flex items-center justify-end px-6 pt-4">
        <NotificationBell />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-10 pt-2 lg:pt-0">
        {children}
      </div>
    </main>
  </div>
);

export const PageHeader = ({ title, description, action }) => (
  <div className="flex items-start justify-between mb-8 gap-4 pt-2">
    <div>
      <h1 className="text-2xl font-extrabold text-gray-900">{title}</h1>
      {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export const ProtectedRoute = ({ children, roles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-sm text-gray-500 font-medium">Loading…</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/unauthorized" replace />;
  return children;
};