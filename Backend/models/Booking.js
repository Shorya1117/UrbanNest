const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceProvider",
      required: [true, "Service provider reference is required"],
    },
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Society",
      required: [true, "Society reference is required"],
    },
    date: {
      type: Date,
      required: [true, "Booking date is required"],
    },
    timeSlot: {
      type: String,
      enum: ["MORNING", "AFTERNOON", "EVENING"],
      required: [true, "Time slot is required"],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
      default: null,
    },
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"],
      default: "PENDING",
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: [500, "Admin notes cannot exceed 500 characters"],
      default: null,
    },
  },
  { timestamps: true }
);

bookingSchema.index({ societyId: 1, status: 1 });
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ serviceId: 1, date: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
