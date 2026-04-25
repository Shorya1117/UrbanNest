const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;

    // Add retryWrites and w=majority if missing — required for Atlas SRV
    if (!uri.includes("retryWrites")) {
      const separator = uri.includes("?") ? "&" : "?";
      uri = `${uri}${separator}retryWrites=true&w=majority`;
    }

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
      family: 4,  // Force IPv4 — fixes ECONNREFUSED on Windows/nodemon
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;