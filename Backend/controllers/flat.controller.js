const { Flat, User } = require("../models");
const { successResponse, errorResponse } = require("../utils/response");

const getFlats = async (req, res, next) => {
  try {
    const flats = await Flat.find({ societyId: req.societyId })
      .populate("members", "name email role phone avatar")
      .sort({ blockNumber: 1, flatNumber: 1 })
      .lean();
    return successResponse(res, 200, "Flats fetched.", { flats });
  } catch (error) {
    next(error);
  }
};

const getFlat = async (req, res, next) => {
  try {
    const flat = await Flat.findOne({ _id: req.params.id, societyId: req.societyId })
      .populate("members", "name email role phone avatar parentId")
      .lean();
    if (!flat) return errorResponse(res, 404, "Flat not found.");
    return successResponse(res, 200, "Flat fetched.", { flat });
  } catch (error) {
    next(error);
  }
};

const createFlat = async (req, res, next) => {
  try {
    const { flatNumber, blockNumber, floor, ownershipType } = req.body;
    if (!flatNumber || !blockNumber || !ownershipType)
      return errorResponse(res, 400, "flatNumber, blockNumber, and ownershipType are required.");

    const flat = await Flat.create({
      flatNumber,
      blockNumber,
      floor,
      ownershipType,
      societyId: req.societyId,
    });
    return successResponse(res, 201, "Flat created.", { flat });
  } catch (error) {
    next(error);
  }
};

const updateFlat = async (req, res, next) => {
  try {
    const { flatNumber, blockNumber, floor, ownershipType, isOccupied } = req.body;
    const flat = await Flat.findOneAndUpdate(
      { _id: req.params.id, societyId: req.societyId },
      { flatNumber, blockNumber, floor, ownershipType, isOccupied },
      { new: true, runValidators: true }
    );
    if (!flat) return errorResponse(res, 404, "Flat not found.");
    return successResponse(res, 200, "Flat updated.", { flat });
  } catch (error) {
    next(error);
  }
};

const deleteFlat = async (req, res, next) => {
  try {
    const flat = await Flat.findOne({ _id: req.params.id, societyId: req.societyId });
    if (!flat) return errorResponse(res, 404, "Flat not found.");

    const residents = await User.countDocuments({ flatId: flat._id });
    if (residents > 0)
      return errorResponse(res, 409, "Cannot delete a flat with active residents.");

    await flat.deleteOne();
    return successResponse(res, 200, "Flat deleted.");
  } catch (error) {
    next(error);
  }
};

module.exports = { getFlats, getFlat, createFlat, updateFlat, deleteFlat };
