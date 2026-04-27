const { Society, User } = require("../models");
const { successResponse, errorResponse } = require("../utils/response");
const { sendAdminCredentials } = require("../utils/email");

const createSociety = async (req, res, next) => {
  try {
    const { name, address, societyCode, settings } = req.body;
    if (!name || !societyCode)
      return errorResponse(res, 400, "Name and societyCode are required.");
    const society = await Society.create({ name, address, societyCode, settings });
    return successResponse(res, 201, "Society created.", { society });
  } catch (error) { next(error); }
};

const getAllSocieties = async (req, res, next) => {
  try {
    const societies = await Society.find()
      .populate("adminId", "name email phone")
      .lean();
    return successResponse(res, 200, "Societies fetched.", { societies });
  } catch (error) { next(error); }
};

const getSociety = async (req, res, next) => {
  try {
    const society = await Society.findById(req.params.id)
      .populate("adminId", "name email phone")
      .lean();
    if (!society) return errorResponse(res, 404, "Society not found.");
    return successResponse(res, 200, "Society fetched.", { society });
  } catch (error) { next(error); }
};

const updateSociety = async (req, res, next) => {
  try {
    const { name, address, settings, isActive } = req.body;
    const society = await Society.findByIdAndUpdate(
      req.params.id, { name, address, settings, isActive },
      { new: true, runValidators: true }
    );
    if (!society) return errorResponse(res, 404, "Society not found.");
    return successResponse(res, 200, "Society updated.", { society });
  } catch (error) { next(error); }
};

const assignAdmin = async (req, res, next) => {
  try {
    const { adminEmail, adminName, phone } = req.body;
    const societyId = req.params.id;

    if (!adminEmail || !adminName || !phone)
      return errorResponse(res, 400, "adminEmail, adminName and phone are required.");

    const society = await Society.findById(societyId);
    if (!society) return errorResponse(res, 404, "Society not found.");

    // ── Remove old admin if exists ──────────────────────────────────────────
    if (society.adminId) {
      await User.findByIdAndDelete(society.adminId);
      society.adminId = null;
    }

    // ── Check email not used elsewhere ──────────────────────────────────────
    const existing = await User.findOne({ email: adminEmail.toLowerCase() });
    if (existing) {
      return errorResponse(res, 409,
        `Email ${adminEmail} is already in use. Please use a different email.`
      );
    }

    // ── Generate temp password ──────────────────────────────────────────────
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let tempPassword = Array.from({ length: 7 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("") + "A1!";

    // ── Create admin user ───────────────────────────────────────────────────
    const admin = await User.create({
      name: adminName,
      email: adminEmail.toLowerCase(),
      password: tempPassword,
      phone,
      role: "ADMIN",
      societyId,
      isApproved: true,
      isActive: true,
      mustChangePassword: true,
    });

    society.adminId = admin._id;
    await society.save();

    // ── Send email (non-blocking) ───────────────────────────────────────────
    try {
      await sendAdminCredentials({
        email: adminEmail, name: adminName,
        societyName: society.name, tempPassword,
      });
    } catch (e) {
      console.error("⚠️ Credential email failed:", e.message);
    }

    return successResponse(res, 201, "Admin assigned.", {
      admin: { id: admin._id, name: admin.name, email: admin.email, phone: admin.phone },
      tempPassword,
      loginUrl: `${process.env.CLIENT_URL || "http://localhost:3000"}/admin/login`,
    });
  } catch (error) { next(error); }
};

const removeAdmin = async (req, res, next) => {
  try {
    const society = await Society.findById(req.params.id);
    if (!society) return errorResponse(res, 404, "Society not found.");
    if (!society.adminId) return errorResponse(res, 400, "No admin to remove.");
    await User.findByIdAndDelete(society.adminId);
    society.adminId = null;
    await society.save();
    return successResponse(res, 200, "Admin removed.");
  } catch (error) { next(error); }
};

module.exports = { createSociety, getAllSocieties, getSociety, updateSociety, assignAdmin, removeAdmin };