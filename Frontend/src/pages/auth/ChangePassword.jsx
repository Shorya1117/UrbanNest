import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Eye, EyeOff, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { authAPI } from "../../api/services";
import { Button } from "../../components/ui";

export default function ChangePassword() {
  const navigate = useNavigate();
  const [form, setForm]   = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [show, setShow]   = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]  = useState({});

  const validate = () => {
    const e = {};
    if (!form.currentPassword)                            e.currentPassword = "Required.";
    if (!form.newPassword || form.newPassword.length < 8) e.newPassword     = "Min 8 characters.";
    if (form.newPassword !== form.confirmPassword)        e.confirmPassword = "Passwords don't match.";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);
    setErrors({}); setLoading(true);
    try {
      await authAPI.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      toast.success("Password changed! Please log in again.");
      navigate("/admin/login");
    } catch (err) {
      setErrors({ general: err.response?.data?.message || "Failed." });
    } finally { setLoading(false); }
  };

  const PwField = ({ field, label }) => (
    <div className="space-y-1.5">
      <label className="label">{label}</label>
      <div className="relative">
        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2"
          style={{ color: "var(--text-muted)" }} />
        <input type={show[field] ? "text" : "password"}
          className={`input pl-10 pr-10 ${errors[field] ? "input-error" : ""}`}
          value={form[field]}
          onChange={(e) => setForm({ ...form, [field]: e.target.value })} />
        <button type="button" onClick={() => setShow({ ...show, [field]: !show[field] })}
          className="absolute right-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--text-muted)" }}>
          {show[field] ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {errors[field] && <p className="text-xs" style={{ color: "#EF4444" }}>{errors[field]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "var(--emerald-glow)", border: "2px solid var(--emerald)" }}>
            <ShieldCheck size={26} style={{ color: "var(--emerald)" }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Syne", color: "var(--text-primary)" }}>
            Set New Password
          </h1>
          <p className="text-sm mt-2 text-center" style={{ color: "var(--text-muted)" }}>
            Your account requires a password change before you can continue.
          </p>
        </div>

        <div className="card-flat rounded-2xl p-8">
          {errors.general && (
            <div className="mb-5 p-3.5 rounded-xl text-sm font-medium"
              style={{ background: "rgba(239,68,68,0.08)", color: "#DC2626" }}>
              {errors.general}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <PwField field="currentPassword" label="Current Password" />
            <PwField field="newPassword"     label="New Password" />
            <PwField field="confirmPassword" label="Confirm New Password" />
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Update Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}