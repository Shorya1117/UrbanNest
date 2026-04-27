import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, RefreshCw, Mail, Shield } from "lucide-react";
import toast from "react-hot-toast";
import { authAPI } from "../../api/services";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { Button } from "../../components/ui";
import logo from "../../assets/logo.jpeg";

export default function UserLogin() {
  const { login } = useAuth();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();

  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(0);

  const startTimer = () => {
    setTimer(60);
    const iv = setInterval(() => {
      setTimer((p) => {
        if (p <= 1) {
          clearInterval(iv);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
  };

  const handleSendOTP = async (e) => {
    e?.preventDefault();
    if (!email.trim()) return setError("Please enter your email address.");
    setError("");
    setLoading(true);

    try {
      await authAPI.sendOTP(email.trim().toLowerCase());
      toast.success("OTP sent to your email!");
      setStep("otp");
      startTimer();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to send OTP. Check your email."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e?.preventDefault();
    if (otp.length !== 6)
      return setError("Please enter the 6-digit OTP.");

    setError("");
    setLoading(true);

    try {
      const res = await authAPI.verifyOTP(email, otp);
      const { token, user } = res.data.data;

      login(token, user);
      toast.success(`Welcome back, ${user.name}!`);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Invalid OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
      {/* Left panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-10 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(160deg, #0A1628 0%, #0F2D4A 50%, #0A1628 100%)",
        }}
      >
        <div
          className="absolute top-20 -left-20 w-72 h-72 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, #10B981, transparent)",
          }}
        />
        <div
          className="absolute bottom-32 right-0 w-56 h-56 rounded-full opacity-15"
          style={{
            background: "radial-gradient(circle, #3B82F6, transparent)",
          }}
        />

        <div className="relative z-10">
          <div className="w-10 h-10 rounded-xl overflow-hidden">
            <img
              src={logo}
              alt="UrbanNest Logo"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <span
            className="text-white font-bold text-xl"
            style={{ fontFamily: "Syne" }}
          >
            UrbanNest
          </span>
        </div>

        <div>
          <h2
            className="text-white text-4xl font-bold leading-tight mb-4"
            style={{ fontFamily: "Syne" }}
          >
            Your society,<br />connected.
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: "15px",
              lineHeight: "1.7",
            }}
          >
            Marketplace, complaints, services, and community — all in one place
            for your residential society.
          </p>
        </div>

        <div className="relative z-10 space-y-3">
          {[
            "Marketplace to buy & sell within your society",
            "Raise complaints and track resolution",
            "Find trusted local service providers",
          ].map((t) => (
            <div key={t} className="flex items-center gap-3">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "rgba(16,185,129,0.2)" }}
              >
                <svg
                  className="w-2.5 h-2.5"
                  viewBox="0 0 10 10"
                  fill="#10B981"
                >
                  <path d="M2 5l2.5 2.5L8 3" />
                </svg>
              </div>
              <span
                style={{
                  color: "rgba(255,255,255,0.6)",
                  fontSize: "13px",
                }}
              >
                {t}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="absolute top-6 right-6 w-9 h-9 rounded-xl flex items-center justify-center btn-ghost"
        >
          {isDark ? (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          ) : (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          )}
        </button>

        <div className="w-full max-w-sm animate-fade-in">
          {/* Centered Bigger Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-md">
              <img
                src={logo}
                alt="UrbanNest Logo"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {step === "email" ? (
            <>
              <div className="mb-8 text-center">
                <h1
                  className="text-2xl font-bold mb-1"
                  style={{
                    fontFamily: "Syne",
                    color: "var(--text-primary)",
                  }}
                >
                  Resident Login
                </h1>
                <p
                  className="text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  Enter your registered email to receive an OTP.
                </p>
              </div>

              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="label">Email Address</label>
                  <div className="relative">
                    <Mail
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--text-muted)" }}
                    />
                    <input
                      type="email"
                      className="input pl-10"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      autoFocus
                    />
                  </div>
                  {error && (
                    <p
                      className="text-xs font-medium"
                      style={{ color: "#EF4444" }}
                    >
                      {error}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  loading={loading}
                  className="w-full"
                  size="lg"
                >
                  Send OTP <ArrowRight size={15} />
                </Button>
              </form>

              <p
                className="text-center text-sm mt-8"
                style={{ color: "var(--text-muted)" }}
              >
                Admin or Secretary?{" "}
                <a
                  href="/admin/login"
                  className="font-semibold"
                  style={{ color: "var(--emerald)" }}
                >
                  Login here
                </a>
              </p>
            </>
          ) : (
            <>
              <div className="mb-8 text-center">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 mx-auto"
                  style={{ background: "var(--emerald-glow)" }}
                >
                  <Shield
                    size={22}
                    style={{ color: "var(--emerald)" }}
                  />
                </div>
                <h1
                  className="text-2xl font-bold mb-1"
                  style={{
                    fontFamily: "Syne",
                    color: "var(--text-primary)",
                  }}
                >
                  Enter OTP
                </h1>
                <p
                  className="text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  Sent to{" "}
                  <strong style={{ color: "var(--text-primary)" }}>
                    {email}
                  </strong>
                </p>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="label">6-Digit Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="• • • • • •"
                    className="input text-center font-bold tracking-[0.6em]"
                    style={{
                      fontSize: "24px",
                      letterSpacing: "0.5em",
                    }}
                    value={otp}
                    onChange={(e) => {
                      setOtp(
                        e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 6)
                      );
                      setError("");
                    }}
                    autoFocus
                  />
                  {error && (
                    <p
                      className="text-xs font-medium"
                      style={{ color: "#EF4444" }}
                    >
                      {error}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  loading={loading}
                  disabled={otp.length !== 6}
                  className="w-full"
                  size="lg"
                >
                  Verify & Login
                </Button>
              </form>

              <div className="flex items-center justify-between mt-5">
                <button
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                    setError("");
                  }}
                  className="text-sm font-medium"
                  style={{ color: "var(--text-muted)" }}
                >
                  ← Change Email
                </button>

                <button
                  onClick={() => {
                    if (timer === 0) handleSendOTP();
                  }}
                  disabled={timer > 0}
                  className="flex items-center gap-1.5 text-sm font-semibold"
                  style={{
                    color:
                      timer > 0
                        ? "var(--text-muted)"
                        : "var(--emerald)",
                  }}
                >
                  <RefreshCw size={13} />
                  {timer > 0
                    ? `Resend in ${timer}s`
                    : "Resend OTP"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}