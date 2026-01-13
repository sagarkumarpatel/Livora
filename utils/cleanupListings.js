const mongoose = require("mongoose");
const Listing = require("../Models/listing");

const MONGO_URL = "mongodb://127.0.0.1:27017/Livora";

async function cleanup() {
  try {
    await mongoose.connect(MONGO_URL);
    const result = await Listing.deleteMany({
      $or: [
        { title: { $in: [null, ""] } },
        { description: { $in: [null, ""] } },
        { location: { $in: [null, ""] } },
        { country: { $in: [null, ""] } },
        { price: { $exists: false } },
        { price: null }
      ]
    });
    console.log(`Deleted ${result.deletedCount} incomplete listings.`);
  } catch (err) {
    console.error("Cleanup failed", err);
  } finally {
    await mongoose.connection.close();
  }
}

cleanup();
