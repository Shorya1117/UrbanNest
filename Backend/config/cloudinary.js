const cloudinary = require("cloudinary").v2;
const multer = require("multer");

// ─── Configure Cloudinary ─────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Safe import of CloudinaryStorage (handles v3 and v4 export styles) ───────
let CloudinaryStorage;
try {
  const pkg = require("multer-storage-cloudinary");
  // v4: exports { CloudinaryStorage }
  // v3: exports CloudinaryStorage directly
  CloudinaryStorage = pkg.CloudinaryStorage || pkg;
} catch (err) {
  console.error("❌ multer-storage-cloudinary not installed:", err.message);
  console.error("   Run: npm install multer-storage-cloudinary@4.0.0");
  process.exit(1);
}

// ─── Storage factory ──────────────────────────────────────────────────────────
const createStorage = (folder) => {
  try {
    return new CloudinaryStorage({
      cloudinary,
      params: {
        folder:          `urbannest/${folder}`,
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation:  [{ width: 1200, height: 1200, crop: "limit", quality: "auto" }],
      },
    });
  } catch (err) {
    console.error("❌ CloudinaryStorage init failed:", err.message);
    // Fallback to memory storage so app doesn't crash
    return multer.memoryStorage();
  }
};

// ─── Multiple images (listings, complaints) ───────────────────────────────────
const uploadMiddleware = (folder, maxCount = 5) =>
  multer({
    storage: createStorage(folder),
    limits:  { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(new Error("Only image files are allowed"), false);
      }
    },
  }).array("images", maxCount);

// ─── Single image (avatar, service photo) ────────────────────────────────────
const uploadSingle = (folder) =>
  multer({
    storage: createStorage(folder),
    limits:  { fileSize: 2 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(new Error("Only image files are allowed"), false);
      }
    },
  }).single("image");

// ─── Delete image from Cloudinary ────────────────────────────────────────────
const deleteImage = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Cloudinary delete error:", err.message);
  }
};

module.exports = { cloudinary, uploadMiddleware, uploadSingle, deleteImage };