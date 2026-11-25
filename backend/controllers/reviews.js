const mongoose = require("mongoose");
const Booking = require("../models/booking");
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

async function findEligibleCompletedBookings(listingId, userId) {
  const completedBookings = await Booking.find({
    listing: listingId,
    guest: userId,
    status: "Completed",
    paymentStatus: "Paid",
  })
    .select("_id checkIn checkOut nights")
    .sort({ checkOut: -1 });

  if (completedBookings.length === 0) return [];

  const bookingIds = completedBookings.map((b) => b._id);
  const existingReviews = await Review.find({
    booking: { $in: bookingIds },
  }).select("booking");
  const reviewedSet = new Set(existingReviews.map((r) => String(r.booking)));

  return completedBookings.filter((b) => !reviewedSet.has(String(b._id)));
}

module.exports.checkReviewEligibility = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new ExpressError(400, "Invalid listing ID.");
  }

  const eligibleBookings = await findEligibleCompletedBookings(
    id,
    req.user._id
  );

  res.json({
    eligible: eligibleBookings.length > 0,
    eligibleBookings,
  });
};

module.exports.createReview = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new ExpressError(400, "Invalid listing ID.");
  }

  const listing = await Listing.findById(id);
  if (!listing) {
    throw new ExpressError(404, "Listing not found.");
  }

  const { rating, comment, bookingId } = req.body;
  let targetBooking = null;

  if (bookingId) {
    if (!mongoose.isValidObjectId(bookingId)) {
      throw new ExpressError(400, "Invalid booking ID.");
    }

    const booking = await Booking.findById(bookingId);
    if (!booking || !booking.listing.equals(listing._id)) {
      throw new ExpressError(
        404,
        "Matching booking not found for this property."
      );
    }

    if (!booking.guest.equals(req.user._id)) {
      throw new ExpressError(
        403,
        "You cannot submit a review for another customer's booking."
      );
    }

    if (booking.status !== "Completed" || booking.paymentStatus !== "Paid") {
      throw new ExpressError(
        403,
        "Only completed and verified paid bookings can be reviewed."
      );
    }

    const alreadyReviewed = await Review.findOne({
      booking: booking._id,
    }).select("_id");
    if (alreadyReviewed) {
      throw new ExpressError(
        409,
        "A review has already been submitted for this booking."
      );
    }

    targetBooking = booking;
  } else {
    const eligible = await findEligibleCompletedBookings(
      listing._id,
      req.user._id
    );
    if (eligible.length === 0) {
      throw new ExpressError(
        403,
        "Only guests with an unreviewed completed stay can review this property."
      );
    }
    targetBooking = eligible[0];
  }

  let createdReview;
  try {
    createdReview = await Review.create({
      rating,
      comment,
      author: req.user._id,
      listing: listing._id,
      booking: targetBooking._id,
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new ExpressError(
        409,
        "A review has already been submitted for this booking."
      );
    }
    throw err;
  }

  listing.reviews.push(createdReview._id);
  await listing.save();
  await createdReview.populate("author", "username");

  const stats = await recalculateListingStats(listing._id);

  res.status(201).json({
    message: "New Review Created!",
    review: createdReview,
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
