const express = require("express");
const router = express.Router();
const {
  getResidents, getResident, addResident, updateResident,
  removeResident, uploadAvatar, getPendingApprovals,
} = require("../controllers/user.controller");
const { protect, restrictTo, enforceSociety } = require("../middelware/auth.middleware");
const v = require("../validators");

router.use(protect, enforceSociety);

router.get("/",           restrictTo("ADMIN", "SUPER_ADMIN"), getResidents);
router.get("/pending",    restrictTo("ADMIN"), getPendingApprovals);
router.post("/",          restrictTo("ADMIN"), v.addResident, addResident);
router.get("/:id",        getResident);
router.put("/:id",        restrictTo("ADMIN"), updateResident);
router.delete("/:id",     restrictTo("ADMIN"), removeResident);
router.put("/:id/avatar", uploadAvatar);

module.exports = router;
