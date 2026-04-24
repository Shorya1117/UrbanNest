import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Mail, KeyRound, ArrowRight, RefreshCw, User, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { authAPI } from "../../api/services";
import { useAuth } from "../../context/AuthContext";
import { Button, Input } from "../../components/ui";
import logo from "../../assets/logo.jpeg";

const STEPS = { EMAIL: "email", OTP: "otp" };
const ROLES = { RESIDENT: "resident", ADMIN: "admin" };

export default function UserLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState(ROLES.RESIDENT);
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [timer, setTimer] = useState(0);

  const startTimer = () => {
    setTimer(60);
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email.trim()) return setErrors({ email: "Email is required." });
    setErrors({});
    setLoading(true);
    try {
      // Both Resident and Admin use the same OTP send endpoint on the backend
      await authAPI.sendOTP(email.trim().toLowerCase());
      toast.success("OTP sent to your email!");
      setStep(STEPS.OTP);
      startTimer();
    } catch (err) {
      setErrors({ email: err.response?.data?.message || "Failed to send OTP." });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp.trim()) return setErrors({ otp: "Please enter the OTP." });
    setErrors({});
    setLoading(true);
    try {
      const res = await authAPI.verifyOTP(email, otp.trim());
      const { token, user } = res.data.data;
      
      login(token, user);
      toast.success(`Welcome back, ${user.name}!`);

      // Route based on user role
      if (user.role === "SUPER_ADMIN") navigate("/superadmin");
      else if (user.role === "ADMIN") navigate("/admin");
      else navigate("/dashboard");
      
    } catch (err) {
      setErrors({ otp: err.response?.data?.message || "Invalid OTP." });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setLoading(true);
    try {
      await authAPI.sendOTP(email);
      toast.success("New OTP sent!");
      setOtp("");
      startTimer();
    } catch {
      toast.error("Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        {/* Logo & Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-xl shadow-blue-500/10 flex items-center justify-center mb-4 p-2">
            <img src={logo} alt="UrbanNest" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">UrbanNest</h1>
          <p className="text-gray-500 text-sm mt-1">Intelligent Society Management</p>
        </div>

        <div className="bg-white rounded-[2rem] shadow-2xl shadow-gray-200/50 p-8 border border-gray-100">
          {/* Role Toggle */}
          {step === STEPS.EMAIL && (
            <div className="flex p-1 bg-gray-100 rounded-2xl mb-8">
              <button
                onClick={() => setRole(ROLES.RESIDENT)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  role === ROLES.RESIDENT 
                    ? "bg-white text-blue-600 shadow-sm" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <User size={16} /> Residence
              </button>
              <button
                onClick={() => setRole(ROLES.ADMIN)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  role === ROLES.ADMIN 
                    ? "bg-white text-blue-600 shadow-sm" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <ShieldCheck size={16} /> Society Admin
              </button>
            </div>
          )}

          {/* Form Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              {step === STEPS.EMAIL 
                ? (role === ROLES.RESIDENT ? "Welcome Home" : "Admin Portal")
                : "Verify Identity"}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {step === STEPS.EMAIL 
                ? "Enter your registered email to continue"
                : `We've sent a code to ${email}`}
            </p>
          </div>

          {step === STEPS.EMAIL ? (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    className={`w-full pl-12 pr-4 py-4 bg-gray-50 border-2 rounded-2xl outline-none transition-all ${
                      errors.email ? "border-red-100 bg-red-50" : "border-transparent focus:border-blue-500/20 focus:bg-white"
                    }`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500 font-medium ml-1">{errors.email}</p>}
              </div>

              <Button type="submit" loading={loading} className="w-full py-4 rounded-2xl text-lg shadow-lg shadow-blue-500/20" size="lg">
                Continue <ArrowRight size={20} className="ml-2" />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 text-center block">6-Digit OTP</label>
                <input
                  className={`w-full text-center text-4xl font-black tracking-[0.5em] py-5 bg-gray-50 border-2 rounded-2xl outline-none transition-all ${
                    errors.otp ? "border-red-100 bg-red-50" : "border-transparent focus:border-blue-500/20 focus:bg-white"
                  }`}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  autoFocus
                />
                {errors.otp && <p className="text-xs text-red-500 font-medium text-center">{errors.otp}</p>}
              </div>

              <Button type="submit" loading={loading} className="w-full py-4 rounded-2xl text-lg shadow-lg shadow-blue-500/20" size="lg">
                Verify & Login <ArrowRight size={20} className="ml-2" />
              </Button>

              <div className="flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={() => { setStep(STEPS.EMAIL); setOtp(""); setErrors({}); }}
                  className="text-sm text-gray-400 hover:text-gray-600 font-bold transition-colors"
                >
                  Change Email
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={timer > 0}
                  className="flex items-center gap-1.5 text-sm font-bold text-blue-600 disabled:text-gray-300 transition-colors"
                >
                  <RefreshCw size={14} className={timer > 0 ? "" : "animate-spin-slow"} />
                  {timer > 0 ? `Resend in ${timer}s` : "Resend OTP"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-sm mt-8">
          By logging in, you agree to our <span className="text-gray-600 font-bold cursor-pointer">Terms</span> & <span className="text-gray-600 font-bold cursor-pointer">Privacy</span>
        </p>
      </div>
    </div>
  );
}
