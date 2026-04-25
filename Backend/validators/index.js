const { body, validationResult } = require("express-validator");
const { errorResponse } = require("../utils/response");

// ─── Run validation results ───────────────────────────────────────────────────
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const first = errors.array()[0];
    return errorResponse(res, 400, first.msg);
  }
  next();
};

// ─── Rule sets ────────────────────────────────────────────────────────────────
const rules = {
  adminLogin: [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],

  sendOTP: [
    body("email").isEmail().withMessage("Valid email is required"),
  ],

  verifyOTP: [
    body("email").isEmail().withMessage("Valid email is required"),
    body("otp")
      .isLength({ min: 6, max: 6 })
      .withMessage("OTP must be exactly 6 digits"),
  ],

  changePassword: [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("New password must be at least 8 characters"),
  ],

  createSociety: [
    body("name").notEmpty().withMessage("Society name is required"),
    body("societyCode").notEmpty().withMessage("Society code is required"),
  ],

  assignAdmin: [
    body("adminEmail").isEmail().withMessage("Valid admin email is required"),
    body("adminName").notEmpty().withMessage("Admin name is required"),
    body("phone").notEmpty().withMessage("Phone is required"),
  ],

  addResident: [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("phone").notEmpty().withMessage("Phone is required"),
    body("role")
      .isIn(["HEAD", "MEMBER"])
      .withMessage("Role must be HEAD or MEMBER"),
  ],

  createFlat: [
    body("flatNumber").notEmpty().withMessage("Flat number is required"),
    body("blockNumber").notEmpty().withMessage("Block number is required"),
    body("ownershipType")
      .isIn(["OWNER", "TENANT"])
      .withMessage("Ownership type must be OWNER or TENANT"),
  ],

  createCategory: [
    body("name").notEmpty().withMessage("Category name is required"),
    body("type")
      .isIn(["MARKETPLACE", "SERVICE"])
      .withMessage("Type must be MARKETPLACE or SERVICE"),
  ],

  createListing: [
    body("title").notEmpty().withMessage("Title is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("price")
      .isFloat({ min: 0 })
      .withMessage("Price must be a non-negative number"),
    body("condition")
      .isIn(["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"])
      .withMessage("Invalid condition value"),
  ],

  createComplaint: [
    body("title").notEmpty().withMessage("Complaint title is required"),
    body("description").notEmpty().withMessage("Description is required"),
  ],

  updateComplaintStatus: [
    body("status")
      .isIn(["PENDING", "IN_PROGRESS", "RESOLVED"])
      .withMessage("Status must be PENDING, IN_PROGRESS, or RESOLVED"),
    body("assignedTo").optional().isMongoId().withMessage("Invalid assignedTo ID"),
  ],

  addService: [
    body("name").notEmpty().withMessage("Provider name is required"),
    body("serviceType").notEmpty().withMessage("Service type is required"),
    body("phone").notEmpty().withMessage("Phone is required"),
  ],

  addReview: [
    body("rating")
      .isInt({ min: 1, max: 5 })
      .withMessage("Rating must be between 1 and 5"),
    body("targetType")
      .isIn(["SERVICE", "LISTING", "SELLER"])
      .withMessage("Invalid target type"),
    body("serviceId").optional().isMongoId().withMessage("Invalid serviceId"),
    body("listingId").optional().isMongoId().withMessage("Invalid listingId"),
    body("sellerId").optional().isMongoId().withMessage("Invalid sellerId"),
  ],

  broadcastNotification: [
    body("message").notEmpty().withMessage("Message is required"),
    body("type")
      .optional()
      .isIn(["ANNOUNCEMENT", "COMPLAINT_UPDATE", "MARKETPLACE", "SERVICE", "GENERAL"])
      .withMessage("Invalid notification type"),
  ],

  createBooking: [
    body("serviceId").isMongoId().withMessage("Valid service ID is required"),
    body("date").notEmpty().withMessage("Booking date is required"),
    body("timeSlot")
      .isIn(["MORNING", "AFTERNOON", "EVENING"])
      .withMessage("Time slot must be MORNING, AFTERNOON, or EVENING"),
    body("notes").optional().isLength({ max: 500 }).withMessage("Notes cannot exceed 500 characters"),
  ],

  updateBookingStatus: [
    body("status")
      .isIn(["CONFIRMED", "COMPLETED", "CANCELLED"])
      .withMessage("Status must be CONFIRMED, COMPLETED, or CANCELLED"),
    body("adminNotes").optional().isLength({ max: 500 }).withMessage("Admin notes cannot exceed 500 characters"),
  ],
};

// ─── Build middleware arrays: [...rules, validate] ────────────────────────────
const v = {};
Object.keys(rules).forEach((key) => {
  v[key] = [...rules[key], validate];
});

module.exports = v;