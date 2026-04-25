/**
 * MongoDB Connection Tester
 * Run: node scripts/testConnection.js
 * 
 * This will tell you EXACTLY what is wrong with your connection.
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const dns = require("dns");
const mongoose = require("mongoose");

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error("❌ MONGO_URI is not set in your .env file!");
  process.exit(1);
}

// Mask password for safe display
const safeUri = uri.replace(/:([^@]+)@/, ":****@");
console.log("\n🔍 Testing connection...");
console.log("   URI:", safeUri);
console.log("");

// Extract hostname from URI
let hostname;
try {
  // mongodb+srv://user:pass@cluster.mongodb.net/...
  hostname = uri.split("@")[1].split("/")[0];
  console.log("   Cluster hostname:", hostname);
} catch {
  console.error("❌ Could not parse hostname from URI. Check URI format.");
  process.exit(1);
}

// Step 1: DNS lookup
console.log("\n📡 Step 1: DNS SRV lookup for", `_mongodb._tcp.${hostname}`);
dns.resolveSrv(`_mongodb._tcp.${hostname}`, (err, addresses) => {
  if (err) {
    console.error("❌ DNS SRV lookup FAILED:", err.message);
    console.error("\n   This means one of:");
    console.error("   1. Your cluster hostname is wrong in MONGO_URI");
    console.error("   2. Your internet/DNS is blocking MongoDB SRV records");
    console.error("   3. The cluster doesn't exist or was paused");
    console.error("\n   ➡  Fix: Go to Atlas → Clusters → Connect → Copy the connection string fresh");
    
    // Try plain DNS as fallback info
    console.log("\n📡 Step 2: Trying plain DNS lookup...");
    dns.lookup(hostname, (err2, address) => {
      if (err2) {
        console.error("❌ Plain DNS also failed:", err2.message);
        console.error("\n   Your network may be blocking MongoDB entirely.");
        console.error("   Try: use a mobile hotspot or VPN and retry.");
      } else {
        console.log("✅ Plain DNS resolved to:", address);
        console.error("\n   SRV failed but hostname resolves — likely a firewall blocking SRV records.");
        console.error("   ➡  Try using a Standard connection string instead of SRV (+srv)");
        console.error("      In Atlas → Connect → choose 'Standard connection string'");
      }
      process.exit(1);
    });
    return;
  }
  
  console.log("✅ DNS SRV resolved:", JSON.stringify(addresses[0]));
  console.log("\n📡 Step 3: Attempting mongoose.connect()...");
  
  mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 })
    .then(() => {
      console.log("✅ MongoDB connected successfully!");
      console.log("   Host:", mongoose.connection.host);
      console.log("   DB:  ", mongoose.connection.name);
      console.log("\n🎉 Your connection is working. Run: npm run dev");
      process.exit(0);
    })
    .catch((err3) => {
      console.error("❌ mongoose.connect() failed:", err3.message);
      if (err3.message.includes("Authentication failed")) {
        console.error("\n   ➡  Your DB username or password is wrong in MONGO_URI");
        console.error("      Check: Atlas → Database Access → edit user → reset password");
      } else if (err3.message.includes("ECONNREFUSED")) {
        console.error("\n   ➡  Connection refused even after DNS worked.");
        console.error("      Try switching to mobile hotspot (ISP firewall issue).");
      } else if (err3.message.includes("timed out")) {
        console.error("\n   ➡  Timeout — Atlas cluster may be PAUSED.");
        console.error("      Check: Atlas → Clusters → look for 'Paused' status → Resume it.");
      }
      process.exit(1);
    });
});