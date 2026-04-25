const { Complaint, Notification, User } = require("../models");
const { successResponse, errorResponse } = require("../utils/response");
const { deleteImage } = require("../config/cloudinary");

// ─── Create Complaint ─────────────────────────────────────────────────────────
const createComplaint = async (req, res, next) => {
  try {
    const { title, description, category, priority, flatNo, block } = req.body;
    if (!title || !description)
      return errorResponse(res, 400, "title and description are required.");

    const images = (req.files || []).map((file, idx) => ({
      url: file.path,
      publicId: file.filename,
      altText: `Complaint image ${idx + 1}`,
    }));

    const complaint = await Complaint.create({
      title,
      description,
      category: category || "other",
      priority: priority || "medium",
      flatNo: flatNo || null,
      block: block || null,
      images,
      createdBy: req.user._id,
      societyId: req.societyId,
    });

    await complaint.populate("createdBy", "name avatar flatId");

    // ── Notify all admins of the society about the new complaint ──────────
    // Run in background — don't block the response
    User.find(
      { societyId: req.societyId, role: "ADMIN", isActive: true, isApproved: true },
      "_id"
    )
      .lean()
      .then((admins) => {
        if (!admins.length) return;
        const adminNotifs = admins.map((a) => ({
          userId: a._id,
          title: "New Complaint Received",
          message: `${req.user.name || "A resident"} submitted a new complaint: "${title}"`,
          type: "COMPLAINT_UPDATE",
          societyId: req.societyId,
          senderRole: "USER",
          sentBy: req.user._id,
          recipientLabel: "Admin",
          deliveryStatus: "DELIVERED",
          metadata: { complaintId: complaint._id, status: "PENDING" },
        }));
        return Notification.insertMany(adminNotifs, { ordered: false });
      })
      .catch(() => {}); // silent — don't fail complaint creation if notify fails

    return successResponse(res, 201, "Complaint submitted successfully.", { complaint });
  } catch (error) {
    next(error);
  }
};

// ─── Get Complaints ───────────────────────────────────────────────────────────
const getComplaints = async (req, res, next) => {
  try {
    const { status, category, priority, page = 1, limit = 10 } = req.query;
    const filter = { societyId: req.societyId };

    // Non-admin users see only their own complaints
    if (!["ADMIN", "SUPER_ADMIN"].includes(req.user.role)) {
      filter.createdBy = req.user._id;
    }
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    const skip = (Number(page) - 1) * Number(limit);
    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .populate("createdBy", "name avatar flatId")
        .populate("assignedTo", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Complaint.countDocuments(filter),
    ]);

    return successResponse(res, 200, "Complaints fetched.", {
      complaints,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Single Complaint ─────────────────────────────────────────────────────
const getComplaint = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, societyId: req.societyId };
    if (!["ADMIN", "SUPER_ADMIN"].includes(req.user.role)) filter.createdBy = req.user._id;

    const complaint = await Complaint.findOne(filter)
      .populate("createdBy", "name avatar flatId")
      .populate("assignedTo", "name email")
      .lean();

    if (!complaint) return errorResponse(res, 404, "Complaint not found.");
    return successResponse(res, 200, "Complaint fetched.", { complaint });
  } catch (error) {
    next(error);
  }
};

// ─── Update Complaint Status (Admin) ─────────────────────────────────────────
const updateComplaintStatus = async (req, res, next) => {
  try {
    const { status, assignedTo, resolutionNote } = req.body;
    if (!status) return errorResponse(res, 400, "status is required.");
    if (!["PENDING", "IN_PROGRESS", "RESOLVED"].includes(status))
      return errorResponse(res, 400, "Invalid status.");

    const complaint = await Complaint.findOne({ _id: req.params.id, societyId: req.societyId });
    if (!complaint) return errorResponse(res, 404, "Complaint not found.");

    complaint.status = status;
    if (assignedTo) complaint.assignedTo = assignedTo;
    if (resolutionNote) complaint.resolutionNote = resolutionNote;
    if (status === "RESOLVED") complaint.resolvedAt = new Date();
    await complaint.save();

    // Notify the resident who raised the complaint
    const statusLabel = status.replace("_", " ");
    await Notification.create({
      userId: complaint.createdBy,
      title: "Complaint Status Updated",
      message: `Your complaint "${complaint.title}" status has been updated to ${statusLabel}.`,
      type: "COMPLAINT_UPDATE",
      societyId: req.societyId,
      senderRole: req.user.role,
      sentBy: req.user._id,
      recipientLabel: "Complaint Reporter",
      deliveryStatus: "DELIVERED",
      metadata: { complaintId: complaint._id, status },
    });

    return successResponse(res, 200, "Complaint updated successfully.", { complaint });
  } catch (error) {
    next(error);
  }
};

// ─── Delete Complaint (Owner or Admin) ───────────────────────────────────────
const deleteComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findOne({ _id: req.params.id, societyId: req.societyId });
    if (!complaint) return errorResponse(res, 404, "Complaint not found.");

    if (
      complaint.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "ADMIN"
    )
      return errorResponse(res, 403, "Not authorized.");

    if (complaint.status !== "PENDING" && req.user.role !== "ADMIN")
      return errorResponse(res, 400, "You can only delete pending complaints.");

    await Promise.all(complaint.images.map((img) => deleteImage(img.publicId)));
    await complaint.deleteOne();

    return successResponse(res, 200, "Complaint deleted.");
  } catch (error) {
    next(error);
  }
};

// ─── Complaint Stats (Admin) ──────────────────────────────────────────────────
const getComplaintStats = async (req, res, next) => {
  try {
    const stats = await Complaint.aggregate([
      { $match: { societyId: req.societyId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const formatted = { PENDING: 0, IN_PROGRESS: 0, RESOLVED: 0 };
    stats.forEach((s) => (formatted[s._id] = s.count));
    return successResponse(res, 200, "Complaint stats fetched.", { stats: formatted });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createComplaint,
  getComplaints,
  getComplaint,
  updateComplaintStatus,
  deleteComplaint,
  getComplaintStats,
};
