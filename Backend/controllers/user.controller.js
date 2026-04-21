const { User, Flat, Notification } = require("../models");
const { successResponse, errorResponse } = require("../utils/response");
const { uploadSingle, deleteImage } = require("../config/cloudinary");

// ─── Get All Residents (Admin) ────────────────────────────────────────────────
const getResidents = async (req, res, next) => {
  try {
    const societyId = req.societyId;
    const { role, flatId, isApproved, page = 1, limit = 20 } = req.query;

    const filter = { societyId };
    if (role) filter.role = role;
    if (flatId) filter.flatId = flatId;
    if (isApproved !== undefined) filter.isApproved = isApproved === "true";

    const skip = (Number(page) - 1) * Number(limit);
    const [residents, total] = await Promise.all([
      User.find(filter)
        .populate("flatId", "flatNumber blockNumber")
        .populate("parentId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      User.countDocuments(filter),
    ]);

    return successResponse(res, 200, "Residents fetched.", {
      residents,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Single Resident ──────────────────────────────────────────────────────
const getResident = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, societyId: req.societyId })
      .populate("flatId", "flatNumber blockNumber ownershipType")
      .populate("parentId", "name email phone")
      .lean();

    if (!user) return errorResponse(res, 404, "Resident not found.");
    return successResponse(res, 200, "Resident fetched.", { user });
  } catch (error) {
    next(error);
  }
};

// ─── Add Resident (Admin) ─────────────────────────────────────────────────────
const addResident = async (req, res, next) => {
  try {
    const societyId = req.societyId;
    const { name, email, phone, role, flatId, parentId } = req.body;

    if (!name || !email || !phone || !role)
      return errorResponse(res, 400, "Name, email, phone, and role are required.");
    if (!["HEAD", "MEMBER"].includes(role))
      return errorResponse(res, 400, "Role must be HEAD or MEMBER.");

    // Verify flat belongs to this society
    if (flatId) {
      const flat = await Flat.findOne({ _id: flatId, societyId });
      if (!flat) return errorResponse(res, 404, "Flat not found in this society.");

      // A flat can only have one HEAD
      if (role === "HEAD") {
        const existingHead = await User.findOne({ flatId, role: "HEAD", societyId });
        if (existingHead) return errorResponse(res, 409, "This flat already has a HEAD resident.");
      }
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      role,
      societyId,
      flatId: flatId || null,
      parentId: parentId || null,
      isApproved: true,
    });

    // Add user to flat's members array
    if (flatId) {
      await Flat.findByIdAndUpdate(flatId, {
        $addToSet: { members: user._id },
        isOccupied: true,
      });
    }

    return successResponse(res, 201, "Resident added successfully.", { user });
  } catch (error) {
    next(error);
  }
};

// ─── Update Resident (Admin) ──────────────────────────────────────────────────
const updateResident = async (req, res, next) => {
  try {
    const { name, phone, role, flatId, parentId, isApproved, isActive } = req.body;

    const user = await User.findOne({ _id: req.params.id, societyId: req.societyId });
    if (!user) return errorResponse(res, 404, "Resident not found.");

    // Handle flat transfer
    if (flatId && flatId !== user.flatId?.toString()) {
      // Verify new flat
      const newFlat = await Flat.findOne({ _id: flatId, societyId: req.societyId });
      if (!newFlat) return errorResponse(res, 404, "New flat not found in this society.");

      // Remove from old flat
      if (user.flatId) {
        await Flat.findByIdAndUpdate(user.flatId, { $pull: { members: user._id } });
        const oldFlatMembers = await User.countDocuments({ flatId: user.flatId });
        if (oldFlatMembers === 0)
          await Flat.findByIdAndUpdate(user.flatId, { isOccupied: false });
      }
      // Add to new flat
      await Flat.findByIdAndUpdate(flatId, { $addToSet: { members: user._id }, isOccupied: true });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (flatId) user.flatId = flatId;
    if (parentId !== undefined) user.parentId = parentId || null;
    if (isApproved !== undefined) user.isApproved = isApproved;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();
    return successResponse(res, 200, "Resident updated.", { user });
  } catch (error) {
    next(error);
  }
};

// ─── Remove Resident (Admin) ──────────────────────────────────────────────────
const removeResident = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, societyId: req.societyId });
    if (!user) return errorResponse(res, 404, "Resident not found.");

    // Remove from flat
    if (user.flatId) {
      await Flat.findByIdAndUpdate(user.flatId, { $pull: { members: user._id } });
      const remaining = await User.countDocuments({ flatId: user.flatId, _id: { $ne: user._id } });
      if (remaining === 0) await Flat.findByIdAndUpdate(user.flatId, { isOccupied: false });
    }

    // Also remove any MEMBER children linked to this HEAD
    if (user.role === "HEAD") {
      await User.updateMany(
        { parentId: user._id, societyId: req.societyId },
        { $set: { parentId: null, flatId: null } }
      );
    }

    await user.deleteOne();
    return successResponse(res, 200, "Resident removed successfully.");
  } catch (error) {
    next(error);
  }
};

// ─── Upload Avatar (User self) ────────────────────────────────────────────────
const uploadAvatar = [
  (req, res, next) => {
    const upload = require("../config/cloudinary").uploadSingle("avatars");
    upload(req, res, (err) => {
      if (err) return errorResponse(res, 400, err.message);
      next();
    });
  },
  async (req, res, next) => {
    try {
      if (!req.file) return errorResponse(res, 400, "No image uploaded.");

      const user = await User.findById(req.user._id);
      // Delete old avatar
      if (user.avatar?.publicId) await deleteImage(user.avatar.publicId);

      user.avatar = { url: req.file.path, publicId: req.file.filename };
      await user.save();

      return successResponse(res, 200, "Avatar updated.", { avatar: user.avatar });
    } catch (error) {
      next(error);
    }
  },
];

// ─── Get pending approvals (Admin) ────────────────────────────────────────────
const getPendingApprovals = async (req, res, next) => {
  try {
    const users = await User.find({ societyId: req.societyId, isApproved: false })
      .populate("flatId", "flatNumber blockNumber")
      .lean();
    return successResponse(res, 200, "Pending approvals fetched.", { users });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getResidents,
  getResident,
  addResident,
  updateResident,
  removeResident,
  uploadAvatar,
  getPendingApprovals,
};
