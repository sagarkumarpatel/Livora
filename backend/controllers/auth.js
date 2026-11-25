const jwt = require("jsonwebtoken");
const passport = require("passport");
const User = require("../models/user");
const ExpressError = require("../utils/expressError");
const { getJwtSecret } = require("../middleware/auth");

const TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), username: user.username },
    getJwtSecret(),
    { expiresIn: "7d" }
  );
}

function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
    maxAge: TOKEN_MAX_AGE_MS,
  });
}

function formatUser(user) {
  return {
    _id: user._id,
    username: user.username,
    email: user.email,
  };
}

module.exports.signup = async (req, res, next) => {
  const { username, email, password } = req.body;

  try {
    const newUser = new User({ username, email });
    const registeredUser = await User.register(newUser, password);
    const token = signToken(registeredUser);
    setAuthCookie(res, token);

    res.status(201).json({
      message: "Welcome to Livora!",
      user: formatUser(registeredUser),
      token,
    });
  } catch (err) {
    if (err.name === "UserExistsError" || err.code === 11000) {
      return next(
        new ExpressError(409, err.message || "Username or email already exists.")
      );
    }
    return next(new ExpressError(400, err.message || "Registration failed."));
  }
};

module.exports.login = (req, res, next) => {
  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return next(
        new ExpressError(
          401,
          info?.message || "Invalid username or password."
        )
      );
    }

    const token = signToken(user);
    setAuthCookie(res, token);

    return res.json({
      message: "Welcome back to Livora!",
      user: formatUser(user),
      token,
    });
  })(req, res, next);
};

module.exports.logout = (req, res) => {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
  });
  res.json({ message: "You are logged out!" });
};

module.exports.getCurrentUser = (req, res) => {
  res.json({ user: formatUser(req.user) });
};
