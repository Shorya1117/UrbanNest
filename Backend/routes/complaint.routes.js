const express = require("express");
const router = express.Router();
const {
  createComplaint, getComplaints, getComplaint,
  updateComplaintStatus, deleteComplaint, getComplaintStats,
} = require("../controllers/complaint.controller");
const { protect, restrictTo, enforceSociety } = require("../middelware/auth.middleware");
const { uploadMiddleware } = require("../config/cloudinary");
const v = require("../validators");

router.use(protect, enforceSociety);

router.get("/stats",  restrictTo("ADMIN"), getComplaintStats);
router.get("/",       getComplaints);
router.get("/:id",    getComplaint);
router.post("/",
  (req, res, next) => uploadMiddleware("complaints", 3)(req, res, next),
  v.createComplaint,
  createComplaint
);
router.patch("/:id/status", restrictTo("ADMIN"), v.updateComplaintStatus, updateComplaintStatus);
router.delete("/:id",       deleteComplaint);

module.exports = router;
