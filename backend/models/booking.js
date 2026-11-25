const mongoose = require("mongoose");

const BOOKING_STATUSES = [
  "Pending",
  "Confirmed",
  "Cancelled",
  "Completed",
  "Payment Failed",
];

const PAYMENT_STATUSES = ["Pending", "Paid", "Failed", "Refunded"];

const bookingSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
      index: true,
    },
    guest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    checkIn: {
      type: Date,
      required: true,
    },
    checkOut: {
      type: Date,
      required: true,
    },
    nights: {
      type: Number,
      required: true,
      min: 1,
    },
    guestsCount: {
      type: Number,
      required: true,
      min: 1,
    },
    pricePerNight: {
      type: Number,
      required: true,
      min: 0,
    },
    baseAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    cleaningFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    serviceFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxes: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: BOOKING_STATUSES,
      default: "Pending",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: "Pending",
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

bookingSchema.index({ listing: 1, status: 1, checkIn: 1, checkOut: 1 });

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
module.exports.BOOKING_STATUSES = BOOKING_STATUSES;
module.exports.PAYMENT_STATUSES = PAYMENT_STATUSES;
