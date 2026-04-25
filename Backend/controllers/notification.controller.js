const { Notification, User } = require("../models");
const { successResponse, errorResponse } = require("../utils/response");

// ─── Get My Notifications (resident/admin own) ────────────────────────────────
const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, isRead } = req.query;
    const filter = { userId: req.user._id, societyId: req.societyId };
    if (isRead !== undefined) filter.isRead = isRead === "true";

    const skip = (Number(page) - 1) * Number(limit);

    // Single aggregation instead of 3 queries
    const [notifications, [meta]] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Notification.aggregate([
        { $match: { userId: req.user._id, societyId: req.societyId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            unread: { $sum: { $cond: [{ $eq: ["$isRead", false] }, 1, 0] } },
          },
        },
      ]),
    ]);

    const total = meta?.total || 0;
    const unreadCount = meta?.unread || 0;

    return successResponse(res, 200, "Notifications fetched.", {
      notifications,
      unreadCount,
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

// ─── Get Society-wide Notification History (Admin only) ───────────────────────
const getNotificationHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const filter = { societyId: req.societyId };
    if (type) filter.type = type;

    const skip = (Number(page) - 1) * Number(limit);

    // Get one doc per broadcast (group by message + createdAt minute to deduplicate)
    // We fetch distinct broadcast records stored with sentBy field
    const [history, total] = await Promise.all([
      Notification.find({ ...filter, sentBy: { $ne: null } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("sentBy", "name role")
        .lean(),
      Notification.countDocuments({ ...filter, sentBy: { $ne: null } }),
    ]);

    // Deduplicate by grouping same-second broadcasts (broadcast sends N docs, show 1)
    const seen = new Set();
    const deduplicated = [];
    for (const n of history) {
      const key = `${n.message}:${n.sentBy?._id}:${Math.floor(new Date(n.createdAt).getTime() / 5000)}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(n);
      }
    }

    return successResponse(res, 200, "Notification history fetched.", {
      history: deduplicated,
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
    const { message, title, type = "ANNOUNCEMENT" } = req.body;
    if (!message) return errorResponse(res, 400, "message is required.");

    const residents = await User.find(
      { societyId: req.societyId, isApproved: true, isActive: true },
      "_id name"
    ).lean();

    if (residents.length === 0) {
      return errorResponse(res, 400, "No active residents found in this society.");
    }

    // Build notification docs with full history metadata
    const notifications = residents.map((r) => ({
      userId: r._id,
      title: title || "Society Announcement",
      message,
      type,
      societyId: req.societyId,
      senderRole: req.user.role,
      sentBy: req.user._id,
      recipientLabel: "All Residents",
      deliveryStatus: "DELIVERED",
    }));

    await Notification.insertMany(notifications, { ordered: false });

    return successResponse(res, 201, `✅ Announcement sent successfully to ${residents.length} residents.`, {
      sentCount: residents.length,
      title: title || "Society Announcement",
      message,
      type,
      sentAt: new Date(),
    });
  } catch (error) {
    next(error);
  }
};

// ─── Send Notification to Single User (Admin) ─────────────────────────────────
const sendToUser = async (req, res, next) => {
  try {
    const { userId, message, title, type = "GENERAL" } = req.body;
    if (!userId || !message) return errorResponse(res, 400, "userId and message are required.");

    const targetUser = await User.findOne({ _id: userId, societyId: req.societyId }).lean();
    if (!targetUser) return errorResponse(res, 404, "User not found.");

    const notification = await Notification.create({
      userId,
      title: title || "Notification",
      message,
      type,
      societyId: req.societyId,
      senderRole: req.user.role,
      sentBy: req.user._id,
      recipientLabel: targetUser.name,
      deliveryStatus: "DELIVERED",
    });

    return successResponse(res, 201, `✅ Notification sent to ${targetUser.name}.`, { notification });
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

module.exports = {
  getNotifications,
  getNotificationHistory,
  markAsRead,
  markAllAsRead,
  broadcastNotification,
  sendToUser,
  deleteNotification,
};
