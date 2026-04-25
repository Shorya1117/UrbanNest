const { Category } = require("../models");
const { successResponse, errorResponse } = require("../utils/response");

// ─── Get Categories ───────────────────────────────────────────────────────────
const getCategories = async (req, res, next) => {
  try {
    const { type } = req.query;
    const filter = { societyId: req.societyId, isActive: true };
    if (type) filter.type = type;
    const categories = await Category.find(filter).sort({ name: 1 }).lean();
    return successResponse(res, 200, "Categories fetched.", { categories });
  } catch (error) {
    next(error);
  }
};

// ─── Create Category (Admin) ──────────────────────────────────────────────────
const createCategory = async (req, res, next) => {
  try {
    const { name, type } = req.body;
    if (!name || !type) return errorResponse(res, 400, "name and type are required.");
    if (!["MARKETPLACE", "SERVICE"].includes(type))
      return errorResponse(res, 400, "type must be MARKETPLACE or SERVICE.");

    const category = await Category.create({ name, type, societyId: req.societyId });
    return successResponse(res, 201, "Category created.", { category });
  } catch (error) {
    next(error);
  }
};

// ─── Update Category (Admin) ──────────────────────────────────────────────────
const updateCategory = async (req, res, next) => {
  try {
    const { name, isActive } = req.body;
    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, societyId: req.societyId },
      { name, isActive },
      { new: true, runValidators: true }
    );
    if (!category) return errorResponse(res, 404, "Category not found.");
    return successResponse(res, 200, "Category updated.", { category });
  } catch (error) {
    next(error);
  }
};

// ─── Delete Category (Admin) ──────────────────────────────────────────────────
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findOneAndDelete({ _id: req.params.id, societyId: req.societyId });
    if (!category) return errorResponse(res, 404, "Category not found.");
    return successResponse(res, 200, "Category deleted.");
  } catch (error) {
    next(error);
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
