require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const initData = require("./data");
const Listing = require("../models/listing");
const User = require("../models/user");

async function seedDB() {
  await connectDB();

  let defaultUser = await User.findOne();
  if (!defaultUser) {
    defaultUser = await User.register(
      new User({ username: "livora_host", email: "host@livora.com" }),
      "livora123"
    );
    console.log("Created default seed user: livora_host");
  }

  await Listing.deleteMany({});
  const seededListings = initData.data.map((obj) => ({
    ...obj,
    owner: defaultUser._id,
    geometry: obj.geometry || { type: "Point", coordinates: [0, 0] },
  }));

  await Listing.insertMany(seededListings);
  console.log(`Seeded ${seededListings.length} listings.`);
  await mongoose.connection.close();
}

seedDB().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
