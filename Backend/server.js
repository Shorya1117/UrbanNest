// ─── Load env FIRST — before any other require ───────────────────────────────
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

// Verify critical env vars loaded
if (!process.env.MONGO_URI) {
  console.error("❌ FATAL: MONGO_URI not found in .env");
  console.error("   Make sure .env file exists at:", path.join(__dirname, ".env"));
  process.exit(1);
}

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const { errorHandler, notFound } = require("./middelware/errorHandler");

// ─── Routes ───────────────────────────────────────────────────────────────────
const authRoutes         = require("./routes/auth.routes");
const societyRoutes      = require("./routes/society.routes");
const userRoutes         = require("./routes/user.routes");
const flatRoutes         = require("./routes/flat.routes");
const categoryRoutes     = require("./routes/category.routes");
const listingRoutes      = require("./routes/listing.routes");
const complaintRoutes    = require("./routes/complaint.routes");
const serviceRoutes      = require("./routes/service.routes");
const reviewRoutes       = require("./routes/review.routes");
const notificationRoutes = require("./routes/notification.routes");
const excelRoutes        = require("./routes/excel.routes");
const bookingRoutes      = require("./routes/booking.routes");
const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);
// ─── Connect DB then start server ─────────────────────────────────────────────

const app = express();
app.set("trust proxy", 1); 
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
}));

connectDB();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "development" ? 5000 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." },
  skip: (req) => req.path.includes("/notifications"), // skip polling route
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "development" ? 500 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many auth attempts, please try again later." },
});

app.use("/api", limiter);
app.use("/api/auth", authLimiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

app.get("/api/health", (_req, res) =>
  res.json({ success: true, message: "UrbanNest API running 🚀", env: process.env.NODE_ENV })
);

app.use("/api/auth",          authRoutes);
app.use("/api/societies",     societyRoutes);
app.use("/api/users",         userRoutes);
app.use("/api/flats",         flatRoutes);
app.use("/api/categories",    categoryRoutes);
app.use("/api/listings",      listingRoutes);
app.use("/api/complaints",    complaintRoutes);
app.use("/api/services",      serviceRoutes);
app.use("/api/reviews",       reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/excel",         excelRoutes);
app.use("/api/bookings",      bookingRoutes);
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);