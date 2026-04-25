const { ServiceProvider, Category } = require("../models");
const { successResponse, errorResponse } = require("../utils/response");
const { deleteImage } = require("../config/cloudinary");

// ─── Get All Services ─────────────────────────────────────────────────────────
const getServices = async (req, res, next) => {
  try {
    const { categoryId, serviceType, page = 1, limit = 12, search } = req.query;
    const filter = { societyId: req.societyId, isActive: true };
    if (categoryId) filter.categoryId = categoryId;
    if (serviceType) filter.serviceType = serviceType.toLowerCase();
    if (search) filter.name = { $regex: search, $options: "i" };

    const skip = (Number(page) - 1) * Number(limit);
    const [services, total] = await Promise.all([
      ServiceProvider.find(filter)
        .populate("categoryId", "name")
        .populate("addedBy", "name")
        .sort({ name: 1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      ServiceProvider.countDocuments(filter),
    ]);

    return successResponse(res, 200, "Services fetched.", {
      services,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Single Service ───────────────────────────────────────────────────────
const getService = async (req, res, next) => {
  try {
    const service = await ServiceProvider.findOne({ _id: req.params.id, societyId: req.societyId })
      .populate("categoryId", "name")
      .populate("addedBy", "name email")
      .lean();
    if (!service) return errorResponse(res, 404, "Service not found.");
    return successResponse(res, 200, "Service fetched.", { service });
  } catch (error) {
    next(error);
  }
};

// ─── Add Service (Admin only) ─────────────────────────────────────────────────
const addService = async (req, res, next) => {
  try {
    const { name, serviceType, phone, description, categoryId } = req.body;
    if (!name || !serviceType || !phone)
      return errorResponse(res, 400, "name, serviceType, and phone are required.");

    if (categoryId) {
      const cat = await Category.findOne({ _id: categoryId, societyId: req.societyId, type: "SERVICE" });
      if (!cat) return errorResponse(res, 404, "Category not found.");
    }

    const photo =
      req.file
        ? { url: req.file.path, publicId: req.file.filename }
        : { url: null, publicId: null };

    const service = await ServiceProvider.create({
      name,
      serviceType: serviceType.toLowerCase(),
      phone,
      description,
      categoryId: categoryId || null,
      photo,
      addedBy: req.user._id,
      societyId: req.societyId,
    });

    return successResponse(res, 201, "Service provider added.", { service });
  } catch (error) {
    next(error);
  }
};

// ─── Update Service (Admin only) ──────────────────────────────────────────────
const updateService = async (req, res, next) => {
  try {
    const service = await ServiceProvider.findOne({ _id: req.params.id, societyId: req.societyId });
    if (!service) return errorResponse(res, 404, "Service not found.");

    const { name, serviceType, phone, description, categoryId, isActive } = req.body;
    if (name) service.name = name;
    if (serviceType) service.serviceType = serviceType.toLowerCase();
    if (phone) service.phone = phone;
    if (description !== undefined) service.description = description;
    if (categoryId) service.categoryId = categoryId;
    if (isActive !== undefined) service.isActive = isActive;

    if (req.file) {
      if (service.photo?.publicId) await deleteImage(service.photo.publicId);
      service.photo = { url: req.file.path, publicId: req.file.filename };
    }

    await service.save();
    return successResponse(res, 200, "Service updated.", { service });
  } catch (error) {
    next(error);
  }
};

// ─── Delete Service (Admin only) ──────────────────────────────────────────────
const deleteService = async (req, res, next) => {
  try {
    const service = await ServiceProvider.findOne({ _id: req.params.id, societyId: req.societyId });
    if (!service) return errorResponse(res, 404, "Service not found.");

    if (service.photo?.publicId) await deleteImage(service.photo.publicId);
    await service.deleteOne();

    return successResponse(res, 200, "Service deleted.");
  } catch (error) {
    next(error);
  }
};

// ─── Get all service types in this society ────────────────────────────────────
const getServiceTypes = async (req, res, next) => {
  try {
    const types = await ServiceProvider.distinct("serviceType", { societyId: req.societyId, isActive: true });
    return successResponse(res, 200, "Service types fetched.", { types });
  } catch (error) {
    next(error);
  }
};

module.exports = { getServices, getService, addService, updateService, deleteService, getServiceTypes };
