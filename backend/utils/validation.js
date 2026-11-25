const Joi = require("joi");
const { LISTING_CATEGORIES } = require("../models/listing");

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
  category: Joi.string()
    .valid(...LISTING_CATEGORIES)
    .default("Trending"),
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

module.exports = {
  listingValidationSchema,
  reviewValidationSchema,
  signupValidationSchema,
  loginValidationSchema,
  hostOnboardingValidationSchema,
};
