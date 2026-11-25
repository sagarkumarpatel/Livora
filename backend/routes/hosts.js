const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const hostController = require("../controllers/hosts");
const { requireAuth, requireHost, isOwner } = require("../middleware/auth");
const {
  validateHostOnboarding,
  validateListingStatus,
  validateAvailabilityBlock,
} = require("../middleware/validate");

router.post(
  "/onboard",
  requireAuth,
  validateHostOnboarding,
  wrapAsync(hostController.onboardHost)
);

router.get(
  "/me",
  requireAuth,
  requireHost,
  wrapAsync(hostController.getMyHostProfile)
);

router.put(
  "/me",
  requireAuth,
  requireHost,
  validateHostOnboarding,
  wrapAsync(hostController.updateMyHostProfile)
);

router.get(
  "/listings",
  requireAuth,
  requireHost,
  wrapAsync(hostController.getHostListings)
);

router.patch(
  "/listings/:id/status",
  requireAuth,
  requireHost,
  isOwner,
  validateListingStatus,
  wrapAsync(hostController.updateListingStatus)
);

router.post(
  "/listings/:id/availability",
  requireAuth,
  requireHost,
  isOwner,
  validateAvailabilityBlock,
  wrapAsync(hostController.addAvailabilityBlock)
);

router.delete(
  "/listings/:id/availability/:blockId",
  requireAuth,
  requireHost,
  isOwner,
  wrapAsync(hostController.removeAvailabilityBlock)
);

router.get(
  "/reviews",
  requireAuth,
  requireHost,
  wrapAsync(hostController.getHostReviews)
);

router.get(
  "/bookings",
  requireAuth,
  requireHost,
  wrapAsync(hostController.getHostBookings)
);

router.patch(
  "/bookings/:id/complete",
  requireAuth,
  requireHost,
  wrapAsync(hostController.completeHostBooking)
);

module.exports = router;
