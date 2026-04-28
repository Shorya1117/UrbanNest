const express = require("express");
const router = express.Router();
const {
  createBooking, getMyBookings, getAllBookings,
  updateBookingStatus, cancelBooking, getBookingStats,
} = require("../controllers/booking.controller");
const { protect, restrictTo, enforceSociety } = require("../middelware/auth.middleware");
const v = require("../validators");

router.use(protect, enforceSociety);

// User routes
router.post("/",      v.createBooking, createBooking);
router.get("/my",     getMyBookings);

// Admin routes  ← move stats UP before /:id
router.get("/stats",  restrictTo("ADMIN"), getBookingStats);
router.get("/",       restrictTo("ADMIN"), getAllBookings);
router.patch("/:id/status", restrictTo("ADMIN"), v.updateBookingStatus, updateBookingStatus);
router.delete("/:id", cancelBooking);

module.exports = router;