const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
require("dotenv").config();

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "upload", // Optional: A folder to organize your images
    format: async (req, file) => "png", // Supports format, e.g., png, jpg
    public_id: (req, file) => `product-${Date.now()}`,
  },
});

// Create the upload middleware
const upload = multer({ storage: storage });

module.exports = upload;