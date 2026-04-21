const { Notification } = require("../models");
const { successResponse, errorResponse } = require("../utils/response");

// ─── Get My Notifications ─────────────────────────────────────────────────────
const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, isRead } = req.query;
    const filter = { userId: req.user._id, societyId: req.societyId };
    if (isRead !== undefined) filter.isRead = isRead === "true";

    const skip = (Number(page) - 1) * Number(limit);
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ userId: req.user._id, societyId: req.societyId, isRead: false }),
    ]);

    return successResponse(res, 200, "Notifications fetched.", {
      notifications,
      unreadCount,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Mark Single as Read ──────────────────────────────────────────────────────
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, societyId: req.societyId },
      { isRead: true },
      { new: true }
    );
    if (!notification) return errorResponse(res, 404, "Notification not found.");
    return successResponse(res, 200, "Marked as read.", { notification });
  } catch (error) {
    next(error);
  }
};

// ─── Mark All as Read ─────────────────────────────────────────────────────────
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, societyId: req.societyId, isRead: false },
      { isRead: true }
    );
    return successResponse(res, 200, "All notifications marked as read.");
  } catch (error) {
    next(error);
  }
};

// ─── Broadcast Notification (Admin → all residents) ──────────────────────────
const broadcastNotification = async (req, res, next) => {
  try {
    const { message, type = "ANNOUNCEMENT" } = req.body;
    if (!message) return errorResponse(res, 400, "message is required.");

    const { User } = require("../models");
    const residents = await User.find(
      { societyId: req.societyId, isApproved: true, isActive: true },
      "_id"
    ).lean();

    const notifications = residents.map((r) => ({
      userId: r._id,
      message,
      type,
      societyId: req.societyId,
    }));

    await Notification.insertMany(notifications);
    return successResponse(res, 201, `Announcement sent to ${residents.length} residents.`);
  } catch (error) {
    next(error);
  }
};

// ─── Delete Notification ──────────────────────────────────────────────────────
const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
      societyId: req.societyId,
    });
    if (!notification) return errorResponse(res, 404, "Notification not found.");
    return successResponse(res, 200, "Notification deleted.");
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead, broadcastNotification, deleteNotification };
