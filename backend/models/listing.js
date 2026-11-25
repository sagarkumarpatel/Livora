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
    price: {
      type: Number,
      required: true,
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
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
