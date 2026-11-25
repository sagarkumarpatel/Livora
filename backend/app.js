const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const multer = require("multer");

const User = require("./models/user");
const ExpressError = require("./utils/expressError");
const authRouter = require("./routes/auth");
const hostsRouter = require("./routes/hosts");
const listingsRouter = require("./routes/listings");
const reviewsRouter = require("./routes/reviews");
const bookingsRouter = require("./routes/bookings");
const paymentsRouter = require("./routes/payments");

const app = express();
app.disable("x-powered-by");

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new ExpressError(403, "Origin not allowed by CORS."));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(passport.initialize());
passport.use(new LocalStrategy(User.authenticate()));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "livora-backend" });
});

app.use("/api/auth", authRouter);
app.use("/api/hosts", hostsRouter);
app.use("/api/listings", listingsRouter);
app.use("/api/listings/:id/reviews", reviewsRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/payments", paymentsRouter);

app.use((req, res, next) => {
  next(new ExpressError(404, "API route not found."));
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Image file size must be 5MB or less."
        : err.message;
    return res.status(400).json({ message });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Something went wrong.";
  res.status(statusCode).json({ message });
});

module.exports = app;
