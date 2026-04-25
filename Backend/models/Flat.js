const mongoose = require("mongoose");

const flatSchema = new mongoose.Schema(
  {
    flatNumber: {
      type: String,
      required: [true, "Flat number is required"],
      trim: true,
      uppercase: true,
    },
    blockNumber: {
      type: String,
      required: [true, "Block/Tower identifier is required"],
      trim: true,
      uppercase: true,
    },
    floor: {
      type: Number,
      default: null,
    },
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Society",
      required: [true, "Society reference is required"],
    },
    ownershipType: {
      type: String,
      enum: ["OWNER", "TENANT"],
      required: [true, "Ownership type is required"],
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isOccupied: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Unique flat per block per society
flatSchema.index({ flatNumber: 1, blockNumber: 1, societyId: 1 }, { unique: true });
flatSchema.index({ societyId: 1 });

module.exports = mongoose.model("Flat", flatSchema);
