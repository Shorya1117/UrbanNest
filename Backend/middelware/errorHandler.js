const { errorResponse } = require("../utils/response");

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || "Internal Server Error";

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `${field} already exists.`;
    statusCode = 409;
  }
  if (err.name === "ValidationError") {
    message = Object.values(err.errors).map((e) => e.message).join(", ");
    statusCode = 400;
  }
  if (err.name === "CastError")          { message = `Invalid ID format.`;               statusCode = 400; }
  if (err.name === "JsonWebTokenError")  { message = "Invalid token. Please log in.";    statusCode = 401; }
  if (err.name === "TokenExpiredError")  { message = "Session expired. Please log in.";  statusCode = 401; }

  if (process.env.NODE_ENV === "development" && statusCode >= 500) {
    console.error(`[ERROR] ${err.stack}`);
  }

  return errorResponse(res, statusCode, message);
};

const notFound = (req, res, next) => {
  // Silently ignore browser auto-requests
  const silentPaths = ["/favicon.ico", "/favicon.png", "/robots.txt", "/apple-touch-icon.png"];
  if (silentPaths.includes(req.path)) return res.status(204).end();

  const err = new Error(`Route not found: ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
};

module.exports = { errorHandler, notFound };