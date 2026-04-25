const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    images: [
      {
        url: { type: String, required: true, trim: true },
        publicId: { type: String, required: true, trim: true }, // Cloudinary public_id for deletion
        altText: { type: String, trim: true, default: null },
        isPrimary: { type: Boolean, default: false },
      },
    ],
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Seller reference is required"],
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["AVAILABLE", "SOLD"],
      default: "AVAILABLE",
    },
    condition: {
      type: String,
      enum: ["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"],
      required: [true, "Item condition is required"],
    },
    negotiable: {
      type: Boolean,
      default: false,
    },
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Society",
      required: [true, "Society reference is required"],
    },
    soldAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

listingSchema.index({ societyId: 1, status: 1 });
listingSchema.index({ societyId: 1, sellerId: 1 });
listingSchema.index({ societyId: 1, categoryId: 1 });

module.exports = mongoose.model("Listing", listingSchema);
