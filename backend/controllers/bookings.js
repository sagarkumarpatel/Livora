const mongoose = require("mongoose");
const Booking = require("../models/booking");
const Listing = require("../models/listing");
const ExpressError = require("../utils/expressError");
const {
  PENDING_HOLD_MINUTES,
  normalizeUtcDate,
  getTodayUtc,
  calculateNights,
  calculatePriceBreakdown,
  activeBookingHoldQuery,
  hasBlockedDateOverlap,
} = require("../utils/bookingPricing");

function validateListingAndDates(listing, checkInInput, checkOutInput, guestsCount) {
  if (!listing || (listing.status && listing.status !== "published")) {
    throw new ExpressError(404, "Published listing not found.");
  }

  const checkIn = normalizeUtcDate(checkInInput);
  const checkOut = normalizeUtcDate(checkOutInput);
  const today = getTodayUtc();

  if (!checkIn || !checkOut) {
    throw new ExpressError(400, "Invalid check-in or check-out date.");
  }

  if (checkIn < today) {
    throw new ExpressError(400, "Check-in date cannot be in the past.");
  }

  const nights = calculateNights(checkIn, checkOut);
  if (nights < 1) {
    throw new ExpressError(400, "Check-out date must be at least 1 night after check-in.");
  }

  const maxGuests = listing.maxGuests ?? 2;
  if (Number(guestsCount) > maxGuests) {
    throw new ExpressError(
      400,
      `Maximum guest capacity for this property is ${maxGuests}.`
    );
  }

  return { checkIn, checkOut, nights };
}

module.exports.getListingAvailability = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new ExpressError(400, "Invalid listing ID.");
  }

  const listing = await Listing.findById(id).select("status blockedDates maxGuests");
  if (!listing || (listing.status && listing.status !== "published")) {
    throw new ExpressError(404, "Listing not found.");
  }

  const now = new Date();
  const activeBookings = await Booking.find({
    listing: listing._id,
    $or: [
      { status: { $in: ["Confirmed", "Completed"] } },
      { status: "Pending", expiresAt: { $gt: now } },
    ],
  }).select("checkIn checkOut status");

  const unavailableRanges = [
    ...(listing.blockedDates || []).map((b) => ({
      startDate: b.startDate,
      endDate: b.endDate,
      source: "host_blocked",
    })),
    ...activeBookings.map((b) => ({
      startDate: b.checkIn,
      endDate: b.checkOut,
      source: "booked",
    })),
  ];

  res.json({ unavailableRanges });
};

module.exports.getBookingQuote = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new ExpressError(400, "Invalid listing ID.");
  }

  const listing = await Listing.findById(id).select(
    "price cleaningFee maxGuests status blockedDates"
  );

  const { checkIn, checkOut, nights } = validateListingAndDates(
    listing,
    req.body.checkIn,
    req.body.checkOut,
    req.body.guestsCount
  );

  const blocked = hasBlockedDateOverlap(listing.blockedDates, checkIn, checkOut);
  const existingConflict = await Booking.findOne(
    activeBookingHoldQuery(listing._id, checkIn, checkOut)
  ).select("_id");

  const available = !blocked && !existingConflict;
  const pricing = calculatePriceBreakdown({
    pricePerNight: listing.price,
    cleaningFee: listing.cleaningFee ?? 0,
    nights,
  });

  res.json({
    quote: {
      ...pricing,
      checkIn,
      checkOut,
      guestsCount: Number(req.body.guestsCount),
      available,
    },
  });
};

module.exports.createBooking = async (req, res) => {
  const { listingId, guestsCount } = req.body;
  if (!mongoose.isValidObjectId(listingId)) {
    throw new ExpressError(400, "Invalid listing ID.");
  }

  const session = await mongoose.startSession();
  let createdBooking = null;

  try {
    await session.withTransaction(async () => {
      const listing = await Listing.findById(listingId).session(session);
      const { checkIn, checkOut, nights } = validateListingAndDates(
        listing,
        req.body.checkIn,
        req.body.checkOut,
        guestsCount
      );

      if (!listing.owner) {
        throw new ExpressError(400, "Listing does not have an assigned host.");
      }

      if (listing.owner.equals(req.user._id)) {
        throw new ExpressError(400, "Hosts cannot book their own property.");
      }

      if (hasBlockedDateOverlap(listing.blockedDates, checkIn, checkOut)) {
        throw new ExpressError(
          409,
          "Selected dates are unavailable (blocked by host)."
        );
      }

      const conflictingBooking = await Booking.findOne(
        activeBookingHoldQuery(listing._id, checkIn, checkOut)
      )
        .select("_id")
        .session(session);

      if (conflictingBooking) {
        throw new ExpressError(
          409,
          "Selected dates overlap with an existing reservation."
        );
      }

      const pricing = calculatePriceBreakdown({
        pricePerNight: listing.price,
        cleaningFee: listing.cleaningFee ?? 0,
        nights,
      });

      const expiresAt = new Date(
        Date.now() + PENDING_HOLD_MINUTES * 60 * 1000
      );

      const [booking] = await Booking.create(
        [
          {
            listing: listing._id,
            guest: req.user._id,
            host: listing.owner,
            checkIn,
            checkOut,
            nights: pricing.nights,
            guestsCount: Number(guestsCount),
            pricePerNight: pricing.pricePerNight,
            baseAmount: pricing.baseAmount,
            cleaningFee: pricing.cleaningFee,
            serviceFee: pricing.serviceFee,
            taxes: pricing.taxes,
            totalAmount: pricing.totalAmount,
            status: "Pending",
            paymentStatus: "Pending",
            expiresAt,
          },
        ],
        { session }
      );

      createdBooking = booking;
    });
  } finally {
    await session.endSession();
  }

  await createdBooking.populate("listing", "title location country image price");

  res.status(201).json({
    message: "Reservation hold created. Complete payment to confirm.",
    booking: createdBooking,
  });
};
