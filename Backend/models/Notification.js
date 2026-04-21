const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: [300, "Message cannot exceed 300 characters"],
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

notificationSchema.index({ userId: 1, isRead: 1, societyId: 1 });
notificationSchema.index({ societyId: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
