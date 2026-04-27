const express = require("express");
const router = express.Router();
const {
  createComplaint, getComplaints, getComplaint,
  updateComplaintStatus, deleteComplaint, getComplaintStats, getSuggestedProviders,
} = require("../controllers/complaint.controller");
const { protect, restrictTo, enforceSociety } = require("../middelware/auth.middleware");
const { uploadMiddleware } = require("../config/cloudinary");
const v = require("../validators");

router.use(protect, enforceSociety);

// ⚠️ Static routes MUST come before dynamic /:id routes
router.get("/stats", restrictTo("ADMIN"), getComplaintStats);
router.get("/", getComplaints);
router.post("/",
  (req, res, next) => uploadMiddleware("complaints", 3)(req, res, next),
  v.createComplaint,
  createComplaint
);

// /:id/providers must be ABOVE /:id — otherwise Express matches /:id first
router.get("/:complaintId/providers", getSuggestedProviders);
router.get("/:id", getComplaint);
router.patch("/:id/status", restrictTo("ADMIN"), v.updateComplaintStatus, updateComplaintStatus);
router.delete("/:id", deleteComplaint);

module.exports = router;