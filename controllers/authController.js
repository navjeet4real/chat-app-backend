const jwt = require("jsonwebtoken");
const User = require("../models/user");


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

          const user = await User.findOne({email: email}).select("+password");

          if(!user){
            res.staus(400).json({
                status: "error",
                message: "Email or Password is Incorect",
            })
          }
         
        } catch (err) {
          return res.status(500).json({ msg: err.message });
        }
      },
};

module.exports = userController;
