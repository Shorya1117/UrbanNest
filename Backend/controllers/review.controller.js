const { Review, ServiceProvider, Listing, User } = require("../models");
const { successResponse, errorResponse } = require("../utils/response");

// ─── Add Review ───────────────────────────────────────────────────────────────
const addReview = async (req, res, next) => {
  try {
    const { rating, comment, targetType, serviceId, listingId, sellerId } = req.body;

    if (!rating || !targetType)
      return errorResponse(res, 400, "rating and targetType are required.");
    if (!["SERVICE", "LISTING", "SELLER"].includes(targetType))
      return errorResponse(res, 400, "Invalid targetType.");

    // Validate target exists within society
    if (targetType === "SERVICE") {
      if (!serviceId) return errorResponse(res, 400, "serviceId is required for SERVICE reviews.");
      const service = await ServiceProvider.findOne({ _id: serviceId, societyId: req.societyId });
      if (!service) return errorResponse(res, 404, "Service not found.");
    } else if (targetType === "LISTING") {
      if (!listingId) return errorResponse(res, 400, "listingId is required for LISTING reviews.");
      const listing = await Listing.findOne({ _id: listingId, societyId: req.societyId });
      if (!listing) return errorResponse(res, 404, "Listing not found.");
    } else if (targetType === "SELLER") {
      if (!sellerId) return errorResponse(res, 400, "sellerId is required for SELLER reviews.");
      const seller = await User.findOne({ _id: sellerId, societyId: req.societyId });
      if (!seller) return errorResponse(res, 404, "Seller not found.");
      // Cannot review yourself
      if (sellerId === req.user._id.toString())
        return errorResponse(res, 400, "You cannot review yourself.");
    }

    const review = await Review.create({
      userId: req.user._id,
      rating: Number(rating),
      comment,
      targetType,
      serviceId: serviceId || null,
      listingId: listingId || null,
      sellerId: sellerId || null,
      societyId: req.societyId,
    });

    // Update cached rating on ServiceProvider
    if (targetType === "SERVICE" && serviceId) {
      const agg = await Review.aggregate([
        { $match: { serviceId: review.serviceId, targetType: "SERVICE" } },
        { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
      ]);
      if (agg.length > 0) {
        await ServiceProvider.findByIdAndUpdate(serviceId, {
          averageRating: Math.round(agg[0].avg * 10) / 10,
          totalReviews: agg[0].count,
        });
      }
    }

    await review.populate("userId", "name avatar");
    return successResponse(res, 201, "Review added.", { review });
  } catch (error) {
    next(error);
  }
};

// ─── Get Reviews by Target ────────────────────────────────────────────────────
const getReviews = async (req, res, next) => {
  try {
    const { targetType, serviceId, listingId, sellerId, page = 1, limit = 10 } = req.query;

    if (!targetType) return errorResponse(res, 400, "targetType is required.");

    const filter = { societyId: req.societyId, targetType };
    if (serviceId) filter.serviceId = serviceId;
    if (listingId) filter.listingId = listingId;
    if (sellerId) filter.sellerId = sellerId;

    const skip = (Number(page) - 1) * Number(limit);
    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate("userId", "name avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Review.countDocuments(filter),
    ]);

    // Compute average
    const agg = await Review.aggregate([
      { $match: filter },
      { $group: { _id: null, average: { $avg: "$rating" }, total: { $sum: 1 } } },
    ]);

    return successResponse(res, 200, "Reviews fetched.", {
      reviews,
      stats: agg[0] ? { average: Math.round(agg[0].average * 10) / 10, total: agg[0].total } : { average: 0, total: 0 },
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Delete Review (own review or ADMIN) ─────────────────────────────────────
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findOne({ _id: req.params.id, societyId: req.societyId });
    if (!review) return errorResponse(res, 404, "Review not found.");

    if (review.userId.toString() !== req.user._id.toString() && req.user.role !== "ADMIN")
      return errorResponse(res, 403, "Not authorized.");

    const { serviceId } = review;
    await review.deleteOne();

    // Recompute service rating
    if (serviceId) {
      const agg = await Review.aggregate([
        { $match: { serviceId, targetType: "SERVICE" } },
        { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
      ]);
      await ServiceProvider.findByIdAndUpdate(serviceId, {
        averageRating: agg[0] ? Math.round(agg[0].avg * 10) / 10 : 0,
        totalReviews: agg[0] ? agg[0].count : 0,
      });
    }

    return successResponse(res, 200, "Review deleted.");
  } catch (error) {
    next(error);
  }
};

module.exports = { addReview, getReviews, deleteReview };
