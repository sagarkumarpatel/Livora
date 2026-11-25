const mongoose = require("mongoose");

const PAYMENT_RECORD_STATUSES = ["Created", "Paid", "Failed", "Refunded"];

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ["razorpay"],
      default: "razorpay",
    },
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    razorpaySignature: {
      type: String,
      default: null,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    amountInPaise: {
      type: Number,
      required: true,
      min: 100,
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: PAYMENT_RECORD_STATUSES,
      default: "Created",
    },
    failureReason: {
      type: String,
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
module.exports.PAYMENT_RECORD_STATUSES = PAYMENT_RECORD_STATUSES;
