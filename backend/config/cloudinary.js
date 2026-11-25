const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const ExpressError = require("../utils/expressError");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new ExpressError(
          400,
          "Only PNG, JPG, JPEG, and WEBP images are allowed."
        )
      );
    }
  },
});

/**
 * Uploads an in-memory image buffer to Cloudinary and returns url + filename.
 */
function uploadToCloudinary(buffer, folder = "Livora_DEV") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          filename: result.public_id,
        });
      }
    );

    stream.end(buffer);
  });
}

/**
 * Deletes an uploaded asset from Cloudinary by public_id (skips seeded placeholders).
 */
async function deleteFromCloudinary(publicId) {
  if (!publicId || publicId === "listingimage") return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn(`Cloudinary cleanup failed for ${publicId}:`, err.message);
  }
}

module.exports = {
  cloudinary,
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
};
