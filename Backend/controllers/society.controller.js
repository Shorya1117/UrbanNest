const { Society, User } = require("../models");
const { successResponse, errorResponse } = require("../utils/response");
const bcrypt = require("bcryptjs");

// ─── Create Society (SuperAdmin only) ────────────────────────────────────────
const createSociety = async (req, res, next) => {
  try {
    const { name, address, societyCode, settings } = req.body;
    if (!name || !address || !societyCode)
      return errorResponse(res, 400, "Name, address, and societyCode are required.");

    const society = await Society.create({ name, address, societyCode, settings });
    return successResponse(res, 201, "Society created successfully.", { society });
  } catch (error) {
    next(error);
  }
};

// ─── Get All Societies (SuperAdmin only) ──────────────────────────────────────
const getAllSocieties = async (req, res, next) => {
  try {
    const societies = await Society.find().populate("adminId", "name email").lean();
    return successResponse(res, 200, "Societies fetched.", { societies });
  } catch (error) {
    next(error);
  }
};

// ─── Get Single Society ───────────────────────────────────────────────────────
const getSociety = async (req, res, next) => {
  try {
    const society = await Society.findById(req.params.id).populate("adminId", "name email").lean();
    if (!society) return errorResponse(res, 404, "Society not found.");
    return successResponse(res, 200, "Society fetched.", { society });
  } catch (error) {
    next(error);
  }
};

// ─── Update Society ───────────────────────────────────────────────────────────
const updateSociety = async (req, res, next) => {
  try {
    const { name, address, settings, isActive } = req.body;
    const society = await Society.findByIdAndUpdate(
      req.params.id,
      { name, address, settings, isActive },
      { new: true, runValidators: true }
    );
    if (!society) return errorResponse(res, 404, "Society not found.");
    return successResponse(res, 200, "Society updated.", { society });
  } catch (error) {
    next(error);
  }
};

// ─── Assign Admin to Society (SuperAdmin) ────────────────────────────────────
const assignAdmin = async (req, res, next) => {
  try {
    const { adminEmail, adminName, phone } = req.body;
    const societyId = req.params.id;

    const society = await Society.findById(societyId);
    if (!society) return errorResponse(res, 404, "Society not found.");

    // Check if admin email already exists in this society
    const existing = await User.findOne({ email: adminEmail.toLowerCase(), societyId });
    if (existing) return errorResponse(res, 409, "This email is already registered in this society.");

    // Create admin user with temporary password
    const tempPassword = Math.random().toString(36).slice(-10) + "A1!";
    const admin = await User.create({
      name: adminName,
      email: adminEmail.toLowerCase(),
      password: tempPassword,
      phone,
      role: "ADMIN",
      societyId,
      isApproved: true,
      mustChangePassword: true,
    });

    // Link admin to society
    society.adminId = admin._id;
    await society.save();

    // In production, send tempPassword via email here
    return successResponse(res, 201, "Admin assigned successfully.", {
      admin: { id: admin._id, email: admin.email, name: admin.name },
      tempPassword, // Only in dev — remove in prod, send via email
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createSociety, getAllSocieties, getSociety, updateSociety, assignAdmin };
