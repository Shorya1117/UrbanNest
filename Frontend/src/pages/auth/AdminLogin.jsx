import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Eye, EyeOff, Lock, Mail, Moon, Sun } from "lucide-react";
import toast from "react-hot-toast";
import { authAPI } from "../../api/services";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { Button } from "../../components/ui";
import logo from "../../assets/logo.jpeg";

export default function AdminLogin() {
  const { login } = useAuth();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();
  const [form, setForm]     = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]  = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.email)    errs.email    = "Email is required.";
    if (!form.password) errs.password = "Password is required.";
    if (Object.keys(errs).length) return setErrors(errs);
    setErrors({}); setLoading(true);
    try {
      const res = await authAPI.adminLogin(form);
      const { token, user, mustChangePassword } = res.data.data;
      login(token, user);
      toast.success(`Welcome, ${user.name}!`);
      if (mustChangePassword) navigate("/change-password");
      else navigate(user.role === "SUPER_ADMIN" ? "/superadmin" : "/admin");
    } catch (err) {
      setErrors({ general: err.response?.data?.message || "Invalid credentials." });
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative"
      style={{ background: "var(--bg)" }}>
      {/* BG decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #10B981, transparent)" }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #3B82F6, transparent)" }} />
      </div>

      {/* Theme toggle */}
      <button onClick={toggle}
        className="absolute top-5 right-5 w-9 h-9 rounded-xl flex items-center justify-center btn-ghost">
        {isDark ? <Sun size={16} style={{ color: "var(--text-secondary)" }} /> : <Moon size={16} style={{ color: "var(--text-secondary)" }} />}
      </button>

      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 overflow-hidden">
              <img src={logo} alt="UrbanNest Logo" className="w-full h-full object-cover rounded-2xl" />
            </div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: "Syne", color: "var(--text-primary)" }}>
              UrbanNest
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Admin & Secretary Portal
            </p>
          </div>
        {/* Card */}
        <div className="card-flat rounded-2xl p-8">
          <h2 className="text-xl font-bold mb-1" style={{ fontFamily: "Syne", color: "var(--text-primary)" }}>Sign in</h2>
          <p className="text-sm mb-7" style={{ color: "var(--text-muted)" }}>Enter your credentials to continue.</p>

          {errors.general && (
            <div className="mb-5 p-3.5 rounded-xl text-sm font-medium flex items-center gap-2"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#DC2626" }}>
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-muted)" }} />
                <input type="email" className={`input pl-10 ${errors.email ? "input-error" : ""}`}
                  placeholder="admin@society.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  autoFocus />
              </div>
              {errors.email && <p className="text-xs font-medium" style={{ color: "#EF4444" }}>{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-muted)" }} />
                <input type={showPwd ? "text" : "password"}
                  className={`input pl-10 pr-10 ${errors.password ? "input-error" : ""}`}
                  placeholder="Your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-muted)" }}>
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-xs font-medium" style={{ color: "#EF4444" }}>{errors.password}</p>}
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: "var(--text-muted)" }}>
            Resident?{" "}
            <a href="/login" className="font-semibold" style={{ color: "var(--emerald)" }}>Login here</a>
          </p>
        </div>
      </div>
    </div>
  );
}