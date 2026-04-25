/**
 * Creates a SuperAdmin account.
 * Run ONCE after setting up your .env:
 *
 *   node scripts/createSuperAdmin.js
 *
 * Then login at /admin/login with:
 *   Email:    superadmin@urbannest.com
 *   Password: SuperAdmin@123
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const SuperAdmin = require("../models/SuperAdmin");

const run = async () => {
  console.log("Connecting to:", process.env.MONGO_URI?.replace(/:([^@]+)@/, ":****@"));

  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB\n");

  const existing = await SuperAdmin.findOne({ email: "superadmin@urbannest.com" });
  if (existing) {
    console.log("⚠️  SuperAdmin already exists.");
    console.log("   Email:    superadmin@urbannest.com");
    console.log("   Use the /admin/login route to sign in.");
    process.exit(0);
  }

  await SuperAdmin.create({
    email: "superadmin@urbannest.com",
    password: "SuperAdmin@123",
    role: "SUPER_ADMIN",
  });

  console.log("🎉 SuperAdmin created successfully!\n");
  console.log("──────────────────────────────────────────");
  console.log("  Login URL : http://localhost:3000/admin/login");
  console.log("  Email     : superadmin@urbannest.com");
  console.log("  Password  : SuperAdmin@123");
  console.log("──────────────────────────────────────────\n");
  console.log("After login you will be redirected to /superadmin");
  console.log("From there you can create a Society and assign an Admin.\n");

  process.exit(0);
};

run().catch((err) => {
  console.error("❌ Error:", err.message);
  console.error("\nCommon causes:");
  console.error("  1. MONGO_URI in .env is wrong — check spelling and DB name");
  console.error("  2. IP not whitelisted in MongoDB Atlas Network Access");
  console.error("  3. Password has special chars — URL-encode them");
  process.exit(1);
});