const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadsRoot = path.join(__dirname, "..", "uploads");
const productUploadDirectory = path.join(uploadsRoot, "products");
const categoryUploadDirectory = path.join(uploadsRoot, "categories");
const bannerUploadDirectory = path.join(uploadsRoot, "banners");
const profileUploadDirectory = path.join(uploadsRoot, "profiles");

fs.mkdirSync(productUploadDirectory, { recursive: true });
fs.mkdirSync(categoryUploadDirectory, { recursive: true });
fs.mkdirSync(bannerUploadDirectory, { recursive: true });
fs.mkdirSync(profileUploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, productUploadDirectory);
  },
  filename(req, file, cb) {
    const extension = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9,
    )}${extension}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
  const extension = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(extension)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, JPEG, PNG, and WEBP files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = { upload };
