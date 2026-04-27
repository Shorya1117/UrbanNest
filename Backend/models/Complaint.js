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
    images: [
      {
        url:       { type: String, required: true, trim: true },
        publicId:  { type: String, required: true, trim: true },
        altText:   { type: String, trim: true, default: null },
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
    // assignedTo is a ServiceProvider (plumber/electrician/etc.), NOT a User
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceProvider",
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

module.exports = mongoose.model("Complaint", complaintSchema);