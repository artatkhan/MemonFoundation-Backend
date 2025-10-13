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

  static async sendPasswordSetupEmail(email, name, setupLink) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Set Your Password - Welcome to the Memon Foundation",
      html: `
  <!DOCTYPE html>
  <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f6f8;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 30px auto;
          background-color: #ffffff;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          padding-bottom: 20px;
        }
        .header h2 {
          color: #004c99;
          margin: 0;
        }
        .content p {
          font-size: 16px;
          color: #333333;
          line-height: 1.6;
        }
        .btn {
          display: inline-block;
          padding: 12px 25px;
          margin-top: 20px;
          background-color: #004c99;
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
        }
        .footer {
          margin-top: 30px;
          font-size: 14px;
          color: #777777;
          text-align: center;
        }
        a {
          color: #004c99;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Welcome to the Memon Foundation</h2>
        </div>
        <div class="content">
          <p>Hi <strong>${name}</strong>,</p>
          <p>You have been registered as a student. To activate your account, please click the button below to set your password:</p>
          <p style="text-align: center;">
            <a class="btn" href="${setupLink}" target="_blank">Set Your Password</a>
          </p>
          <p>This link will expire in <strong>1 hour</strong> for security purposes.</p>
          <p>If you did not request this, please ignore this email or contact support.</p>
        </div>
        <div class="footer">
          <p>Regards,<br/>The Memon Foundation Support Team</p>
        </div>
      </div>
    </body>
  </html>
  `,
    };


    try {
      await transporter.sendMail(mailOptions);
      logger.info(`Password setup link sent to ${email}`);
      return { status: 200, message: "Password setup email sent successfully." };
    } catch (error) {
      logger.error("Failed to send password setup email:", error);
      return { status: 500, message: StaticError.THIRD_PARTY_ERROR };
    }
  }


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
      text: `Your OTP code is ${otp}. It will expire in ${process.env.OTP_EXPIRY_MINUTES || 5
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
