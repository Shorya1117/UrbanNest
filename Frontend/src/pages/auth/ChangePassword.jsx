import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { authAPI } from "../../api/services";
import { Button, Input } from "../../components/ui";

export default function ChangePassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.currentPassword) e.currentPassword = "Current password is required.";
    if (!form.newPassword || form.newPassword.length < 8) e.newPassword = "Min 8 characters.";
    if (form.newPassword !== form.confirmPassword) e.confirmPassword = "Passwords do not match.";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);
    setErrors({});
    setLoading(true);
    try {
      await authAPI.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      toast.success("Password changed! Please log in again.");
      navigate("/admin/login");
    } catch (err) {
      setErrors({ general: err.response?.data?.message || "Failed to change password." });
    } finally {
      setLoading(false);
    }
  };

  const PWField = ({ field, label, placeholder }) => (
    <div className="space-y-1.5">
      <label className="label">{label}</label>
      <div className="relative">
        <input
          type={show[field] ? "text" : "password"}
          className={`input pr-10 ${errors[field] ? "border-red-400" : ""}`}
          placeholder={placeholder}
          value={form[field]}
          onChange={(e) => setForm({ ...form, [field]: e.target.value })}
        />
        <button type="button" onClick={() => setShow({ ...show, [field]: !show[field] })}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show[field] ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {errors[field] && <p className="text-xs text-red-500">{errors[field]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-gradient shadow-lg mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Set New Password</h1>
          <p className="text-gray-500 mt-1 text-sm">Your account requires a password change before continuing.</p>
        </div>
        <div className="card">
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
              {errors.general}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <PWField field="currentPassword" label="Current Password" placeholder="Your temporary password" />
            <PWField field="newPassword" label="New Password" placeholder="Minimum 8 characters" />
            <PWField field="confirmPassword" label="Confirm New Password" placeholder="Repeat new password" />
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Update Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
