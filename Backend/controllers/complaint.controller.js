const { Complaint, Notification, ServiceProvider, User } = require("../models");
const { successResponse, errorResponse } = require("../utils/response");
const { deleteImage } = require("../config/cloudinary");

// ── Keyword → serviceType mapping ─────────────────────────────────────────────
const COMPLAINT_SERVICE_MAP = [
  { keywords: ["water", "pipe", "leak", "tap", "drainage", "drain", "flood", "plumb", "bathroom", "toilet", "sink"], serviceType: "plumber" },
  { keywords: ["electric", "light", "power", "wiring", "switch", "socket", "mcb", "fuse", "bulb", "fan", "ac", "short circuit"], serviceType: "electrician" },
  { keywords: ["clean", "sweep", "garbage", "trash", "waste", "dirt", "hygiene", "mop", "dust"], serviceType: "maid" },
  { keywords: ["paint", "wall", "crack", "plaster", "ceiling", "roof", "seepage"], serviceType: "painter" },
  { keywords: ["carpenter", "door", "window", "lock", "wood", "hinge", "furniture", "cupboard", "almirah"], serviceType: "carpenter" },
  { keywords: ["security", "gate", "guard", "cctv", "camera", "theft", "safety", "intruder"], serviceType: "security" },
];

const suggestServiceType = (title, description) => {
  const text = `${title} ${description}`.toLowerCase();
  for (const rule of COMPLAINT_SERVICE_MAP) {
    if (rule.keywords.some((kw) => text.includes(kw))) return rule.serviceType;
  }
  return null;
};

// ─── Create Complaint ──────────────────────────────────────────────────────────
const createComplaint = async (req, res, next) => {
  try {
    const { title, description, category, priority, flatNo, block } = req.body;
    if (!title || !description)
      return errorResponse(res, 400, "title and description are required.");

    const images = (req.files || []).map((file, idx) => ({
      url: file.path, publicId: file.filename,
      altText: `Complaint image ${idx + 1}`,
    }));

    const suggestedServiceType = suggestServiceType(title, description);

    let suggestedProviders = [];
    if (suggestedServiceType) {
      suggestedProviders = await ServiceProvider.find({
        societyId: req.societyId,
        serviceType: suggestedServiceType,
        isActive: true,
      }).select("name phone serviceType photo averageRating").lean();
    }

    const complaint = await Complaint.create({
      title,
      description,
      images,
      createdBy: req.user._id,
      societyId: req.societyId,
    });

    await complaint.populate("createdBy", "name avatar flatId");

    // Notify society admins about the new complaint
    const admins = await User.find({ societyId: req.societyId, role: "ADMIN" }).select("_id");
    if (admins.length > 0) {
      const notifications = admins.map((admin) => ({
        userId: admin._id,
        message: `New complaint raised: "${title}" by ${complaint.createdBy.name}.`,
        type: "COMPLAINT_UPDATE",
        societyId: req.societyId,
        metadata: { complaintId: complaint._id, status: "PENDING" },
      }));
      await Notification.insertMany(notifications);
    }


    return successResponse(res, 201, "Complaint submitted.", {
      complaint,
      suggestedServiceType,
      suggestedProviders,
    });
  } catch (error) { next(error); }
};

// ─── Get Complaints ────────────────────────────────────────────────────────────
const getComplaints = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { societyId: req.societyId };
    if (!["ADMIN", "SUPER_ADMIN"].includes(req.user.role)) filter.createdBy = req.user._id;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .populate("createdBy", "name avatar flatId")
        .populate("assignedTo", "name phone serviceType photo averageRating")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Complaint.countDocuments(filter),
    ]);

    return successResponse(res, 200, "Complaints fetched.", {
      complaints,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) { next(error); }
};

// ─── Get Single Complaint ──────────────────────────────────────────────────────
const getComplaint = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, societyId: req.societyId };
    if (!["ADMIN", "SUPER_ADMIN"].includes(req.user.role)) filter.createdBy = req.user._id;

    const complaint = await Complaint.findOne(filter)
      .populate("createdBy", "name avatar flatId")
      .populate("assignedTo", "name phone serviceType photo averageRating")
      .lean();

    if (!complaint) return errorResponse(res, 404, "Complaint not found.");

    // Also return suggested providers for this complaint
    const suggestedServiceType = suggestServiceType(complaint.title, complaint.description);
    let suggestedProviders = [];
    if (suggestedServiceType) {
      suggestedProviders = await ServiceProvider.find({
        societyId: req.societyId, serviceType: suggestedServiceType, isActive: true,
      }).select("name phone serviceType photo averageRating").lean();
    }

    return successResponse(res, 200, "Complaint fetched.", { complaint, suggestedServiceType, suggestedProviders });
  } catch (error) { next(error); }
};

