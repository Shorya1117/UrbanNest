const express = require("express");
const router = express.Router();
const {
  getListings, getListing, createListing, updateListing,
  markAsSold, deleteListing, getMyListings,
} = require("../controllers/listing.controller");
const { protect, enforceSociety } = require("../middelware/auth.middleware");
const { uploadMiddleware } = require("../config/cloudinary");
const v = require("../validators");

router.use(protect, enforceSociety);

router.get("/",    getListings);
router.get("/my",  getMyListings);
router.get("/:id", getListing);
router.post("/",
  (req, res, next) => uploadMiddleware("listings", 5)(req, res, next),
  v.createListing,
  createListing
);
router.put("/:id",        updateListing);
router.patch("/:id/sold", markAsSold);
router.delete("/:id",     deleteListing);

module.exports = router;
