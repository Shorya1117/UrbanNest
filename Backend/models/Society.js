const mongoose = require("mongoose");

const societySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Society name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    address: {
      street: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      pincode: { type: String, required: true, trim: true },
      country: { type: String, default: "India", trim: true },
    },
    societyCode: {
      type: String,
      required: [true, "Society code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z0-9]{4,12}$/, "Society code must be 4-12 alphanumeric characters"],
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    settings: {
      allowMarketplace: { type: Boolean, default: true },
      allowComplaints: { type: Boolean, default: true },
      allowServiceDirectory: { type: Boolean, default: true },
      requireApprovalForResidents: { type: Boolean, default: true },
      maxFlatMembers: { type: Number, default: 10 },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// NOTE: societyCode already has unique:true which creates an index automatically

module.exports = mongoose.model("Society", societySchema);