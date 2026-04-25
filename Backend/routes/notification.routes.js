const express = require("express");
const router = express.Router();
const {
  getNotifications,
  getNotificationHistory,
  markAsRead,
  markAllAsRead,
  broadcastNotification,
  sendToUser,
  deleteNotification,
} = require("../controllers/notification.controller");
const { protect, restrictTo, enforceSociety } = require("../middelware/auth.middleware");
const v = require("../validators");

router.use(protect, enforceSociety);

router.get("/",         getNotifications);
router.patch("/read-all", markAllAsRead);
router.patch("/:id/read", markAsRead);
router.delete("/:id",     deleteNotification);

// Admin-only routes
router.get("/history",      restrictTo("ADMIN", "SUPER_ADMIN"), getNotificationHistory);
router.post("/broadcast",   restrictTo("ADMIN", "SUPER_ADMIN"), v.broadcastNotification, broadcastNotification);
router.post("/send-to-user", restrictTo("ADMIN", "SUPER_ADMIN"), sendToUser);

module.exports = router;
