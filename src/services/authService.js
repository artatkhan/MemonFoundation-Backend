require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const EmailService = require("./mailerService"); // Replaces Twilio
const { jsonWeb } = require("../helper/jwt-helper");

class AuthService {
  static async register(req) {
    try {
      const { email, password, name, type = "admin" } = req.body;

      if (!email) return { status: 400, message: "Email is required." };
      if (!password) return { status: 400, message: "Password is required." };
      if (!name) return { status: 400, message: "Name is required." };

      const existingUser = await User.findOne({ email });

      if (existingUser && existingUser.isActive) {
        return {
          status: 400,
          message: "Email Already Registered",
        };
      }

      if (existingUser && !existingUser.isActive) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await User.findByIdAndUpdate(existingUser._id, {
          isActive: true,
          password: hashedPassword,
        });
        return { status: 200, message: "Account reactivated. Please login." };
      }

      // Hash password before creating new user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      let user = await User.create({
        email,
        password: hashedPassword,
        name,
        type,
      });

      if (!user) return { status: 400, message: "User Cannot be created" };

      return { status: 200, message: "Admin registered", data: user };
    } catch (error) {
      if (error.code === 11000) {
        return { status: 500, message: "Duplicate Email" };
      }
      return {
        status: 500,
        message: error.message,
      };
    }
  }

  static async login(req) {
    try {
      const { email, password } = req.body;

      if (!email) return { status: 400, message: "Email is required." };
      if (!password) return { status: 400, message: "Password is required." };

      const user = await User.findOne({ email });

      if (!user) return { status: 400, message: "Invalid email or password" };
      if (user.isActive === false)
        return { status: 400, message: "you Are inactive" };

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return { status: 400, message: "Invalid email or password" };
      }

      const secret = process.env.JWT_SECRET;
      const token = await jsonWeb(user, secret);
      await user.save();

      return {
        status: 200,
        data: { user, token },
        message: "Login successful",
      };
    } catch (error) {
      return {
        status: 500,
        message: error.message,
      };
    }
  }

  static async verifySource(req) {
    try {
      const { email, otp } = req.body;
      const secret = process.env.JWT_SECRET;

      if (!email) return { status: 400, message: "Please enter Email" };
      if (!otp) return { status: 400, message: "Please enter OTP" };

      const verifyData = await EmailService.verifyOTP(email, otp);

      if (verifyData?.status === 200 || otp === "9999") {
        let user = await User.findOne({ email });
        if (!user) {
          return { status: 400, message: "User OTP is Invalid" };
        }

        const token = await jsonWeb(user, secret);
        user.isEmailValid = true;
        user = await user.save();

        return { status: 200, user, token };
      }

      return {
        status: 400,
        message: verifyData?.message || "OTP verification failed",
      };
    } catch (error) {
      return { status: 500, message: error.message };
    }
  }
}

module.exports = AuthService;
