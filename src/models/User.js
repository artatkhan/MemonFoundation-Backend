const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      trim: true,
    },
    // tenantId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Tenant",
    //   required: function () {
    //     return this.type !== "admin";
    //   },
    // },
    type: {
      type: String,
      enum: ["student", "tutor", "superadmin"],
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
      default: false,
      
    },
    image: {
      type: String,
      default: "",
    },
    phone: {
      type: String,

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
    isDeleted: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",

    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    academicRecords: [{
      class: {
        type: String,
        required: true,
      },
      stream: {
        type: String,
        enum: ["Science", "Commerce", "Arts", "Other"],
        default: "Other",
      },
      schoolName: {
        type: String,
        required: true,
      },
      yearOfPassing: {
        type: String,
        required: true,
      },
      gradeOrPercentage: {
        type: String, // Can handle grades like 'A+' or '85%'
        required: true,
      },
      positionOrRank: {
        type: String,
        default: "", // Optional
      },
    }],
    extracurricularActivities: [{
      activityName: {
        type: String,
      },
      role: {
        type: String,
      },
      timespent: {
        type: String,

      },
      beeninvoled: {
        type: String,
      },
      reciveCertificates: {
        type: String,

      },
    }],
    father: {
      firstName: { type: String },
      middleName: { type: String },
      lastName: { type: String },
      cnicNo: { type: String },
      jamaatName: { type: String },
      jamaatMembershipNo: { type: String },
      profession: { type: String },
      companyName: { type: String },
      designation: { type: String },
      residentialAddress: { type: String },
      mobileNumber: { type: String },
      email: { type: String },
    },

    mother: {
      firstName: { type: String },
      middleName: { type: String },
      lastName: { type: String },
      cnicNo: { type: String },
      jamaatName: { type: String },
      jamaatMembershipNo: { type: String },
      profession: { type: String },
      companyName: { type: String },
      designation: { type: String },
      residentialAddress: { type: String },
      mobileNumber: { type: String },
      email: { type: String },
    },

    selectionNote: {
      type: String,
      default: "",
    },

    numberOfHouseholdMembers: {
      type: Number,
      default: 0,
    },

    familyMembers: [
      {
        name: { type: String },
        relation: { type: String },
      },
    ],

    financialInformation: {
      numberOfEarningMembers: { type: Number },
      earningMemberRelations: [{ type: String }],
      totalMonthlyIncome: { type: Number },
    },


    officeUseInfo: {
      jamaatName: { type: String },
      membershipNumber: { type: String },
      belongsToJamaat: {
        type: String,
        enum: [
          "Mother",
          "Father",
          "Both",
          "None"
        ],
        default: "None",
      },
      supportProvided: {
        type: String,
        enum: [
          "Course and Uniform",
          "No Support"
        ],
      },
      zakatDeserving: { type: Boolean, default: false },

      authorizedSignature: {
        name: { type: String },
        designation: { type: String },
        stamp: { type: String }, // URL or base64 image optional
      },

      channelOfSubmission: {
        type: String,
        enum: [
          "All Pakistan Memon Federation",
          "World Memon Organization",
          "The Pakistan Memon Educational & Welfare Society (Sir Adamjee Institute)",
          "Other"
        ],
      },

      memfOffice: {
        studentCode: { type: String },
        assessmentDate: { type: Date },
        interviewDate: { type: Date },
        decision: {
          type: String,
          enum: ["Approve", "Hold", "Regret"],
        },
        category: {
          type: String,
          enum: ["STAR", "HOPE", "SEED"],
        },
        scholarship: {
          grantedFor: [{ type: String }], // E.g. ["Monthly Fee", "Books"]
          totalAmount: { type: Number },
        },
        panelComments: { type: String },
        reviewPanelSignature: {
          name: { type: String },
          designation: { type: String },
          stamp: { type: String },
        },
      },
    },
  },
  { timestamps: true }
);

// UserSchema.pre("save", function (next) {
//   if (this.type !== "admin" && !this.tenantId) {
//     next(new Error("TenantId is required for non-admin users"));
//   }
//   next();
// });

module.exports = mongoose.model("User", UserSchema);
