const express = require("express");
const router = express.Router();
const multer = require("multer");
const { previewExcel, importExcel, downloadTemplate } = require("../controllers/excel.controller");
const { protect, restrictTo, enforceSociety } = require("../middelware/auth.middleware");

// Use memory storage (no disk, process buffer directly)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only .xlsx or .xls files are allowed"), false);
    }
  },
});

router.use(protect, restrictTo("ADMIN"), enforceSociety);

router.get("/template", downloadTemplate);
router.post("/preview", upload.single("file"), previewExcel);
router.post("/import",  upload.single("file"), importExcel);

module.exports = router;