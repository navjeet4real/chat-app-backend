const jwt = require("jsonwebtoken");
const User = require("../models/user");
const filterObject = require("../utils/filterObject");
const otpGenerator = require("otp-generator");
const signToken = (userId) => jwt.sign({ userId }, process.env.SECRET_KEY);

const userController = {
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          status: "error",
          message: "Both are required",
        });
      }

      const userDoc = await User.findOne({ email: email }).select("+password");

      if (
        !userDoc ||
        !(await userDoc.correctPassword(password, userDoc.password))
      ) {
        res.staus(400).json({
          status: "error",
          message: "Email or Password is Incorect",
        });
      }

      const token = signToken(userDoc._id);

      res.status(200).json({
        status: "Success",
        message: "Logged In.",
        token,
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  register: async (req, res, next) => {
    try {
      const { firstName, lastname, email, password } = req.body;

      const filterBody = filterObject(
        req.body,
        "firstName",
        "lastName",
        "password",
        "email"
      );
      const existing_user = await User.findOne({ email: email });
      if (existing_user && existing_user.verified) {
        res.status(400).json({
          status: "error",
          message: "User already registered. Please Login.",
        });
      } else if (existing_user) {
        await User.findOneAndUpdate({ email: email }, filterBody, {
          new: true,
          validateModifyOnly: true,
        });

        req.userId = existing_user._id;
        next();
      } else {
        const new_user = await User.create(filterBody);

        req.userId = new_user._id;
        next();
      }
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  sendOtp: async (req, res, next) => {
    try {
      const { userId } = req;

      const new_otp = otpGenerator.generate(6, {
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
      });

      const otp_expiry_time = Date.now() + 10 * 60 * 1000;

      await User.findByIdAndUpdate(userId, {
        otp: new_otp,
        otp_expiry_time,
      });

      res.status(200).json({
        status: "Success",
        message: "OTP send successfully",
      });
    } catch (error) {
      return res.status(500).json({ msg: err.message });
    }
  },
  verifyOtp: async (req, res, next) => {
    try {
      const { email, otp } = req.body;

      const user = user.findOne({
        email,
        otp_expiry_time: { $gt: Date.now() },
      });

      if (!user) {
        res.status(400).json({
          staus: "error",
          message: "email is invalid or OTP expired",
        });
      }
      if (!(await user.correctOTP(otp, user.otp))) {
        res.status(400).json({
          status: "error",
          message: "OTP is incorrect",
        });
      }

      user.verified = true;
      user.otp = undefined;

      await user.save({ new: true, validateModifyOnly: true });

      const token = signToken(user._id);

      res.status(200).json({
        status: "Success",
        message: "Logged In.",
        token,
      });
    } catch (error) {
      return res.status(500).json({ msg: err.message });
    }
  },
  protect: async (req, res, next) => {
    try {
    } catch (error) {
      return res.status(500).json({ msg: err.message });
    }
  },
  forgotPassword: async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      res.status(400).json({
        status: "error",
        message: "No user with given email address",
      });
    }

    const resetToken = user.createPasswordReetToken();
    const resetURL = `http://tawk.com/auth/reset-password/?code=${resetToken}`;
    try {
      // TODO => send Email
      res.status(200).json({
        status: "success",
        message: "Reset Password link sent to email.",
      });
    } catch (error) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;

      await User.save({ validateBeforeSave: false });
      res.status(500).json({
        status: "error",
        message: "There was an error sending the mail.",
      });
    }
  },
  resetPassword: async (req, res, next) => {
    try {
    } catch (error) {
      return res.status(500).json({ msg: err.message });
    }
  },
};

module.exports = userController;
