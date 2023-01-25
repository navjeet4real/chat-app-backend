const jwt = require("jsonwebtoken");
const User = require("../models/user");

const signToken = (userId) => jwt.sign({userId}, process.env.SECRET_KEY)

const userController = {
    login: async (req, res, next) => {
        try {
          const {email, password} = req.body
            
          if(!email || !password){
            res.status(400).json({
                status: 'error',
                message: "Both are required"
            })
          }

          const userDoc = await User.findOne({email: email}).select("+password");

          if(!userDoc || !(await userDoc.correctPassword(password, userDoc.password))){
            res.staus(400).json({
                status: "error",
                message: "Email or Password is Incorect",
            })
          }

          const token = signToken(userDoc._id);

          res.status(200).json({
            status: "Success",
            message: 'Logged In.',
            token,
          })
         
        } catch (err) {
          return res.status(500).json({ msg: err.message });
        }
      },
};

module.exports = userController;
