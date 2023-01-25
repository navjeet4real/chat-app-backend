const mongoose = require('mongoose');
const bcrypt = require("bcrypt")
const userSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: [true, "First Name is required"]
    },
    lastName: {
        type: String,
        required: [true, "Last Name is required"]
    },
    avatar: {
        type: String,
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        validate: {
            validator: function (email){
                return String(email).toLowerCase().match('/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/');
            },
            message: (props) =>  `Email (${props.value})  is invalid!`,
        },
    },
    password: {
        type : String,
    },
    verified: {
        type: Boolean,
        default: false
    },
    passwordChangedAt: {
        type: Date,
    },
    passwordResetToken : {
        type: String,
    },
    passwordResetExpires: {
        type: Date,
    },
    createdAt: {
        type: Date,
    },
    updatedAt: {
        type: Date,
    }
});

userSchema.methods.correctPassword = async function (
    inputPassword,
    userPassword
){
    return await bcrypt.compare(inputPassword, userPassword)
}

const User = new mongoose.model("User", userSchema)

module.exports = User
