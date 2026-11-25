const mongoose = require("mongoose");
const Listing = require("../models/listing");
const Review = require("../models/review");
const ExpressError = require("../utils/expressError");

async function recalculateListingStats(listingId) {
  const listing = await Listing.findById(listingId).populate(
    "reviews",
    "rating"
  );
  if (!listing) return { averageRating: 0, reviewCount: 0 };

  const reviewCount = listing.reviews.length;
  const total = listing.reviews.reduce(
    (sum, r) => sum + (Number(r.rating) || 0),
    0
  );
  const averageRating =
    reviewCount > 0 ? Number((total / reviewCount).toFixed(2)) : 0;

  listing.reviewCount = reviewCount;
  listing.averageRating = averageRating;
  await listing.save();

  return { averageRating, reviewCount };
}

module.exports.createReview = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new ExpressError(400, "Invalid listing ID.");
  }

  const listing = await Listing.findById(id);
  if (!listing) {
    throw new ExpressError(404, "Listing not found.");
  }

  const newReview = new Review({
    ...req.body,
    author: req.user._id,
  });

  listing.reviews.push(newReview._id);

  await newReview.save();
  await listing.save();
  await newReview.populate("author", "username");

  const stats = await recalculateListingStats(listing._id);

  res.status(201).json({
    message: "New Review Created!",
    review: newReview,
    ...stats,
  });
};

module.exports.destroyReview = async (req, res) => {
  const { id, reviewId } = req.params;

  await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);
  const stats = await recalculateListingStats(id);

  res.json({
    message: "Review Deleted!",
    ...stats,
  });
};
