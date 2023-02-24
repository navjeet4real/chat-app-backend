const router = require('express').Router();
const authController = require('../controllers/authController');
const userController = require("../controllers/userController")


router.patch('/update-me', authController.protect ,userController.updateMe)
router.post("/get_users", authController.protect, userController.getUsers)
module.exports = router;