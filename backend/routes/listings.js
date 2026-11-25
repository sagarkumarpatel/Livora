const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const listingController = require("../controllers/listings");
const bookingController = require("../controllers/bookings");
const {
  optionalAuth,
  requireAuth,
  requireHost,
  isOwner,
} = require("../middleware/auth");
const {
  validateListing,
  validateBookingQuote,
} = require("../middleware/validate");
const { upload } = require("../config/cloudinary");

const listingUpload = upload.fields([
  { name: "images", maxCount: 8 },
  { name: "image", maxCount: 1 },
]);

router
  .route("/")
  .get(wrapAsync(listingController.index))
  .post(
    requireAuth,
    requireHost,
    listingUpload,
    validateListing,
    wrapAsync(listingController.createListing)
  );

router
  .route("/:id")
  .get(optionalAuth, wrapAsync(listingController.showListing))
  .put(
    requireAuth,
    requireHost,
    isOwner,
    listingUpload,
    validateListing,
    wrapAsync(listingController.updateListing)
  )
  .delete(
    requireAuth,
    requireHost,
    isOwner,
    wrapAsync(listingController.destroyListing)
  );

router.get(
  "/:id/availability",
  wrapAsync(bookingController.getListingAvailability)
);

router.post(
  "/:id/quote",
  validateBookingQuote,
  wrapAsync(bookingController.getBookingQuote)
);

module.exports = router;
