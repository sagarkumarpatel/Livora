const ExpressError = require("../utils/expressError");
const {
  listingValidationSchema,
  listingStatusValidationSchema,
  availabilityBlockValidationSchema,
  reviewValidationSchema,
  signupValidationSchema,
  loginValidationSchema,
  hostOnboardingValidationSchema,
  bookingQuoteValidationSchema,
  createBookingValidationSchema,
  createPaymentOrderValidationSchema,
  verifyRazorpayPaymentValidationSchema,
  reportPaymentFailureValidationSchema,
} = require("../utils/validation");

function parseStringArrayField(rawValue) {
  if (Array.isArray(rawValue)) {
    return rawValue.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof rawValue === "string") {
    const trimmed = rawValue.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((v) => String(v).trim()).filter(Boolean);
        }
      } catch {
        // fallback to comma-split below
      }
    }
    return trimmed
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

function makeValidator(schema, transform) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const message = error.details.map((d) => d.message).join(", ");
      return next(new ExpressError(400, message));
    }

    req.body = transform ? transform(value) : value;
    next();
  };
}

module.exports = {
  validateListing: makeValidator(listingValidationSchema, (value) => ({
    ...value,
    amenities: [...new Set(parseStringArrayField(value.amenities))],
    removedImageFilenames: parseStringArrayField(value.removedImageFilenames),
  })),
  validateListingStatus: makeValidator(listingStatusValidationSchema),
  validateAvailabilityBlock: makeValidator(availabilityBlockValidationSchema),
  validateReview: makeValidator(reviewValidationSchema),
  validateSignup: makeValidator(signupValidationSchema),
  validateLogin: makeValidator(loginValidationSchema),
  validateHostOnboarding: makeValidator(hostOnboardingValidationSchema),
  validateBookingQuote: makeValidator(bookingQuoteValidationSchema),
  validateCreateBooking: makeValidator(createBookingValidationSchema),
  validateCreatePaymentOrder: makeValidator(createPaymentOrderValidationSchema),
  validateVerifyRazorpayPayment: makeValidator(verifyRazorpayPaymentValidationSchema),
  validateReportPaymentFailure: makeValidator(reportPaymentFailureValidationSchema),
};
