const mongoose = require("mongoose");
const Listing = require("../models/listing");
const ExpressError = require("../utils/expressError");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../config/cloudinary");
const { geocodeLocation } = require("../utils/geocode");

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports.index = async (req, res) => {
  const { search, category } = req.query;
  const filter = {};

  if (category && category.trim() && category !== "All") {
    filter.category = category.trim();
  }

  if (search && search.trim()) {
    const regex = new RegExp(escapeRegex(search.trim()), "i");
    filter.$or = [
      { title: regex },
      { location: regex },
      { country: regex },
      { description: regex },
    ];
  }

  const listings = await Listing.find(filter)
    .populate("owner", "username")
    .sort({ createdAt: -1 });

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
    .populate("owner", "username email");

  if (!listing) {
    throw new ExpressError(404, "Listing you requested does not exist!");
  }

  res.json({ listing });
};

module.exports.createListing = async (req, res) => {
  if (!req.file) {
    throw new ExpressError(400, "Listing image is required.");
  }

  const image = await uploadToCloudinary(req.file.buffer);
  const geometry = await geocodeLocation(req.body.location, req.body.country);

  const newListing = new Listing({
    ...req.body,
    owner: req.user._id,
    image,
    geometry,
  });

  await newListing.save();
  await newListing.populate("owner", "username");

  res.status(201).json({
    message: "New Listing Created!",
    listing: newListing,
  });
};

module.exports.updateListing = async (req, res) => {
  const listing = req.listing;
  const locationChanged =
    req.body.location !== listing.location ||
    req.body.country !== listing.country;

  Object.assign(listing, req.body);

  if (locationChanged) {
    listing.geometry = await geocodeLocation(
      listing.location,
      listing.country
    );
  }

  if (req.file) {
    const oldFilename = listing.image?.filename;
    listing.image = await uploadToCloudinary(req.file.buffer);
    await deleteFromCloudinary(oldFilename);
  }

  await listing.save();
  await listing.populate("owner", "username");

  res.json({
    message: "Listing Updated!",
    listing,
  });
};

module.exports.destroyListing = async (req, res) => {
  const { id } = req.params;
  const deleted = await Listing.findByIdAndDelete(id);
  if (deleted?.image?.filename) {
    await deleteFromCloudinary(deleted.image.filename);
  }

  res.json({ message: "Listing Deleted!" });
};
