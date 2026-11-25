const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync");
const { requireAuth, isReviewAuthor } = require("../middleware/auth");
const { validateReview } = require("../middleware/validate");
const reviewController = require("../controllers/reviews");

router.get(
  "/eligibility",
  requireAuth,
  wrapAsync(reviewController.checkReviewEligibility)
);

router.post(
  "/",
  requireAuth,
  validateReview,
  wrapAsync(reviewController.createReview)
);

router.delete(
  "/:reviewId",
  requireAuth,
  isReviewAuthor,
  wrapAsync(reviewController.destroyReview)
);

module.exports = router;
