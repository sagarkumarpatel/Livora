const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const listingController = require("../controllers/listings");
const { requireAuth, isOwner } = require("../middleware/auth");
const { validateListing } = require("../middleware/validate");
const { upload } = require("../config/cloudinary");

router
  .route("/")
  .get(wrapAsync(listingController.index))
  .post(
    requireAuth,
    upload.single("image"),
    validateListing,
    wrapAsync(listingController.createListing)
  );

router
  .route("/:id")
  .get(wrapAsync(listingController.showListing))
  .put(
    requireAuth,
    isOwner,
    upload.single("image"),
    validateListing,
    wrapAsync(listingController.updateListing)
  )
  .delete(requireAuth, isOwner, wrapAsync(listingController.destroyListing));

module.exports = router;
