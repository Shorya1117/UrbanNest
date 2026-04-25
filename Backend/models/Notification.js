const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    title: {
      type: String,
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
      default: null,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: [500, "Message cannot exceed 500 characters"],
    },
    type: {
      type: String,
      enum: [
        "COMPLAINT_UPDATE",
        "MARKETPLACE",
        "SERVICE",
        "APPROVAL",
        "GENERAL",
        "ANNOUNCEMENT",
      ],
      required: [true, "Notification type is required"],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    // ── History tracking fields ────────────────────────────────────────────
    senderRole: {
      type: String,
      enum: ["ADMIN", "SUPER_ADMIN", "USER", "SYSTEM"],
      default: "SYSTEM",
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    recipientLabel: {
      type: String,
      default: null,
    },
    deliveryStatus: {
      type: String,
      enum: ["SENT", "DELIVERED", "FAILED"],
      default: "DELIVERED",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Society",
      required: [true, "Society reference is required"],
    },
  },
  { timestamps: true }
);

// Optimized compound indexes for fast queries
notificationSchema.index({ userId: 1, isRead: 1, societyId: 1 });
notificationSchema.index({ societyId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, societyId: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
