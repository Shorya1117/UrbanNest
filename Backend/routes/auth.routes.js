const express = require("express");
const router = express.Router();
const {
  superAdminLogin,
  adminLogin,
  sendOTP,
  verifyOTP,
  changePassword,
  getMe,
} = require("../controllers/auth.controller");
const { protect } = require("../middelware/auth.middleware");
const v = require("../validators");

router.post("/superadmin/login", v.adminLogin, superAdminLogin);
router.post("/admin/login",      v.adminLogin, adminLogin);
router.post("/otp/send",         v.sendOTP,    sendOTP);
router.post("/otp/verify",       v.verifyOTP,  verifyOTP);
router.put("/change-password",   protect, v.changePassword, changePassword);
router.get("/me",                protect, getMe);

module.exports = router;
