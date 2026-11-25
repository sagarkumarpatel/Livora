const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const hostController = require("../controllers/hosts");
const { requireAuth, requireHost } = require("../middleware/auth");
const { validateHostOnboarding } = require("../middleware/validate");

router.post(
  "/onboard",
  requireAuth,
  validateHostOnboarding,
  wrapAsync(hostController.onboardHost)
);

router.get(
  "/me",
  requireAuth,
  requireHost,
  wrapAsync(hostController.getMyHostProfile)
);

router.put(
  "/me",
  requireAuth,
  requireHost,
  validateHostOnboarding,
  wrapAsync(hostController.updateMyHostProfile)
);

module.exports = router;
