const ExpressError = require("../utils/expressError");
const {
  listingValidationSchema,
  reviewValidationSchema,
  signupValidationSchema,
  loginValidationSchema,
} = require("../utils/validation");

function makeValidator(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const message = error.details.map((d) => d.message).join(", ");
      return next(new ExpressError(400, message));
    }

    req.body = value;
    next();
  };
}

module.exports = {
  validateListing: makeValidator(listingValidationSchema),
  validateReview: makeValidator(reviewValidationSchema),
  validateSignup: makeValidator(signupValidationSchema),
  validateLogin: makeValidator(loginValidationSchema),
};
