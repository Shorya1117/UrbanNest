const jwt = require("jsonwebtoken");
const { errorResponse } = require("../utils/response");
const { User, SuperAdmin } = require("../models");

// ─── Protect: verify JWT and attach user to req ───────────────────────────────
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(res, 401, "Not authorized. No token provided.");
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // SuperAdmin token
    if (decoded.role === "SUPER_ADMIN") {
      const superAdmin = await SuperAdmin.findById(decoded.id).select("-password");
      if (!superAdmin) return errorResponse(res, 401, "User not found.");
      req.user = { ...superAdmin.toObject(), role: "SUPER_ADMIN" };
      return next();
    }

    // Regular user / admin
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return errorResponse(res, 401, "User not found.");
    if (!user.isActive) return errorResponse(res, 403, "Account is deactivated.");
    if (!user.isApproved) return errorResponse(res, 403, "Account is pending approval.");

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

// ─── Restrict to specific roles ───────────────────────────────────────────────
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return errorResponse(res, 403, "You do not have permission to perform this action.");
    }
    next();
  };
};

// ─── Enforce societyId scoping ────────────────────────────────────────────────
// Ensures non-superadmin users can only query their own society
const enforceSociety = (req, res, next) => {
  if (req.user.role === "SUPER_ADMIN") return next();

  const paramSocietyId = req.params.societyId || req.body.societyId || req.query.societyId;

  if (paramSocietyId && paramSocietyId !== req.user.societyId.toString()) {
    return errorResponse(res, 403, "Access denied to this society.");
  }

  // Always override societyId with the user's own — prevents injection
  req.societyId = req.user.societyId;
  next();
};

module.exports = { protect, restrictTo, enforceSociety };
