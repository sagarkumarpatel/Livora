const mongoose = require("mongoose");
const HostProfile = require("../models/hostProfile");
const Listing = require("../models/listing");
const User = require("../models/user");
const ExpressError = require("../utils/expressError");
const { formatPublicListing } = require("./listings");

function formatHostUser(user) {
  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    isHost: Boolean(user.isHost),
    hostProfile: user.hostProfile || null,
  };
}

module.exports.onboardHost = async (req, res) => {
  const existingProfile = await HostProfile.findOne({ user: req.user._id });
  if (existingProfile) {
    if (!req.user.isHost || !req.user.hostProfile) {
      await User.findByIdAndUpdate(req.user._id, {
        isHost: true,
        hostProfile: existingProfile._id,
      });
    }
    throw new ExpressError(409, "You are already registered as a host.");
  }

  const hostProfile = await HostProfile.create({
    user: req.user._id,
    fullName: req.body.fullName,
    email: req.body.email,
    phone: req.body.phone,
    contactDetails: req.body.contactDetails,
    bio: req.body.bio || "",
  });

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      isHost: true,
      hostProfile: hostProfile._id,
    },
    { returnDocument: "after" }
  ).select("_id username email isHost hostProfile");

  res.status(201).json({
    message: "Congratulations! You are now registered as a Livora Host.",
    hostProfile,
    user: formatHostUser(updatedUser),
  });
};

module.exports.getMyHostProfile = async (req, res) => {
  res.json({
    hostProfile: req.hostProfile,
    user: formatHostUser(req.user),
  });
};

module.exports.updateMyHostProfile = async (req, res) => {
  const hostProfile = req.hostProfile;
  hostProfile.fullName = req.body.fullName;
  hostProfile.email = req.body.email;
  hostProfile.phone = req.body.phone;
  hostProfile.contactDetails = req.body.contactDetails;
  hostProfile.bio = req.body.bio || "";

  await hostProfile.save();

  res.json({
    message: "Host profile updated.",
    hostProfile,
  });
};

module.exports.getHostListings = async (req, res) => {
  const docs = await Listing.find({ owner: req.user._id })
    .populate("owner", "username createdAt")
    .populate("reviews", "rating")
    .sort({ createdAt: -1 });

  const listings = docs.map((doc) =>
    formatPublicListing(doc, { includeBlockedDates: true })
  );
  res.json({ listings });
};

module.exports.updateListingStatus = async (req, res) => {
  const listing = req.listing;
  listing.status = req.body.status;
  await listing.save();
  await listing.populate("owner", "username createdAt");

  res.json({
    message: `Listing status updated to ${listing.status}.`,
    listing: formatPublicListing(listing, { includeBlockedDates: true }),
  });
};

module.exports.addAvailabilityBlock = async (req, res) => {
  const listing = req.listing;
  const startDate = new Date(req.body.startDate);
  const endDate = new Date(req.body.endDate);

  const overlaps = (listing.blockedDates || []).some((block) => {
    return startDate < new Date(block.endDate) && endDate > new Date(block.startDate);
  });

  if (overlaps) {
    throw new ExpressError(
      409,
      "This date range overlaps with an existing blocked period."
    );
  }

  listing.blockedDates.push({
    startDate,
    endDate,
    reason: req.body.reason || "Host blocked",
  });
  await listing.save();

  res.status(201).json({
    message: "Availability block added.",
    blockedDates: listing.blockedDates,
  });
};

module.exports.removeAvailabilityBlock = async (req, res) => {
  const listing = req.listing;
  const { blockId } = req.params;

  if (!mongoose.isValidObjectId(blockId)) {
    throw new ExpressError(400, "Invalid availability block ID.");
  }

  const beforeLen = listing.blockedDates.length;
  listing.blockedDates = listing.blockedDates.filter(
    (b) => !b._id.equals(blockId)
  );

  if (listing.blockedDates.length === beforeLen) {
    throw new ExpressError(404, "Blocked date range not found.");
  }

  await listing.save();

  res.json({
    message: "Availability block removed.",
    blockedDates: listing.blockedDates,
  });
};

module.exports.getHostReviews = async (req, res) => {
  const listings = await Listing.find({ owner: req.user._id })
    .select("title location reviews")
    .populate({
      path: "reviews",
      populate: { path: "author", select: "username" },
      options: { sort: { createdAt: -1 } },
    });

  const reviews = [];
  for (const listing of listings) {
    for (const review of listing.reviews || []) {
      reviews.push({
        _id: review._id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        author: review.author,
        listing: {
          _id: listing._id,
          title: listing.title,
          location: listing.location,
        },
      });
    }
  }

  reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ reviews });
};

module.exports.getHostBookings = async (req, res) => {
  const BookingModel = mongoose.models.Booking;
  if (!BookingModel) {
    return res.json({ bookings: [] });
  }

  const bookings = await BookingModel.find({ host: req.user._id })
    .populate("listing", "title location country image")
    .populate("guest", "username")
    .sort({ createdAt: -1 });

  res.json({ bookings });
};

module.exports.completeHostBooking = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new ExpressError(400, "Invalid booking ID.");
  }

  const BookingModel = mongoose.models.Booking;
  const booking = await BookingModel.findById(id);
  if (!booking) {
    throw new ExpressError(404, "Booking not found.");
  }

  if (!booking.host.equals(req.user._id)) {
    throw new ExpressError(403, "You are not the host for this booking.");
  }

  if (booking.status !== "Confirmed" || booking.paymentStatus !== "Paid") {
    throw new ExpressError(
      400,
      "Only confirmed and paid bookings can be marked as Completed."
    );
  }

  booking.status = "Completed";
  await booking.save();

  res.json({
    message: "Booking marked as Completed.",
    booking,
  });
};
