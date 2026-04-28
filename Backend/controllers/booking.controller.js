const { Booking, ServiceProvider } = require("../models");
const { successResponse, errorResponse } = require("../utils/response");

// ─── Create Booking (User) ───────────────────────────────────────────────────
const createBooking = async (req, res, next) => {
  try {
    const { serviceId, date, timeSlot, notes } = req.body;

    if (!serviceId || !date || !timeSlot)
      return errorResponse(res, 400, "serviceId, date, and timeSlot are required.");

    // Validate service exists in user's society
    const service = await ServiceProvider.findOne({
      _id: serviceId,
      societyId: req.societyId,
      isActive: true,
    });
    if (!service) return errorResponse(res, 404, "Service provider not found.");

    // Prevent booking in the past
    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (bookingDate < today)
      return errorResponse(res, 400, "Cannot book for a past date.");

    // Check for duplicate booking (same user, same service, same date+slot)
    const existing = await Booking.findOne({
      userId: req.user._id,
      serviceId,
      date: bookingDate,
      timeSlot,
      status: { $in: ["PENDING", "CONFIRMED"] },
    });
    if (existing)
      return errorResponse(res, 409, "You already have a booking for this service at the same date and time slot.");

    const booking = await Booking.create({
      userId: req.user._id,
      serviceId,
      societyId: req.societyId,
      date: bookingDate,
      timeSlot,
      notes: notes || null,
    });

    await booking.populate("serviceId", "name serviceType phone photo");
    return successResponse(res, 201, "Booking created successfully.", { booking });
  } catch (error) {
    next(error);
  }
};

// ─── Get My Bookings (User) ──────────────────────────────────────────────────
const getMyBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { userId: req.user._id, societyId: req.societyId };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate("serviceId", "name serviceType phone photo averageRating")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Booking.countDocuments(filter),
    ]);

    return successResponse(res, 200, "Bookings fetched.", {
      bookings,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get All Bookings (Admin) ─────────────────────────────────────────────────
const getAllBookings = async (req, res, next) => {
  try {
    const { status, serviceId, page = 1, limit = 20 } = req.query;
    const filter = { societyId: req.societyId };
    if (status) filter.status = status;
    if (serviceId) filter.serviceId = serviceId;

    const skip = (Number(page) - 1) * Number(limit);
    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate("serviceId", "name serviceType phone photo")
        .populate("userId", "name email phone flatId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Booking.countDocuments(filter),
    ]);

    return successResponse(res, 200, "All bookings fetched.", {
      bookings,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Update Booking Status (Admin) ────────────────────────────────────────────
const updateBookingStatus = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;
    if (!status)
      return errorResponse(res, 400, "Status is required.");

    const booking = await Booking.findOne({ _id: req.params.id, societyId: req.societyId });
    if (!booking) return errorResponse(res, 404, "Booking not found.");

    // Validate status transitions
    const validTransitions = {
      PENDING: ["CONFIRMED", "CANCELLED"],
      CONFIRMED: ["COMPLETED", "CANCELLED"],
    };
    const allowed = validTransitions[booking.status];
    if (!allowed || !allowed.includes(status))
      return errorResponse(res, 400, `Cannot change status from ${booking.status} to ${status}.`);

    booking.status = status;
    if (adminNotes !== undefined) booking.adminNotes = adminNotes;
    await booking.save();

    await booking.populate("serviceId", "name serviceType phone photo");
    await booking.populate("userId", "name email phone");
    return successResponse(res, 200, "Booking status updated.", { booking });
  } catch (error) {
    next(error);
  }
};

// ─── Cancel Booking (User — own only) ─────────────────────────────────────────
const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      societyId: req.societyId,
    });
    if (!booking) return errorResponse(res, 404, "Booking not found.");

    // Users can only cancel their own bookings
    if (req.user.role !== "ADMIN" && booking.userId.toString() !== req.user._id.toString())
      return errorResponse(res, 403, "Not authorized.");

    if (["COMPLETED", "CANCELLED"].includes(booking.status))
      return errorResponse(res, 400, `Cannot cancel a ${booking.status.toLowerCase()} booking.`);

    booking.status = "CANCELLED";
    await booking.save();

    return successResponse(res, 200, "Booking cancelled.");
  } catch (error) {
    next(error);
  }
};

// ─── Get Booking Stats (Admin) ────────────────────────────────────────────────
const getBookingStats = async (req, res, next) => {
  try {
    const stats = await Booking.aggregate([
      { $match: { societyId: req.societyId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const result = { PENDING: 0, CONFIRMED: 0, COMPLETED: 0, CANCELLED: 0, total: 0 };
    stats.forEach((s) => {
      result[s._id] = s.count;
      result.total += s.count;
    });

    return successResponse(res, 200, "Booking stats fetched.", { stats: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { createBooking, getMyBookings, getAllBookings, updateBookingStatus, cancelBooking, getBookingStats };