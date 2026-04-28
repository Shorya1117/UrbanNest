require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const User = require("../models/User");
const Society = require("../models/Society");

const run = async () => {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB\n");

  const email = "priyanshuks2003@gmail.com";

  // 1. Ensure a society exists
  let society = await Society.findOne();
  if (!society) {
    console.log("No society found. Creating a default society...");
    society = await Society.create({
      name: "UrbanNest Premium Society",
      societyCode: "UN001",
      address: {
        street: "Main Street",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        country: "India",
      },
    });
    console.log("✅ Society created:", society.name);
  } else {
    console.log("Using existing society:", society.name);
  }

  // 2. Check if user already exists
  let user = await User.findOne({ email });
  if (user) {
    console.log("User already exists. Updating role to ADMIN and ensuring active...");
    user.role = "ADMIN";
    user.isApproved = true;
    user.isActive = true;
    user.societyId = society._id;
    await user.save();
    console.log("✅ User updated successfully!");
  } else {
    console.log("Creating new ADMIN user...");
    user = await User.create({
      name: "Priyanshu",
      email: email,
      role: "ADMIN",
      societyId: society._id,
      isApproved: true,
      isActive: true,
      phone: "1234567890"
    });
    console.log("✅ New ADMIN user created successfully!");
  }

  console.log("\n──────────────────────────────────────────");
  console.log("  Email     :", email);
  console.log("  Role      : ADMIN");
  console.log("  Society   :", society.name);
  console.log("  Status    : Ready for OTP login");
  console.log("──────────────────────────────────────────\n");

  process.exit(0);
};

run().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
