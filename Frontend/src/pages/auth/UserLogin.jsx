import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Mail, KeyRound, ArrowRight, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { authAPI } from "../../api/services";
import { useAuth } from "../../context/AuthContext";
import { Button, Input } from "../../components/ui";
import logo from "../../assets/logo.jpeg";
const STEPS = { EMAIL: "email", OTP: "otp" };

export default function UserLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
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
      navigate("/dashboard");
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <img 
            src={logo} 
            alt="logo" 
            className="w-24 h-24 object-contain mb-2"
          />
          <h1 className="text-2xl font-extrabold text-gray-900">UrbanNest</h1>
          <p className="text-sm text-gray-500">Your Society, Connected.</p>
        </div>
        <div className="card">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`flex-1 h-1.5 rounded-full ${step === STEPS.EMAIL || step === STEPS.OTP ? "bg-primary" : "bg-gray-200"}`} />
            <div className={`flex-1 h-1.5 rounded-full ${step === STEPS.OTP ? "bg-primary" : "bg-gray-200"}`} />
          </div>

          {step === STEPS.EMAIL ? (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-extrabold text-gray-900">Resident Login</h2>
                <p className="text-sm text-gray-500 mt-1">Enter your registered email to receive an OTP.</p>
              </div>
              <form onSubmit={handleSendOTP} className="space-y-5">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email}
                  autoFocus
                />
                <Button type="submit" loading={loading} className="w-full" size="lg">
                  Send OTP <ArrowRight size={16} />
                </Button>
              </form>
              <p className="text-center text-sm text-gray-500 mt-5">
                Admin?{" "}
                <a href="/admin/login" className="text-primary font-semibold hover:underline">Login here</a>
              </p>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-extrabold text-gray-900">Enter OTP</h2>
                <p className="text-sm text-gray-500 mt-1">
                  We sent a 6-digit code to <span className="font-semibold text-gray-700">{email}</span>
                </p>
              </div>
              <form onSubmit={handleVerifyOTP} className="space-y-5">
                <div>
                  <label className="label">One-Time Password</label>
                  <input
                    className={`input text-center text-2xl font-extrabold tracking-[0.5em] ${errors.otp ? "border-red-400 focus:ring-red-200" : ""}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="● ● ● ● ● ●"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    autoFocus
                  />
                  {errors.otp && <p className="text-xs text-red-500 mt-1">{errors.otp}</p>}
                </div>

                <Button type="submit" loading={loading} className="w-full" size="lg">
                  Verify & Login <ArrowRight size={16} />
                </Button>
              </form>

              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={() => { setStep(STEPS.EMAIL); setOtp(""); setErrors({}); }}
                  className="text-sm text-gray-500 hover:text-gray-700 font-semibold"
                >
                  ← Change Email
                </button>
                <button
                  onClick={handleResend}
                  disabled={timer > 0}
                  className="flex items-center gap-1 text-sm font-semibold text-primary disabled:text-gray-400 hover:underline"
                >
                  <RefreshCw size={13} />
                  {timer > 0 ? `Resend in ${timer}s` : "Resend OTP"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
