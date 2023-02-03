const User = require("../models/user");
const filterObj = require("../utils/filterObj");

exports.updateMe = async (req, res, next) => {
  const { user } = req;

  const filterBody = filterObj(req.body, "firstName", "lastName", "email");

  const updated_user = await User.findByIdAndUpdate(user._id, filterBody, {
    new: true,
    validateModifiedOnly: true,
  });

  res.staus(200).json({
    status: 'success',
    message: "User updated successfully"
  })
};

// module.exports = userController;
