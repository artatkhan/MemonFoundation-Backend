require("dotenv").config();
const nodemailer = require("nodemailer");
const { ExceptionCode, StaticError } = require("../utils/errorMessages");
const { logger } = require("../utils/logger");

const otpStore = new Map(); // temporary in-memory OTP store

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

class EmailService {
  static generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static async sendOTP(email) {
    const otp = this.generateOTP();
    const expiry =
      Date.now() + parseInt(process.env.OTP_EXPIRY_MINUTES || "5") * 60000;

    otpStore.set(email, { otp, expiry });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP code is ${otp}. It will expire in ${
        process.env.OTP_EXPIRY_MINUTES || 5
      } minutes.`,
    };

    try {
      await transporter.sendMail(mailOptions);
      return { status: 200, data: { message: "OTP sent successfully." } };
    } catch (error) {
      logger.error("Failed to send email:", error);
      return { status: 500, message: StaticError.THIRD_PARTY_ERROR };
    }
  }

  static async verifyOTP(email, otp) {
    try {
      const stored = otpStore.get(email);

      if (!stored) {
        return { status: 400, message: "OTP not found. Please request again." };
      }

      if (Date.now() > stored.expiry) {
        otpStore.delete(email);
        return {
          status: 400,
          message: "OTP expired. Please request a new one.",
        };
      }

      if (stored.otp !== otp) {
        return { status: 400, message: "Invalid OTP." };
      }

      otpStore.delete(email); // use-once OTP
      logger.info(`OTP verified for email: ${email}`);
      return { status: 200, data: { message: "OTP verified successfully." } };
    } catch (error) {
      logger.error(`${error.message}`);
      return { status: 500, message: `${error.message}` };
    }
  }

  static async sendEmail(email, subject, body) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject,
        text: body,
      };

      const result = await transporter.sendMail(mailOptions);
      logger.info(`Email sent to ${email}`);
      return { status: 200, data: result };
    } catch (error) {
      logger.error("Email send error:", error);
      return { status: 500, message: StaticError.THIRD_PARTY_ERROR };
    }
  }
}

module.exports = EmailService;
