const express = require("express");
const router = express.Router();
const { getCategories, createCategory, updateCategory, deleteCategory } = require("../controllers/category.controller");
const { protect, restrictTo, enforceSociety } = require("../middelware/auth.middleware");
const v = require("../validators");

router.use(protect, enforceSociety);

router.get("/",    getCategories);
router.post("/",   restrictTo("ADMIN"), v.createCategory, createCategory);
router.put("/:id", restrictTo("ADMIN"), updateCategory);
router.delete("/:id", restrictTo("ADMIN"), deleteCategory);

module.exports = router;
