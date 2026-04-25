const mongoose = require("mongoose");

const serviceProviderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Service provider name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    serviceType: {
      type: String,
      required: [true, "Service type is required"],
      trim: true,
      lowercase: true,
      maxlength: [60, "Service type cannot exceed 60 characters"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^\+?[0-9]{10,15}$/, "Please provide a valid phone number"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: null,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Society",
      required: [true, "Society reference is required"],
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    photo: {
      url: { type: String, trim: true, default: null },
      publicId: { type: String, trim: true, default: null }, // Cloudinary public_id for deletion
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

serviceProviderSchema.index({ societyId: 1, serviceType: 1 });
serviceProviderSchema.index({ societyId: 1, isActive: 1 });

module.exports = mongoose.model("ServiceProvider", serviceProviderSchema);
