const mongoose = require("mongoose");
const Booking = require("../models/booking");
const Listing = require("../models/listing");
const Payment = require("../models/payment");
const ExpressError = require("../utils/expressError");
const {
  getRazorpayClient,
  getRazorpayCredentials,
  verifyRazorpaySignature,
} = require("../config/razorpay");
const {
  PENDING_HOLD_MINUTES,
  activeBookingHoldQuery,
  hasBlockedDateOverlap,
} = require("../utils/bookingPricing");

module.exports.createRazorpayOrder = async (req, res) => {
  const { bookingId } = req.body;
  if (!mongoose.isValidObjectId(bookingId)) {
    throw new ExpressError(400, "Invalid booking ID.");
  }

  const booking = await Booking.findById(bookingId).populate(
    "listing",
    "title status blockedDates"
  );
  if (!booking) {
    throw new ExpressError(404, "Booking not found.");
  }

  if (!booking.guest.equals(req.user._id)) {
    throw new ExpressError(
      403,
      "You are not authorized to pay for this booking."
    );
  }

  if (["Confirmed", "Completed", "Cancelled"].includes(booking.status)) {
    throw new ExpressError(
      400,
      `Cannot initiate payment for a ${booking.status} booking.`
    );
  }

  const listing = booking.listing;
  if (!listing || (listing.status && listing.status !== "published")) {
    throw new ExpressError(400, "This property is no longer available.");
  }

  // Revalidate availability before creating payment order
  if (
    hasBlockedDateOverlap(
      listing.blockedDates,
      booking.checkIn,
      booking.checkOut
    )
  ) {
    throw new ExpressError(409, "Selected dates are no longer available.");
  }

  const conflict = await Booking.findOne({
    ...activeBookingHoldQuery(listing._id, booking.checkIn, booking.checkOut),
    _id: { $ne: booking._id },
  }).select("_id");

  if (conflict) {
    throw new ExpressError(
      409,
      "Selected dates were just reserved by another guest."
    );
  }

  const amountInPaise = Math.round(Number(booking.totalAmount) * 100);
  if (amountInPaise < 100) {
    throw new ExpressError(400, "Payable amount must be at least ₹1.");
  }

  const razorpay = getRazorpayClient();
  const { keyId } = getRazorpayCredentials();

  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: `livora_${booking._id.toString().slice(-12)}_${Date.now().toString().slice(-6)}`,
    notes: {
      bookingId: booking._id.toString(),
      listingId: listing._id.toString(),
      guestId: req.user._id.toString(),
    },
  });

  booking.status = "Pending";
  booking.paymentStatus = "Pending";
  booking.expiresAt = new Date(Date.now() + PENDING_HOLD_MINUTES * 60 * 1000);
  await booking.save();

  await Payment.create({
    booking: booking._id,
    user: req.user._id,
    provider: "razorpay",
    razorpayOrderId: order.id,
    amount: booking.totalAmount,
    amountInPaise,
    currency: order.currency || "INR",
    status: "Created",
  });

  res.status(201).json({
    order: {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
    },
    booking,
  });
};

module.exports.verifyRazorpayPayment = async (req, res) => {
  const {
    bookingId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  if (!mongoose.isValidObjectId(bookingId)) {
    throw new ExpressError(400, "Invalid booking ID.");
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ExpressError(404, "Booking not found.");
  }

  if (!booking.guest.equals(req.user._id)) {
    throw new ExpressError(
      403,
      "You are not authorized to verify payment for this booking."
    );
  }

  if (booking.status === "Confirmed" && booking.paymentStatus === "Paid") {
    return res.json({
      message: "Booking is already confirmed.",
      booking,
    });
  }

  if (["Cancelled", "Completed"].includes(booking.status)) {
    throw new ExpressError(
      400,
      `Cannot verify payment for a ${booking.status} booking.`
    );
  }

  const paymentRecord = await Payment.findOne({
    booking: booking._id,
    razorpayOrderId: razorpay_order_id,
    user: req.user._id,
  });

  if (!paymentRecord) {
    throw new ExpressError(404, "Matching payment order not found.");
  }

  const isValidSignature = verifyRazorpaySignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });

  if (!isValidSignature) {
    paymentRecord.status = "Failed";
    paymentRecord.razorpayPaymentId = razorpay_payment_id;
    paymentRecord.failureReason = "Invalid Razorpay signature";
    await paymentRecord.save();

    booking.status = "Payment Failed";
    booking.paymentStatus = "Failed";
    await booking.save();

    throw new ExpressError(400, "Payment signature verification failed.");
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const conflict = await Booking.findOne({
        listing: booking.listing,
        _id: { $ne: booking._id },
        checkIn: { $lt: booking.checkOut },
        checkOut: { $gt: booking.checkIn },
        status: { $in: ["Confirmed", "Completed"] },
      })
        .select("_id")
        .session(session);

      if (conflict) {
        throw new ExpressError(
          409,
          "These dates were already confirmed for another reservation."
        );
      }

      paymentRecord.status = "Paid";
      paymentRecord.razorpayPaymentId = razorpay_payment_id;
      paymentRecord.razorpaySignature = razorpay_signature;
      paymentRecord.verifiedAt = new Date();
      await paymentRecord.save({ session });

      booking.status = "Confirmed";
      booking.paymentStatus = "Paid";
      booking.expiresAt = null;
      await booking.save({ session });
    });
  } finally {
    await session.endSession();
  }

  await booking.populate("listing", "title location country image price");

  res.json({
    message: "Payment verified and booking confirmed!",
    booking,
  });
};

module.exports.reportPaymentFailure = async (req, res) => {
  const { bookingId, razorpay_order_id, reason } = req.body;
  if (!mongoose.isValidObjectId(bookingId)) {
    throw new ExpressError(400, "Invalid booking ID.");
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ExpressError(404, "Booking not found.");
  }

  if (!booking.guest.equals(req.user._id)) {
    throw new ExpressError(403, "Not authorized for this booking.");
  }

  if (razorpay_order_id) {
    await Payment.findOneAndUpdate(
      {
        booking: booking._id,
        razorpayOrderId: razorpay_order_id,
        status: "Created",
      },
      {
        status: "Failed",
        failureReason: reason || "Payment cancelled or failed in checkout",
      }
    );
  }

  if (booking.status === "Pending") {
    booking.status = "Payment Failed";
    booking.paymentStatus = "Failed";
    await booking.save();
  }

  res.json({
    message: "Payment failure recorded.",
    booking,
  });
};
