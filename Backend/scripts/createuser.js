require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const User = require("../models/User");
const Society = require("../models/Society");
const Flat = require("../models/Flat");

const run = async () => {
  console.log("Connecting to:", process.env.MONGO_URI?.replace(/:([^@]+)@/, ":****@"));
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB\n");

  // ── Step 1: Create Society ─────────────────────────────────────────────────
  let society = await Society.findOne({ societyCode: "TESTSOC1" });
  if (!society) {
    society = await Society.create({
      name: "Test Society",
      societyCode: "TESTSOC1",
      address: {
        street: "123 Test Street",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        country: "India",
      },
    });
    console.log("✅ Society created:", society._id);
  } else {
    console.log("⚠️  Society already exists:", society._id);
  }

  // ── Step 2: Create Flat ────────────────────────────────────────────────────
  let flat = await Flat.findOne({ societyId: society._id, flatNumber: "A101", blockNumber: "A" });
  if (!flat) {
    flat = await Flat.create({
      flatNumber: "A101",
      blockNumber: "A",
      floor: 1,
      societyId: society._id,
      ownershipType: "OWNER",
      isOccupied: true,
    });
    console.log("✅ Flat created:", flat._id);
  } else {
    console.log("⚠️  Flat already exists:", flat._id);
  }

  // ── Step 3: Create User ────────────────────────────────────────────────────
  const existing = await User.findOne({
    email: "khandelwalriddhi522@gmail.com",
    societyId: society._id,
  });
  if (existing) {
    console.log("\n⚠️  User already exists.");
    console.log("   Email:", existing.email);
    console.log("   Role:", existing.role);
    console.log("   Use /login to sign in via OTP.");
    process.exit(0);
  }

const UserModel = mongoose.model("User");
  await UserModel.collection.insertOne({
    name: "Riddhi",
    email: "khandelwalriddhi522@gmail.com",
    phone: "9999999999",
    role: "HEAD",
    societyId: society._id,
    flatId: flat._id,
    isApproved: true,
    isActive: true,
    mustChangePassword: false,
    lastLogin: null,
    avatar: { url: null, publicId: null },
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log("\n🎉 Test User created successfully!\n");
  console.log("──────────────────────────────────────────");
  console.log("  Login URL : http://localhost:3000/login");
  console.log("  Email     : khandelwalriddhi522@gmail.com");
  console.log("  Auth      : OTP (check your Gmail)");
  console.log("  Role      : HEAD");
  console.log("  Flat      : A101, Block A");
  console.log("  Society   : Test Society (TESTSOC1)");
  console.log("──────────────────────────────────────────\n");

  process.exit(0);
};

run().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});