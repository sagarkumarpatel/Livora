const Joi = require("joi");
const {
  LISTING_CATEGORIES,
  PROPERTY_TYPES,
  LISTING_STATUSES,
} = require("../models/listing");

const countryPattern = /^(?=.*[A-Za-z])[A-Za-z\s.'-]+$/;

const listingValidationSchema = Joi.object({
  title: Joi.string().trim().min(2).max(120).required(),
  description: Joi.string().trim().min(5).max(2000).required(),
  location: Joi.string().trim().min(2).max(120).required(),
  country: Joi.string()
    .trim()
    .pattern(countryPattern)
    .required()
    .messages({
      "string.pattern.base":
        "Country must contain letters and may include spaces, apostrophes, period, or hyphen.",
    }),
  price: Joi.number().min(0).required(),
  cleaningFee: Joi.number().min(0).default(0),
  category: Joi.string()
    .valid(...LISTING_CATEGORIES)
    .default("Trending"),
  propertyType: Joi.string()
    .valid(...PROPERTY_TYPES)
    .default("Entire home"),
  maxGuests: Joi.number().integer().min(1).max(30).default(2),
  bedrooms: Joi.number().integer().min(0).max(30).default(1),
  bathrooms: Joi.number().min(0).max(30).default(1),
  status: Joi.string()
    .valid(...LISTING_STATUSES)
    .default("published"),
  amenities: Joi.alternatives()
    .try(Joi.array().items(Joi.string().trim()), Joi.string().allow(""))
    .default([]),
  removedImageFilenames: Joi.alternatives()
    .try(Joi.array().items(Joi.string().trim()), Joi.string().allow(""))
    .default([]),
});

const listingStatusValidationSchema = Joi.object({
  status: Joi.string()
    .valid(...LISTING_STATUSES)
    .required(),
});

const availabilityBlockValidationSchema = Joi.object({
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().greater(Joi.ref("startDate")).required().messages({
    "date.greater": "End date must be after start date.",
  }),
  reason: Joi.string().trim().max(120).allow("").default("Host blocked"),
});

const reviewValidationSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().trim().min(1).max(1000).required(),
});

const signupValidationSchema = Joi.object({
  username: Joi.string().trim().min(3).max(40).required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(6).max(128).required(),
});

const loginValidationSchema = Joi.object({
  username: Joi.string().trim().required(),
  password: Joi.string().required(),
});

const phonePattern = /^[+]?[\d\s()-]{7,20}$/;

const hostOnboardingValidationSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().email().required(),
  phone: Joi.string()
    .trim()
    .pattern(phonePattern)
    .required()
    .messages({
      "string.pattern.base": "Please enter a valid phone number (7-20 digits).",
    }),
  contactDetails: Joi.string().trim().min(5).max(300).required(),
  bio: Joi.string().trim().max(1000).allow("").default(""),
});

const bookingQuoteValidationSchema = Joi.object({
  checkIn: Joi.date().iso().required(),
  checkOut: Joi.date().iso().greater(Joi.ref("checkIn")).required().messages({
    "date.greater": "Check-out date must be after check-in date.",
  }),
  guestsCount: Joi.number().integer().min(1).max(30).required(),
});

const createBookingValidationSchema = Joi.object({
  listingId: Joi.string().trim().required(),
  checkIn: Joi.date().iso().required(),
  checkOut: Joi.date().iso().greater(Joi.ref("checkIn")).required().messages({
    "date.greater": "Check-out date must be after check-in date.",
  }),
  guestsCount: Joi.number().integer().min(1).max(30).required(),
});

const createPaymentOrderValidationSchema = Joi.object({
  bookingId: Joi.string().trim().required(),
});

const verifyRazorpayPaymentValidationSchema = Joi.object({
  bookingId: Joi.string().trim().required(),
  razorpay_order_id: Joi.string().trim().required(),
  razorpay_payment_id: Joi.string().trim().required(),
  razorpay_signature: Joi.string().trim().required(),
});

const reportPaymentFailureValidationSchema = Joi.object({
  bookingId: Joi.string().trim().required(),
  razorpay_order_id: Joi.string().trim().allow("", null),
  reason: Joi.string().trim().max(300).allow("", null),
});

module.exports = {
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
};
