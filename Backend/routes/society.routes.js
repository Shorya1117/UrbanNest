const express = require("express");
const router = express.Router();
const {
  createSociety, getAllSocieties, getSociety, updateSociety, assignAdmin,
} = require("../controllers/society.controller");
const { protect, restrictTo } = require("../middelware/auth.middleware");
const v = require("../validators");

router.use(protect);

router.get("/",    restrictTo("SUPER_ADMIN"), getAllSocieties);
router.post("/",   restrictTo("SUPER_ADMIN"), v.createSociety, createSociety);
router.get("/:id", restrictTo("SUPER_ADMIN", "ADMIN"), getSociety);
router.put("/:id", restrictTo("SUPER_ADMIN"), updateSociety);
router.post("/:id/assign-admin", restrictTo("SUPER_ADMIN"), v.assignAdmin, assignAdmin);

module.exports = router;
