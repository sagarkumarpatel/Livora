const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const authController = require("../controllers/auth");
const { requireAuth } = require("../middleware/auth");
const { validateSignup, validateLogin } = require("../middleware/validate");

router.post("/signup", validateSignup, wrapAsync(authController.signup));
router.post("/login", validateLogin, authController.login);
router.post("/logout", authController.logout);
router.get("/me", requireAuth, authController.getCurrentUser);

module.exports = router;
