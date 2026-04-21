const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      maxlength: [60, "Name cannot exceed 60 characters"],
    },
    type: {
      type: String,
      enum: ["MARKETPLACE", "SERVICE"],
      required: [true, "Category type is required"],
    },
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Society",
      required: [true, "Society reference is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Unique category name per type per society
categorySchema.index({ name: 1, type: 1, societyId: 1 }, { unique: true });
categorySchema.index({ societyId: 1, type: 1 });

module.exports = mongoose.model("Category", categorySchema);
