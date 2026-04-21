const express = require("express");
const router = express.Router();
const { addReview, getReviews, deleteReview } = require("../controllers/review.controller");
const { protect, enforceSociety } = require("../middelware/auth.middleware");
const v = require("../validators");

router.use(protect, enforceSociety);

router.post("/",    v.addReview, addReview);
router.get("/",     getReviews);
router.delete("/:id", deleteReview);

module.exports = router;
