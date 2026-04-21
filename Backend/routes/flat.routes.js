const express = require("express");
const router = express.Router();
const { getFlats, getFlat, createFlat, updateFlat, deleteFlat } = require("../controllers/flat.controller");
const { protect, restrictTo, enforceSociety } = require("../middelware/auth.middleware");
const v = require("../validators");

router.use(protect, enforceSociety);

router.get("/",    getFlats);
router.get("/:id", getFlat);
router.post("/",   restrictTo("ADMIN"), v.createFlat, createFlat);
router.put("/:id", restrictTo("ADMIN"), updateFlat);
router.delete("/:id", restrictTo("ADMIN"), deleteFlat);

module.exports = router;