// ─── Update Status (Admin) — assigns a ServiceProvider ────────────────────────
const updateComplaintStatus = async (req, res, next) => {
  try {
    const { status, assignedTo, resolutionNote } = req.body;

    if (!["PENDING", "IN_PROGRESS", "RESOLVED"].includes(status))
      return errorResponse(res, 400, "Invalid status.");

    const complaint = await Complaint.findOne({ _id: req.params.id, societyId: req.societyId });
    if (!complaint) return errorResponse(res, 404, "Complaint not found.");

    complaint.status = status;

    // Validate assignedTo is a real ServiceProvider in this society
    if (assignedTo) {
      const provider = await ServiceProvider.findOne({ _id: assignedTo, societyId: req.societyId });
      if (!provider) return errorResponse(res, 404, "Service provider not found in this society.");
      complaint.assignedTo = provider._id;
    } else if (assignedTo === "" || assignedTo === null) {
      complaint.assignedTo = null;
    }

    if (resolutionNote) complaint.resolutionNote = resolutionNote;
    if (status === "RESOLVED") complaint.resolvedAt = new Date();
    await complaint.save();

    // Populate after save
    await complaint.populate("assignedTo", "name phone serviceType photo");

    await Notification.create({
      userId: complaint.createdBy,
      message: `Your complaint "${complaint.title}" is now ${status.replace(/_/g, " ")}.`,
      type: "COMPLAINT_UPDATE",
      societyId: req.societyId,
      metadata: { complaintId: complaint._id, status },
    });

    return successResponse(res, 200, "Complaint updated.", { complaint });
  } catch (error) { next(error); }
};

// ─── Delete Complaint ──────────────────────────────────────────────────────────
const deleteComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findOne({ _id: req.params.id, societyId: req.societyId });
    if (!complaint) return errorResponse(res, 404, "Complaint not found.");
    if (complaint.createdBy.toString() !== req.user._id.toString() && req.user.role !== "ADMIN")
      return errorResponse(res, 403, "Not authorized.");
    if (complaint.status !== "PENDING" && req.user.role !== "ADMIN")
      return errorResponse(res, 400, "You can only delete pending complaints.");
    await Promise.all(complaint.images.map((img) => deleteImage(img.publicId)));
    await complaint.deleteOne();
    return successResponse(res, 200, "Complaint deleted.");
  } catch (error) { next(error); }
};

// ─── Stats ─────────────────────────────────────────────────────────────────────
const getComplaintStats = async (req, res, next) => {
  try {
    const stats = await Complaint.aggregate([
      { $match: { societyId: req.societyId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const formatted = { PENDING: 0, IN_PROGRESS: 0, RESOLVED: 0 };
    stats.forEach((s) => { formatted[s._id] = s.count; });
    return successResponse(res, 200, "Stats fetched.", { stats: formatted });
  } catch (error) { next(error); }
};

// ─── Get Suggested Service Providers for a Complaint ──────────────────────────
const getSuggestedProviders = async (req, res, next) => {
  try {
    const complaint = await Complaint.findOne({
      _id: req.params.complaintId,
      societyId: req.societyId,
    });
    if (!complaint) return errorResponse(res, 404, "Complaint not found.");

    const serviceType = suggestServiceType(complaint.title, complaint.description);

    // Return matching providers OR all active providers if no keyword match
    const filter = { societyId: req.societyId, isActive: true };
    if (serviceType) filter.serviceType = serviceType;

    const providers = await ServiceProvider.find(filter)
      .select("name phone serviceType photo averageRating totalReviews description")
      .lean();

    return successResponse(res, 200, "Providers fetched.", { serviceType, providers });
  } catch (error) { next(error); }
};

module.exports = { createComplaint, getComplaints, getComplaint, updateComplaintStatus, deleteComplaint, getComplaintStats ,getSuggestedProviders};
