const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const bookingController = require("../controllers/bookings");
const { requireAuth } = require("../middleware/auth");
const { validateCreateBooking } = require("../middleware/validate");

router.get("/me", requireAuth, wrapAsync(bookingController.getMyBookings));

router.post(
  "/",
  requireAuth,
  validateCreateBooking,
  wrapAsync(bookingController.createBooking)
);

router.patch(
  "/:id/cancel",
  requireAuth,
  wrapAsync(bookingController.cancelMyBooking)
);

module.exports = router;
