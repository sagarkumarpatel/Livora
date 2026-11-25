const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const paymentController = require("../controllers/payments");
const { requireAuth } = require("../middleware/auth");
const {
  validateCreatePaymentOrder,
  validateVerifyRazorpayPayment,
  validateReportPaymentFailure,
} = require("../middleware/validate");

router.post(
  "/razorpay/order",
  requireAuth,
  validateCreatePaymentOrder,
  wrapAsync(paymentController.createRazorpayOrder)
);

router.post(
  "/razorpay/verify",
  requireAuth,
  validateVerifyRazorpayPayment,
  wrapAsync(paymentController.verifyRazorpayPayment)
);

router.post(
  "/razorpay/failure",
  requireAuth,
  validateReportPaymentFailure,
  wrapAsync(paymentController.reportPaymentFailure)
);

module.exports = router;
