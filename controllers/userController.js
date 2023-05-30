const FriendRequest = require("../models/friendRequest");
const User = require("../models/user");
const filterObj = require("../utils/filterObj");

exports.updateMe = async (req, res) => {
  const { user } = req;

  const filterBody = filterObj(req.body, "firstName", "lastName", "email");

  const updated_user = await User.findByIdAndUpdate(user._id, filterBody, {
    new: true,
    validateModifiedOnly: true,
  });

  res.staus(200).json({
    status: "success",
    data: updated_user,
    message: "User updated successfully",
  });
};

exports.getUsers = async (req, res) => {
  const all_users = await User.find({
    verified: true,
  }).select("firstName lastName _id ");

  const this_user = req.user;

  const remaining_user = all_users.filter(
    (user) =>
      !this_user.friends.includes(user._id) &&
      user._id.toString() !== req.user._id.toString()
  );


  res.status(200).json({
    status: 'success',
    data: remaining_user,
    message: "Users found successfully!"
  })
};

exports.getRequests = async (req, res) => {
  const requests = await FriendRequest.find({ recipient: req.user._id })
    .populate("sender").select("_id firstName lastName")

  res.status(200).json({
    status: "success",
    data: requests,
    message: "Requests found successfully!",
  });
};

exports.getFriends = async (req, res) => {
  const this_user = await User.findById(req.user._id).populate(
    "friends",
    "_id firstName lastName"
  );
  res.status(200).json({
    status: "success",
    data: this_user.friends,
    message: "Friends found successfully!",
  });
};
// module.exports = userController;
