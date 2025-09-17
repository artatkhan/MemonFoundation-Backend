const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      trim: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: function () {
        return this.type !== "admin";
      },
    },
    type: {
      type: String,
      enum: ["student", "tutor", "admin"],
      required: true,
    },
    name: {
      type: String,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    image: {
      type: String,
      default: "",
    },
    isEmailValid: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
  },
  { timestamps: true }
);

UserSchema.pre("save", function (next) {
  if (this.type !== "admin" && !this.tenantId) {
    next(new Error("TenantId is required for non-admin users"));
  }
  next();
});

module.exports = mongoose.model("User", UserSchema);
