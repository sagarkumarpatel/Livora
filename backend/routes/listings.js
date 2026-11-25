const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const listingController = require("../controllers/listings");
const {
  optionalAuth,
  requireAuth,
  requireHost,
  isOwner,
} = require("../middleware/auth");
const { validateListing } = require("../middleware/validate");
const { upload } = require("../config/cloudinary");

router
  .route("/")
  .get(wrapAsync(listingController.index))
  .post(
    requireAuth,
    requireHost,
    upload.single("image"),
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
    upload.single("image"),
    validateListing,
    wrapAsync(listingController.updateListing)
  )
  .delete(
    requireAuth,
    requireHost,
    isOwner,
    wrapAsync(listingController.destroyListing)
  );

module.exports = router;
