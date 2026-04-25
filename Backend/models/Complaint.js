const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    // ── New: Problem category (type of issue) ──────────────────────────────
    category: {
      type: String,
      enum: [
        "electricity",
        "water",
        "washroom",
        "garbage",
        "security",
        "maintenance",
        "garden",
        "parking",
        "internet",
        "other",
      ],
      default: "other",
    },
    // ── New: Priority / severity level ─────────────────────────────────────
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    // ── New: Flat number and block/tower of the reporter ───────────────────
    flatNo: {
      type: String,
      trim: true,
      default: null,
    },
    block: {
      type: String,
      trim: true,
      default: null,
    },
    images: [
      {
        url: { type: String, required: true, trim: true },
        publicId: { type: String, required: true, trim: true },
        altText: { type: String, trim: true, default: null },
      },
    ],
    status: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "RESOLVED"],
      default: "PENDING",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator reference is required"],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Society",
      required: [true, "Society reference is required"],
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolutionNote: {
      type: String,
      trim: true,
      maxlength: [500, "Resolution note cannot exceed 500 characters"],
      default: null,
    },
  },
  { timestamps: true }
);

complaintSchema.index({ societyId: 1, status: 1 });
complaintSchema.index({ societyId: 1, createdBy: 1 });
complaintSchema.index({ societyId: 1, category: 1 });   // new index for category filtering
complaintSchema.index({ societyId: 1, priority: 1 });   // new index for priority filtering

module.exports = mongoose.model("Complaint", complaintSchema);