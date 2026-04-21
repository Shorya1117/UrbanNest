const express = require("express");
const router = express.Router();
const {
  getNotifications, markAsRead, markAllAsRead, broadcastNotification, deleteNotification,
} = require("../controllers/notification.controller");
const { protect, restrictTo, enforceSociety } = require("../middelware/auth.middleware");
const v = require("../validators");

router.use(protect, enforceSociety);

router.get("/",            getNotifications);
router.patch("/read-all",  markAllAsRead);
router.patch("/:id/read",  markAsRead);
router.delete("/:id",      deleteNotification);
router.post("/broadcast",  restrictTo("ADMIN"), v.broadcastNotification, broadcastNotification);

module.exports = router;
