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
router.post("/",     createBooking,  createBooking);
router.get("/my",    getMyBookings);
router.delete("/:id", cancelBooking);

// Admin routes
router.get("/",      restrictTo("ADMIN"), getAllBookings);
router.get("/stats", restrictTo("ADMIN"), getBookingStats);
router.patch("/:id/status", restrictTo("ADMIN"), v.updateBookingStatus, updateBookingStatus);

module.exports = router;