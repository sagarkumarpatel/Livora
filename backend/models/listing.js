const mongoose = require("mongoose");
const Review = require("./review");

const LISTING_CATEGORIES = [
  "Trending",
  "Iconic Cities",
  "Mountains",
  "Castles",
  "Amazing pools",
  "Camping",
  "Farms",
  "Arctic",
  "Domes",
  "Boats",
];

const PROPERTY_TYPES = [
  "Entire home",
  "Private room",
  "Villa",
  "Apartment",
  "Cabin",
  "Cottage",
  "Treehouse",
  "Boat",
  "Other",
];

const LISTING_STATUSES = ["published", "unpublished", "inactive"];

const imageSubSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    filename: { type: String, default: "" },
  },
  { _id: false }
);

const blockedDateSubSchema = new mongoose.Schema({
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String, default: "Unavailable", trim: true },
});

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      url: {
        type: String,
        required: true,
      },
      filename: {
        type: String,
        default: "",
      },
    },
    images: {
      type: [imageSubSchema],
      default: [],
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    cleaningFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: LISTING_CATEGORIES,
      default: "Trending",
    },
    propertyType: {
      type: String,
      enum: PROPERTY_TYPES,
      default: "Entire home",
    },
    maxGuests: {
      type: Number,
      default: 2,
      min: 1,
    },
    bedrooms: {
      type: Number,
      default: 1,
      min: 0,
    },
    bathrooms: {
      type: Number,
      default: 1,
      min: 0,
    },
    amenities: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: LISTING_STATUSES,
      default: "published",
      index: true,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    blockedDates: {
      type: [blockedDateSubSchema],
      default: [],
    },
    geometry: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
        required: true,
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
        required: true,
      },
    },
  },
  { timestamps: true }
);

listingSchema.post("findOneAndDelete", async (listing) => {
  if (listing && listing.reviews?.length) {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
  }
});

const Listing = mongoose.model("Listing", listingSchema);

module.exports = Listing;
module.exports.LISTING_CATEGORIES = LISTING_CATEGORIES;
module.exports.PROPERTY_TYPES = PROPERTY_TYPES;
module.exports.LISTING_STATUSES = LISTING_STATUSES;
