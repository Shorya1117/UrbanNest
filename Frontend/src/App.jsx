import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/layout";

// Auth
import UserLogin      from "./pages/auth/UserLogin";
import AdminLogin     from "./pages/auth/AdminLogin";
import ChangePassword from "./pages/auth/ChangePassword";

// SuperAdmin
import SuperAdminDashboard from "./pages/superadmin/Dashboard";
import SuperAdminSocieties from "./pages/superadmin/Societies";

// User
import UserDashboard from "./pages/user/Dashboard";
import Marketplace   from "./pages/user/Marketplace";
import ListingDetail from "./pages/user/ListingDetail";
import Complaints    from "./pages/user/Complaints";
import Services      from "./pages/user/Services";
import Notifications from "./pages/user/Notifications";

// Admin
import AdminDashboard     from "./pages/admin/AdminDashboard";
import AdminResidents     from "./pages/admin/AdminResidents";
import AdminFlats         from "./pages/admin/AdminFlats";
import AdminCategories    from "./pages/admin/AdminCategories";
import AdminComplaints    from "./pages/admin/AdminComplaints";
import AdminServices      from "./pages/admin/AdminServices";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminExcelImport   from "./pages/admin/AdminExcelImport";

const USER_ROLES = ["HEAD", "MEMBER", "ADMIN"];

const NotFoundPage = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center">
      <p className="text-7xl font-extrabold text-primary mb-4">404</p>
      <p className="text-xl font-bold text-gray-700 mb-2">Page Not Found</p>
      <a href="/" className="btn-primary inline-block mt-4">Go Home</a>
    </div>
  </div>
);

const UnauthorizedPage = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center">
      <p className="text-7xl font-extrabold text-red-400 mb-4">403</p>
      <p className="text-xl font-bold text-gray-700 mb-2">Access Denied</p>
      <a href="/" className="btn-primary inline-block mt-4">Go Home</a>
    </div>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: "Nunito, sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.10)",
            },
            success: { iconTheme: { primary: "#10B981", secondary: "#fff" } },
            error:   { iconTheme: { primary: "#EF4444", secondary: "#fff" } },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/"            element={<Navigate to="/login" replace />} />
          <Route path="/login"       element={<UserLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />

          {/* SuperAdmin */}
          <Route path="/superadmin"           element={<ProtectedRoute roles={["SUPER_ADMIN"]}><SuperAdminDashboard /></ProtectedRoute>} />
          <Route path="/superadmin/societies" element={<ProtectedRoute roles={["SUPER_ADMIN"]}><SuperAdminSocieties /></ProtectedRoute>} />

          {/* User */}
          <Route path="/dashboard"       element={<ProtectedRoute roles={USER_ROLES}><UserDashboard /></ProtectedRoute>} />
          <Route path="/marketplace"     element={<ProtectedRoute roles={USER_ROLES}><Marketplace /></ProtectedRoute>} />
          <Route path="/marketplace/:id" element={<ProtectedRoute roles={USER_ROLES}><ListingDetail /></ProtectedRoute>} />
          <Route path="/complaints"      element={<ProtectedRoute roles={USER_ROLES}><Complaints /></ProtectedRoute>} />
          <Route path="/services"        element={<ProtectedRoute roles={USER_ROLES}><Services /></ProtectedRoute>} />
          <Route path="/notifications"   element={<ProtectedRoute roles={USER_ROLES}><Notifications /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin"                   element={<ProtectedRoute roles={["ADMIN"]}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/residents"         element={<ProtectedRoute roles={["ADMIN"]}><AdminResidents /></ProtectedRoute>} />
          <Route path="/admin/flats"             element={<ProtectedRoute roles={["ADMIN"]}><AdminFlats /></ProtectedRoute>} />
          <Route path="/admin/categories"        element={<ProtectedRoute roles={["ADMIN"]}><AdminCategories /></ProtectedRoute>} />
          <Route path="/admin/complaints"        element={<ProtectedRoute roles={["ADMIN"]}><AdminComplaints /></ProtectedRoute>} />
          <Route path="/admin/services"          element={<ProtectedRoute roles={["ADMIN"]}><AdminServices /></ProtectedRoute>} />
          <Route path="/admin/notifications"     element={<ProtectedRoute roles={["ADMIN"]}><AdminNotifications /></ProtectedRoute>} />
          <Route path="/admin/import"            element={<ProtectedRoute roles={["ADMIN"]}><AdminExcelImport /></ProtectedRoute>} />

          {/* Errors */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*"             element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}