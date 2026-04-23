const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [80, "Name cannot exceed 80 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^\+?[0-9]{10,15}$/, "Please provide a valid phone number"],
    },
    role: {
      type: String,
      enum: ["ADMIN", "HEAD", "MEMBER"],
      required: [true, "Role is required"],
    },
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Society",
      required: [true, "Society reference is required"],
    },
    flatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Flat",
      default: null,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    avatar: {
      url: { type: String, trim: true, default: null },
      publicId: { type: String, trim: true, default: null }, // Cloudinary public_id for deletion
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Enforce unique email per society
userSchema.index({ email: 1, societyId: 1 }, { unique: true });
userSchema.index({ societyId: 1, role: 1 });
userSchema.index({ societyId: 1, flatId: 1 });

userSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password") || !this.password) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
