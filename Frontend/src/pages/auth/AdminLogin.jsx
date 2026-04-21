import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { authAPI } from "../../api/services";
import { useAuth } from "../../context/AuthContext";
import { Button, Input } from "../../components/ui";

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.email) e.email = "Email is required.";
    if (!form.password) e.password = "Password is required.";
    return e;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);
    setErrors({});
    setLoading(true);
    try {
      const res = await authAPI.adminLogin(form);
      const { token, user, mustChangePassword } = res.data.data;
      login(token, user);
      toast.success(`Welcome, ${user.name}!`);
      if (mustChangePassword) navigate("/change-password");
      else navigate(user.role === "SUPER_ADMIN" ? "/superadmin" : "/admin");
    } catch (err) {
      setErrors({ general: err.response?.data?.message || "Login failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-gradient shadow-lg mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">UrbanNest</h1>
          <p className="text-gray-500 mt-1 text-sm">Admin & SecretaryPortal</p>
        </div>

        <div className="card">
          <div className="mb-6">
            <h2 className="text-xl font-extrabold text-gray-900">Admin Login</h2>
            <p className="text-sm text-gray-500 mt-1">Sign in to manage your society.</p>
          </div>

          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              placeholder="admin@society.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={errors.email}
              autoFocus
            />
            <div className="space-y-1.5">
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  className={`input pr-10 ${errors.password ? "border-red-400" : ""}`}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Resident?{" "}
            <a href="/login" className="text-primary font-semibold hover:underline">Login here</a>
          </p>
        </div>
      </div>
    </div>
  );
}
