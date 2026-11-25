const HostProfile = require("../models/hostProfile");
const User = require("../models/user");
const ExpressError = require("../utils/expressError");

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
