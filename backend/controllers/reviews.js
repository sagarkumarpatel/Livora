const mongoose = require("mongoose");
const Listing = require("../models/listing");
const Review = require("../models/review");
const ExpressError = require("../utils/expressError");

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

  res.status(201).json({
    message: "New Review Created!",
    review: newReview,
  });
};

module.exports.destroyReview = async (req, res) => {
  const { id, reviewId } = req.params;

  await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);

  res.json({ message: "Review Deleted!" });
};
