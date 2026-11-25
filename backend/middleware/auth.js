const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/user");
const Listing = require("../models/listing");
const Review = require("../models/review");
const ExpressError = require("../utils/expressError");
const wrapAsync = require("../utils/wrapAsync");

function getJwtSecret() {
  return process.env.SECRET || "livora-dev-secret";
}

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  return null;
}

const requireAuth = wrapAsync(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    throw new ExpressError(401, "You must be logged in to perform this action.");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, getJwtSecret());
  } catch {
    throw new ExpressError(401, "Session expired or invalid. Please log in again.");
  }

  const user = await User.findById(decoded.id).select("_id username email");
  if (!user) {
    throw new ExpressError(401, "User account no longer exists.");
  }

  req.user = user;
  next();
});

const isOwner = wrapAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new ExpressError(400, "Invalid listing ID.");
  }

  const listing = await Listing.findById(id);
  if (!listing) {
    throw new ExpressError(404, "Listing you requested does not exist.");
  }

  if (!listing.owner || !listing.owner.equals(req.user._id)) {
    throw new ExpressError(403, "You are not the owner of this listing.");
  }

  req.listing = listing;
  next();
});

const isReviewAuthor = wrapAsync(async (req, res, next) => {
  const { id, reviewId } = req.params;
  if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(reviewId)) {
    throw new ExpressError(400, "Invalid listing or review ID.");
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    throw new ExpressError(404, "Review not found.");
  }

  if (!review.author || !review.author.equals(req.user._id)) {
    throw new ExpressError(403, "You are not the author of this review.");
  }

  req.review = review;
  next();
});

module.exports = {
  getJwtSecret,
  extractToken,
  requireAuth,
  isOwner,
  isReviewAuthor,
};
