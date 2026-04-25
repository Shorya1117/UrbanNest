// All Mongoose models are pre-built. Import from your models directory.
// Adjust this path to match where your model files actually live.
const SuperAdmin = require("./SuperAdmin");
const Society = require("./Society");
const User = require("./User");
const Flat = require("./Flat");
const Listing = require("./Listing");
const Complaint = require("./Complaint");
const ServiceProvider = require("./ServiceProvider");
const Review = require("./Review");
const Category = require("./Category");
const Notification = require("./Notification");
const OTP = require("./OTP");
const Booking = require("./Booking");

module.exports = {
  SuperAdmin,
  Society,
  User,
  Flat,
  Listing,
  Complaint,
  ServiceProvider,
  Review,
  Category,
  Notification,
  OTP,
  Booking,
};