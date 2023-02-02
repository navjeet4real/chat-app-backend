const User = require("../models/user");
const filterObject = require("../utils/filterObject");

exports.updateMe = async (req, res, next) => {
  const { user } = req;

  const filterBody = filterObject(req.body, "firstName", "lastName", "email");

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
