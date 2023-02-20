const jwt = require("jsonwebtoken");
const User = require("../models/user");
const filterObj = require("../utils/filterObj");
const otpGenerator = require("otp-generator");
const crypto = require("crypto");
const { promisify } = require("util");
const signToken = (userId) => jwt.sign({ userId }, process.env.SECRET_KEY);
const mailService = require("../services/mailer");

const authController = {
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;
      // console.log(email, password, "ffffffffffffff");

      if (!email || !password) {
        res.status(400).json({
          status: "error",
          message: "Both are required",
        });
      }

      const userDoc = await User.findOne({ email: email }).select("+password");

      // console.log(userDoc, "userDoc");

      if (
        !userDoc ||
        !(await userDoc.correctPassword(password, userDoc.password))
      ) {
        res.status(400).json({
          status: "error",
          message: "Email or Password is Incorect",
        });
      }

      const token = signToken(userDoc._id);
      console.log(token,"dddddddddddddd")
      res.status(200).json({
        status: "Success",
        message: "Logged In.",
        token,
      });
    } catch (err) {
      // return res.status(500).json({ msg: err.message });
    }
  },
  register: async (req, res, next) => {
    try {
      console.log("hittttttttttt", req.body)
      const { firstName, lastname, email, password } = req.body;

      const filterBody = filterObj(
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

      console.log(new_otp, "New ------- otp")
      const otp_expiry_time = Date.now() + 10 * 60 * 1000;

      const user = await User.findByIdAndUpdate(userId, {
        otp: new_otp.toString(),
        otp_expiry_time,
      });

      user.otp = new_otp.toString();
      await user.save({ new: true, validateModifiedOnly: true });

      mailService
        .sendMail({
          from: "navjeetkajal.2594.com",
          to: user.email,
          subject: "OTP For Login",
          text: `Your OTP is ${new_otp}. This is valid for 10 mins.`,
        })
        .then((response) => {
          console.log(response,"resposne")
          res.status(200).json({
            status: "Success",
            message: "OTP send successfully",
          });
        })
        .catch((err) => {
          console.log(err, "err");
        });

      res.status(200).json({
        status: "Success",
        message: "OTP sent successfully",
      });
    } catch (error) {
      return res.status(500).json({ msg: err.message });
    }
  },
  verifyOtp: async (req, res, next) => {
    try {
      const { email, otp } = req.body;

      const user = await User.findOne({
        email,
        otp_expiry_time: { $gt: Date.now() },
      });

      if (!user) {
        res.status(400).json({
          staus: "error",
          message: "email is invalid or OTP expired",
        });

        return;
      }

      if (user.verified) {
        return res.status(400).json({
          status: "error",
          message: "Email is already verified",
        });
      }

      if (!(await user.correctOTP(otp, user.otp))) {
        res.status(400).json({
          status: "error",
          message: "OTP is incorrect",
        });

        return;
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
      return res.status(500).json({ msg: error.message });
    }
  },
  protect: async (req, res, next) => {
    try {
      // 1)  getting token (jwt) and check if it's available

      let token;

      if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
      ) {
        token = req.headers.authorization.split(" ")[1];
      } else if (req.cookies.jwt) {
      } else {
        res.status(400).json({
          status: "error",
          message: "You are not logged In! Please log in for access.",
        });

        return;
      }

      // 2) verification of token

      const decoded = await promisify(jwt.verify)(
        token,
        process.env.SECRET_KEY
      );

      // 3) check if user still exist

      const this_user = await User.findById(decoded.userId);

      if (!this_user) {
        res.status(400).json({
          status: "error",
          message: "The user belonging to this token does not exist.",
        });
      }

      // 4) check if user cahnged their password after token is issued

      if (this_user.chanedPasswordAfter(decoded.iat)) {
        res.status(400).json({
          status: "error",
          message: "user recently updated password. Please log in again.",
        });
      }

      req.user = this_user;
      next();
    } catch (error) {
      return res.status(500).json({ msg: err.message });
    }
  },
  forgotPassword: async (req, res, next) => {
    // console.log(req.body, "reqqqqqqqqqqqqqqq")
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      res.status(400).json({
        status: "error",
        message: "No user with given email address",
      });
      return;
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    // console.log(resetToken, "reset  ----------------------  Token");
    const resetURL = `http://localhost:3000/auth/new-password/?token=${resetToken}`;
    console.log(resetURL, ":reset URL")
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
      // console.log(req.body,"req.bodyreq.bodyreq.bodyreq.bodyreq.body")
      const hashedToken = crypto
        .createHash("sha256")
        .update(req.body.token)
        .digest("hex");
      // console.log(hashedToken,"hashed -------------- token")
      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
      });

      // console.log(user, "userrrrrrrrrrrrrrr")

      // 2) if token has expired or submission is out of window
      if (!user) {
        res.status(400).json({
          status: "error",
          message: "Token is invalid or Expired",
        });

        return;
      }

      // 3) update user password and set resetToken & expiry to unefined

      user.password = req.body.password;
      user.passwordConfirm = req.body.passwordConfirm;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;

      await user.save();

      // 4) login user and send  new JWT

      // TODO => send an email

      const token = signToken(user._id);

      res.status(200).json({
        status: "Success",
        message: "Password rested successfully.",
        token,
      });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
};

module.exports = authController;
