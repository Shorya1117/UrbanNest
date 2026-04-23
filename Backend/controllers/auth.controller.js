const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { User, SuperAdmin, OTP } = require("../models");
const { sendOTPEmail } = require("../utils/email");
const { successResponse, errorResponse } = require("../utils/response");

// ─── Helpers ──────────────────────────────────────────────────────────────────
const generateToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const generateOTP = () =>
  crypto.randomInt(100000, 999999).toString();

// ─── SUPER_ADMIN Login (kept for direct API use if needed) ───────────────────
const superAdminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return errorResponse(res, 400, "Email and password are required.");

    const admin = await SuperAdmin.findOne({ email: email.toLowerCase() }).select("+password");
    if (!admin || !(await admin.comparePassword(password)))
      return errorResponse(res, 401, "Invalid credentials.");

    const token = generateToken(admin._id, "SUPER_ADMIN");
    return successResponse(res, 200, "Login successful.", {
      token,
      mustChangePassword: false,
      user: {
        id: admin._id,
        name: "Super Admin",
        email: admin.email,
        role: "SUPER_ADMIN",
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── ADMIN Login (handles SUPER_ADMIN + ADMIN from single login page) ─────────
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return errorResponse(res, 400, "Email and password are required.");

    // ── Step 1: Check SuperAdmin collection first ──────────────────────────
    const superAdmin = await SuperAdmin.findOne({ email: email.toLowerCase() }).select("+password");
    console.log("🔍 SuperAdmin found:", superAdmin ? "YES" : "NO");
    if (superAdmin) {
      const isMatch = await superAdmin.comparePassword(password);
      console.log("🔍 Password match:", isMatch);
      if (!isMatch) return errorResponse(res, 401, "Invalid credentials.");

      const token = generateToken(superAdmin._id, "SUPER_ADMIN");
      return successResponse(res, 200, "Login successful.", {
        token,
        mustChangePassword: false,
        user: {
          id: superAdmin._id,
          name: "Super Admin",
          email: superAdmin.email,
          role: "SUPER_ADMIN",
        },
      });
    }

    // ── Step 2: Check User collection with ADMIN role ──────────────────────
    const admin = await User.findOne({
      email: email.toLowerCase(),
      role: "ADMIN",
    }).select("+password");

    if (!admin || !(await admin.comparePassword(password)))
      return errorResponse(res, 401, "Invalid credentials.");

    if (!admin.isApproved)
      return errorResponse(res, 403, "Account is not approved.");

    const token = generateToken(admin._id, admin.role);
    return successResponse(res, 200, "Login successful.", {
      token,
      mustChangePassword: admin.mustChangePassword || false,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        societyId: admin.societyId,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── USER: Send OTP ───────────────────────────────────────────────────────────
const sendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return errorResponse(res, 400, "Email is required.");

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return errorResponse(res, 404, "No account found with this email.");
    if (!user.isApproved) return errorResponse(res, 403, "Your account is pending approval.");
    if (!user.isActive) return errorResponse(res, 403, "Your account has been deactivated.");

    await OTP.deleteMany({ email: email.toLowerCase() });

    const otp = generateOTP();
    const expiresAt = new Date(
      Date.now() + (Number(process.env.OTP_EXPIRES_MINUTES) || 10) * 60 * 1000
    );

    const hashedOTP = await bcrypt.hash(otp, 10);
    await OTP.create({ email: email.toLowerCase(), otp: hashedOTP, expiresAt });

    await sendOTPEmail(email, otp);

    return successResponse(res, 200, "OTP sent to your email.");
  } catch (error) {
    next(error);
  }
};

// ─── USER: Verify OTP ─────────────────────────────────────────────────────────
const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return errorResponse(res, 400, "Email and OTP are required.");

    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      isUsed: false,
    }).select("+otp");

    if (!otpRecord) return errorResponse(res, 400, "OTP not found or already used.");
    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return errorResponse(res, 400, "OTP has expired. Please request a new one.");
    }

    otpRecord.attempts += 1;
    if (otpRecord.attempts > 5) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return errorResponse(res, 429, "Too many failed attempts. Please request a new OTP.");
    }
    await otpRecord.save();

    const isMatch = await bcrypt.compare(otp.toString(), otpRecord.otp);
    if (!isMatch) return errorResponse(res, 400, "Invalid OTP.");

    otpRecord.isUsed = true;
    await otpRecord.save();

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return errorResponse(res, 404, "User not found.");
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });
    const token = generateToken(user._id, user.role);

    return successResponse(res, 200, "Login successful.", {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        societyId: user.societyId,
        flatId: user.flatId,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── ADMIN: Change Password ───────────────────────────────────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return errorResponse(res, 400, "Current and new password are required.");
    if (newPassword.length < 8)
      return errorResponse(res, 400, "New password must be at least 8 characters.");

    const user = await User.findById(req.user._id).select("+password");
    if (!user) return errorResponse(res, 404, "User not found.");

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return errorResponse(res, 401, "Current password is incorrect.");

    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    return successResponse(res, 200, "Password changed successfully.");
  } catch (error) {
    next(error);
  }
};

// ─── Get current authenticated user ──────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    return successResponse(res, 200, "User fetched.", { user: req.user });
  } catch (error) {
    next(error);
  }
};

module.exports = { superAdminLogin, adminLogin, sendOTP, verifyOTP, changePassword, getMe };