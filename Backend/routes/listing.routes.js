const express = require("express");
const router = express.Router();
const {
  getListings, getListing, createListing, updateListing,
  markAsSold, deleteListing, getMyListings,
} = require("../controllers/listing.controller");  // ✅ listing controller
const { protect, restrictTo, enforceSociety } = require("../middelware/auth.middleware");
const { uploadMiddleware } = require("../config/cloudinary");
const v = require("../validators");

router.use(protect, enforceSociety);

router.get("/my", getMyListings);
router.get("/", getListings);
router.post(
  "/",
  (req, res, next) => uploadMiddleware("listings", 5)(req, res, next),
  createListing
);

router.get("/:id", getListing);
router.patch("/:id/sold", markAsSold);  // ✅ specific route FIRST
router.patch("/:id", updateListing);    // ✅ generic route AFTER
router.delete("/:id", deleteListing);

module.exports = router;