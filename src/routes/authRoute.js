const router = require("express").Router();
const authController = require("../controllers/authController");
// const { validateRegistration,
//     validateLogin, } = require('../DTO/userDTO');
// const { verifyToken } = require("../middlewares/verification");

//REGISTER
router.post("/register", authController.registeration);

//LOGIN
router.post("/login", authController.login);

// Registeration Verification
router.post("/verifyOtp", authController.otpVerification);

module.exports = router;
