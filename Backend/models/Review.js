const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, "Comment cannot exceed 500 characters"],
      default: null,
    },
    targetType: {
      type: String,
      enum: ["SERVICE", "LISTING", "SELLER"],
      required: [true, "Target type is required"],
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceProvider",
      default: null,
    },
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      default: null,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

// Prevent duplicate reviews per user per target
reviewSchema.index(
  { userId: 1, serviceId: 1, targetType: 1 },
  { unique: true, sparse: true }
);
reviewSchema.index(
  { userId: 1, listingId: 1, targetType: 1 },
  { unique: true, sparse: true }
);
reviewSchema.index(
  { userId: 1, sellerId: 1, targetType: 1 },
  { unique: true, sparse: true }
);
reviewSchema.index({ societyId: 1, targetType: 1 });

// Validate that exactly one target reference is provided
reviewSchema.pre("validate", function (next) {
  const targets = [this.serviceId, this.listingId, this.sellerId].filter(Boolean);
  if (targets.length !== 1) {
    return next(new Error("Exactly one of serviceId, listingId, or sellerId must be provided"));
  }

  const typeMap = {
    SERVICE: "serviceId",
    LISTING: "listingId",
    SELLER: "sellerId",
  };

  if (!this[typeMap[this.targetType]]) {
    return next(new Error(`targetType '${this.targetType}' requires a matching reference field`));
  }

  next();
});

module.exports = mongoose.model("Review", reviewSchema);
