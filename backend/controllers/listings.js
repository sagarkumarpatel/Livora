const mongoose = require("mongoose");
const Listing = require("../models/listing");
const ExpressError = require("../utils/expressError");
const {
  uploadManyToCloudinary,
  deleteFromCloudinary,
} = require("../config/cloudinary");
const { geocodeLocation } = require("../utils/geocode");

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getUploadedFiles(req) {
  if (Array.isArray(req.files)) return req.files;
  const multi = req.files?.images || [];
  const single = req.files?.image || [];
  const fileSingle = req.file ? [req.file] : [];
  return [...multi, ...single, ...fileSingle];
}

/**
 * Formats a listing document for public/host responses without exposing private user secrets.
 */
function formatPublicListing(doc, { includeReviews = false, includeBlockedDates = false } = {}) {
  const plain = doc.toObject ? doc.toObject() : { ...doc };
  const images =
    Array.isArray(plain.images) && plain.images.length > 0
      ? plain.images
      : plain.image?.url
      ? [plain.image]
      : [];

  const populatedReviews = Array.isArray(plain.reviews) ? plain.reviews : [];
  const hasPopulatedRatings =
    populatedReviews.length > 0 && typeof populatedReviews[0] === "object";

  let reviewCount = plain.reviewCount ?? populatedReviews.length;
  let averageRating = plain.averageRating ?? 0;

  if (hasPopulatedRatings) {
    reviewCount = populatedReviews.length;
    const sum = populatedReviews.reduce(
      (acc, r) => acc + (Number(r.rating) || 0),
      0
    );
    averageRating =
      reviewCount > 0 ? Number((sum / reviewCount).toFixed(2)) : 0;
  }

  const publicOwner =
    plain.owner && typeof plain.owner === "object"
      ? {
          _id: plain.owner._id,
          username: plain.owner.username,
          joinedAt: plain.owner.createdAt || null,
        }
      : plain.owner || null;

  const formatted = {
    _id: plain._id,
    title: plain.title,
    description: plain.description,
    image: plain.image || images[0] || null,
    images,
    price: plain.price,
    cleaningFee: plain.cleaningFee ?? 0,
    location: plain.location,
    country: plain.country,
    category: plain.category || "Trending",
    propertyType: plain.propertyType || "Entire home",
    maxGuests: plain.maxGuests ?? 2,
    bedrooms: plain.bedrooms ?? 1,
    bathrooms: plain.bathrooms ?? 1,
    amenities: Array.isArray(plain.amenities) ? plain.amenities : [],
    status: plain.status || "published",
    averageRating,
    reviewCount,
    owner: publicOwner,
    geometry: plain.geometry,
    createdAt: plain.createdAt,
  };

  if (includeReviews) {
    formatted.reviews = populatedReviews;
  }

  if (includeBlockedDates) {
    formatted.blockedDates = Array.isArray(plain.blockedDates)
      ? plain.blockedDates
      : [];
  }

  return formatted;
}

module.exports.formatPublicListing = formatPublicListing;

module.exports.index = async (req, res) => {
  const { search, category } = req.query;
  const conditions = [
    { $or: [{ status: "published" }, { status: { $exists: false } }] },
  ];

  if (category && category.trim() && category !== "All") {
    conditions.push({ category: category.trim() });
  }

  if (search && search.trim()) {
    const regex = new RegExp(escapeRegex(search.trim()), "i");
    conditions.push({
      $or: [
        { title: regex },
        { location: regex },
        { country: regex },
        { description: regex },
      ],
    });
  }

  const filter = conditions.length === 1 ? conditions[0] : { $and: conditions };

  const docs = await Listing.find(filter)
    .populate("owner", "username createdAt")
    .populate("reviews", "rating")
    .sort({ createdAt: -1 });

  const listings = docs.map((doc) => formatPublicListing(doc));
  res.json({ listings });
};

module.exports.showListing = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new ExpressError(400, "Invalid listing ID.");
  }

  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: { path: "author", select: "username" },
      options: { sort: { createdAt: -1 } },
    })
    .populate("owner", "username createdAt");

  if (!listing) {
    throw new ExpressError(404, "Listing you requested does not exist!");
  }

  const listingStatus = listing.status || "published";
  const isOwnerViewer =
    req.user && listing.owner && listing.owner._id.equals(req.user._id);

  if (listingStatus !== "published" && !isOwnerViewer) {
    throw new ExpressError(404, "Listing you requested does not exist!");
  }

  res.json({
    listing: formatPublicListing(listing, {
      includeReviews: true,
      includeBlockedDates: Boolean(isOwnerViewer),
    }),
  });
};

module.exports.createListing = async (req, res) => {
  const files = getUploadedFiles(req);
  if (files.length === 0) {
    throw new ExpressError(400, "At least one listing image is required.");
  }

  const uploadedImages = await uploadManyToCloudinary(files);
  const geometry = await geocodeLocation(req.body.location, req.body.country);

  const { removedImageFilenames, ...listingFields } = req.body;

  const newListing = new Listing({
    ...listingFields,
    owner: req.user._id,
    image: uploadedImages[0],
    images: uploadedImages,
    geometry,
  });

  await newListing.save();
  await newListing.populate("owner", "username createdAt");

  res.status(201).json({
    message: "New Listing Created!",
    listing: formatPublicListing(newListing, { includeReviews: true }),
  });
};

module.exports.updateListing = async (req, res) => {
  const listing = req.listing;
  const { removedImageFilenames = [], ...listingFields } = req.body;

  const existingImages =
    Array.isArray(listing.images) && listing.images.length > 0
      ? listing.images.map((img) => ({ url: img.url, filename: img.filename || "" }))
      : listing.image?.url
      ? [{ url: listing.image.url, filename: listing.image.filename || "" }]
      : [];

  const removeSet = new Set(removedImageFilenames);
  const remainingImages = existingImages.filter(
    (img) => !removeSet.has(img.filename) && !removeSet.has(img.url)
  );
  const files = getUploadedFiles(req);

  if (remainingImages.length + files.length === 0) {
    throw new ExpressError(
      400,
      "Listing must keep at least one image."
    );
  }

  const newlyUploaded =
    files.length > 0 ? await uploadManyToCloudinary(files) : [];

  const locationChanged =
    listingFields.location !== listing.location ||
    listingFields.country !== listing.country;

  Object.assign(listing, listingFields);

  if (locationChanged) {
    listing.geometry = await geocodeLocation(
      listing.location,
      listing.country
    );
  }

  const finalImages = [...remainingImages, ...newlyUploaded];
  listing.images = finalImages;
  listing.image = finalImages[0];

  await listing.save();

  // Clean up removed Cloudinary assets after successful DB save
  const removedExisting = existingImages.filter(
    (img) => removeSet.has(img.filename) || removeSet.has(img.url)
  );
  await Promise.all(
    removedExisting.map((img) => deleteFromCloudinary(img.filename))
  );

  await listing.populate("owner", "username createdAt");

  res.json({
    message: "Listing Updated!",
    listing: formatPublicListing(listing, { includeReviews: true }),
  });
};

module.exports.destroyListing = async (req, res) => {
  const { id } = req.params;
  const deleted = await Listing.findByIdAndDelete(id);
  if (deleted) {
    const filenames = new Set();
    if (deleted.image?.filename) filenames.add(deleted.image.filename);
    if (Array.isArray(deleted.images)) {
      deleted.images.forEach((img) => {
        if (img?.filename) filenames.add(img.filename);
      });
    }
    await Promise.all([...filenames].map((f) => deleteFromCloudinary(f)));
  }

  res.json({ message: "Listing Deleted!" });
};
