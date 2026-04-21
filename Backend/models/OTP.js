const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    otp: {
      type: String,
      required: [true, "OTP is required"],
      select: false,
    },
    expiresAt: {
      type: Date,
      required: [true, "Expiry time is required"],
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    attempts: {
      type: Number,
      default: 0,
      max: [5, "Maximum OTP attempts exceeded"],
    },
  },
  { timestamps: true }
);

// Auto-delete expired OTP documents (TTL index)
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ email: 1, isUsed: 1 });

module.exports = mongoose.model("OTP", otpSchema);
