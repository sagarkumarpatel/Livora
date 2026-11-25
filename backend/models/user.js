const mongoose = require("mongoose");
const passportLocalMongoose =
  require("passport-local-mongoose").default ||
  require("passport-local-mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
  },
  { timestamps: true }
);

// Preserves compatibility with existing passport-local-mongoose users in MongoDB Atlas
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
