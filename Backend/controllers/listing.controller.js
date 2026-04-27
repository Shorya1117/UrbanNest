const { Listing, Category, Notification } = require("../models");
const { successResponse, errorResponse } = require("../utils/response");
const { deleteImage } = require("../config/cloudinary");

// ─── Get Listings ─────────────────────────────────────────────────────────────
const getListings = async (req, res, next) => {
  try {
    const societyId = req.societyId;
    const { status, categoryId, condition, page = 1, limit = 12, search } = req.query;

    const filter = { societyId };
    if (status) filter.status = status;
    else filter.status = "AVAILABLE"; // default to available only
    if (categoryId) filter.categoryId = categoryId;
    if (condition) filter.condition = condition;
    if (search) filter.title = { $regex: search, $options: "i" };

    const skip = (Number(page) - 1) * Number(limit);
    const [listings, total] = await Promise.all([
      Listing.find(filter)
        .populate("sellerId", "name avatar phone flatId")
        .populate("categoryId", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Listing.countDocuments(filter),
    ]);

    return successResponse(res, 200, "Listings fetched.", {
      listings,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Single Listing ───────────────────────────────────────────────────────
const getListing = async (req, res, next) => {
  try {
    const listing = await Listing.findOne({ _id: req.params.id, societyId: req.societyId })
      .populate("sellerId", "name avatar phone flatId")
      .populate("buyerId", "name")
      .populate("categoryId", "name")
      .lean();
    if (!listing) return errorResponse(res, 404, "Listing not found.");
    return successResponse(res, 200, "Listing fetched.", { listing });
  } catch (error) {
    next(error);
  }
};

// ─── Create Listing ───────────────────────────────────────────────────────────
const createListing = async (req, res, next) => {
  try {
    const { title, description, price, categoryId, condition, negotiable, sellerName, sellerPhone } = req.body;

    if (!title || !description || price === undefined || !categoryId || !condition)
      return errorResponse(res, 400, "title, description, price, categoryId, condition are required.");

    // Verify category belongs to this society and is MARKETPLACE type
    const category = await Category.findOne({
      _id: categoryId,
      societyId: req.societyId,
      type: "MARKETPLACE",
    });
    if (!category) return errorResponse(res, 404, "Category not found.");

    // Handle uploaded images
    const images = (req.files || []).map((file, idx) => ({
      url: file.path,
      publicId: file.filename,
      altText: `${title} image ${idx + 1}`,
      isPrimary: idx === 0,
    }));

    const listing = await Listing.create({
      title,
      description,
      price: Number(price),
      categoryId,
      condition,
      negotiable: negotiable === "true" || negotiable === true,
      images,
      sellerId: req.user._id,
      societyId: req.societyId,
      sellerContact: {
        name:  sellerName  || req.user.name  || null,
        phone: sellerPhone || req.user.phone || null,
      },
    });

    return successResponse(res, 201, "Listing created.", { listing });
  } catch (error) {
    next(error);
  }
};

// ─── Update Listing ───────────────────────────────────────────────────────────
const updateListing = async (req, res, next) => {
  try {
    const listing = await Listing.findOne({ _id: req.params.id, societyId: req.societyId });
    if (!listing) return errorResponse(res, 404, "Listing not found.");

    // Only seller or admin can update
    if (
      req.user.role !== "ADMIN" &&
      listing.sellerId.toString() !== req.user._id.toString()
    ) return errorResponse(res, 403, "Not authorized to update this listing.");

    if (listing.status === "SOLD")
      return errorResponse(res, 400, "Cannot update a sold listing.");

    const { title, description, price, categoryId, condition, negotiable } = req.body;
    if (title) listing.title = title;
    if (description) listing.description = description;
    if (price !== undefined) listing.price = Number(price);
    if (categoryId) listing.categoryId = categoryId;
    if (condition) listing.condition = condition;
    if (negotiable !== undefined) listing.negotiable = negotiable === "true" || negotiable === true;

    await listing.save();
    return successResponse(res, 200, "Listing updated.", { listing });
  } catch (error) {
    next(error);
  }
};

// ─── Mark as Sold ─────────────────────────────────────────────────────────────
const markAsSold = async (req, res, next) => {
  try {
    const listing = await Listing.findOne({ _id: req.params.id, societyId: req.societyId });
    if (!listing) return errorResponse(res, 404, "Listing not found.");

    if (listing.sellerId.toString() !== req.user._id.toString() && req.user.role !== "ADMIN")
      return errorResponse(res, 403, "Not authorized.");

    listing.status = "SOLD";
    listing.soldAt = new Date();
    if (req.body.buyerId) listing.buyerId = req.body.buyerId;
    await listing.save();

    // Notify seller
    await Notification.create({
      userId: listing.sellerId,
      message: `Your listing "${listing.title}" has been marked as sold.`,
      type: "MARKETPLACE",
      societyId: req.societyId,
      metadata: { listingId: listing._id },
    });

    return successResponse(res, 200, "Listing marked as sold.", { listing });
  } catch (error) {
    next(error);
  }
};

// ─── Delete Listing ───────────────────────────────────────────────────────────
const deleteListing = async (req, res, next) => {
  try {
    const listing = await Listing.findOne({ _id: req.params.id, societyId: req.societyId });
    if (!listing) return errorResponse(res, 404, "Listing not found.");

    if (listing.sellerId.toString() !== req.user._id.toString() && req.user.role !== "ADMIN")
      return errorResponse(res, 403, "Not authorized.");

    // Delete images from Cloudinary
    await Promise.all(listing.images.map((img) => deleteImage(img.publicId)));

    await listing.deleteOne();
    return successResponse(res, 200, "Listing deleted.");
  } catch (error) {
    next(error);
  }
};

// ─── Get My Listings ──────────────────────────────────────────────────────────
const getMyListings = async (req, res, next) => {
  try {
    const listings = await Listing.find({ sellerId: req.user._id, societyId: req.societyId })
      .populate("categoryId", "name")
      .sort({ createdAt: -1 })
      .lean();
    return successResponse(res, 200, "Your listings fetched.", { listings });
  } catch (error) {
    next(error);
  }
};

module.exports = { getListings, getListing, createListing, updateListing, markAsSold, deleteListing, getMyListings };