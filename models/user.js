const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "First Name is required"],
  },
  lastName: {
    type: String,
    required: [true, "Last Name is required"],
  },
  avatar: {
    type: String,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    validate: {
      validator: function (email) {
        return String(email)
          .toLowerCase()
          .match( /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
      },
      message: (props) => `Email (${props.value})  is invalid!`,
    },
  },
  password: {
    type: String,
  },
  passwordConfirm: {
    type: String
  },
  verified: {
    type: Boolean,
    default: false,
  },
  passwordChangedAt: {
    type: Date,
  },
  passwordResetToken: {
    type: String,
  },
  passwordResetExpires: {
    type: Date,
  },
  otp: {
    type: Number,
  },
  otp_expiry_time: {
    type: Date,
  },
  createdAt: {
    type: Date,
  },
  updatedAt: {
    type: Date,
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("otp")) return next();
  this.otp = bcrypt.hash(this.otp, 12);

  next();
});
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = bcrypt.hash(this.password, 12);

  next();
});
userSchema.methods.correctPassword = async function (
  inputPassword,
  userPassword
) {
  return await bcrypt.compare(inputPassword, userPassword);
};

userSchema.methods.correctOTP = async function (candidateOTP, userOTP) {
  return await bcrypt.compare(candidateOTP, userOTP);
};

userSchema.methods.createPasswordReetToken = async function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

    this.passwordResetExpires = Date.now() + 10*60*1000
  return resetToken;
};

userSchema.methods.chagedPasswordAfter = function (timestamp) {
  return timestamp < this.passwordChangedAt; 
}


const User = new mongoose.model("User", userSchema);

module.exports = User;
