const StaticError = {
    INVALID_OTP: "Invalid OTP",
    INVALID_TOKEN: "Invalid Token",
    INVALID_EMAIL: "Invalid email",
    USER_NOT_FOUND: "User not found",
    USER_EXIST: "User already exist",
    RE_CAPTCHA_ERROR: "You are not human",
    USER_NOT_VERIFIED: "User is not verified",
    RE_CAPTCHA_DTO_ERROR: "Invalid reCAPTCHA",
    INVALID_CONTACT: "Invalid contact number",
    INVALID_CREDENTIALS: "Invalid credentials",
    UNAUTHORIZE: "You are not authorized person",
    INTERNAL_SERVER_ERROR: "Internal server error",
    VERIFY_THROTTLER_ERROR: "Resend OTP after 30 seconds",
    SAME_PASSWORD: "Old password cannot be the new password",
    VERFICATION_TOKEN_EXPIRE: "Your verification time is over",
    VISIT_FORGOT_PASSWORD: "Please visit forgot password page",
    CLOUDINARY_ISSUE: "There is an issue to upload image please try later",
    GLOBAL_THROTTLER_ERROR: "Too many requests. Please try again later",
    LOGIN_THROTTLER_ERROR: "Too many login attempts. Try again in 5 minutes",
    SIGN_IN_THROTTLER_ERROR: "Too many sign-in attempts. Try again in 5 minutes",
    THIRD_PARTY_ERROR: "Our service is down for some reason. Please try again later",
  };
  
  const ExceptionCode = {
    DUPLICATE_KEY: 11000,
    TWILIO_INVALID_OTP: 20404,
    INVALID_PHONE_NUMBER: 20404,
    TWILIO_INVALID_PHONE_NUMBER: 60200,
  };
  
  
  module.exports = {
    StaticError,
    ExceptionCode,
    
  }