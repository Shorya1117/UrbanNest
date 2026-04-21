const express = require("express");
const router = express.Router();
const {
  getServices, getService, addService, updateService, deleteService, getServiceTypes,
} = require("../controllers/service.controller");
const { protect, restrictTo, enforceSociety } = require("../middelware/auth.middleware");
const { uploadSingle } = require("../config/cloudinary");
const v = require("../validators");

router.use(protect, enforceSociety);

router.get("/types", getServiceTypes);
router.get("/",      getServices);
router.get("/:id",   getService);
router.post("/",
  restrictTo("ADMIN"),
  (req, res, next) => uploadSingle("services")(req, res, next),
  v.addService,
  addService
);
router.put("/:id",
  restrictTo("ADMIN"),
  (req, res, next) => uploadSingle("services")(req, res, next),
  updateService
);
router.delete("/:id", restrictTo("ADMIN"), deleteService);

module.exports = router;
