const User = require("../models/User");
const Tenant = require("../models/Tenant");
const EmailService = require("./mailerService");
const bcrypt = require("bcrypt");
const { Types, default: mongoose } = require("mongoose");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");



class UserService {
  // static async createTutor(req) {
  //   try {
  //     const { userId } = req.user;
  //     const { name, email, tenantId, username, password } = req.body;

  //     if (!password) {
  //       return { status: 400, message: "Password is required" };
  //     }
  //     const existingUser = await User.findOne({ email });
  //     if (existingUser) {
  //       return { status: 400, message: "Email already registered" };
  //     }
  //     const tenant = await Tenant.findById(tenantId);
  //     if (!tenant || !tenant.isActive) {
  //       return { status: 400, message: "Invalid or inactive tenant" };
  //     }
  //     const existingTenantUser = await User.findOne({ tenantId });
  //     if (existingTenantUser) {
  //       return {
  //         status: 400,
  //         message: "This tenant is already assigned to another user",
  //       };
  //     }

  //     // Hash password
  //     const salt = await bcrypt.genSalt(10);
  //     const hashedPassword = await bcrypt.hash(password, salt);

  //     // Create tutor
  //     const user = await User.create({
  //       name,
  //       createdBy: userId,
  //       email,
  //       type: "tutor",
  //       tenantId,
  //       username,
  //       password: hashedPassword,
  //     });

  //     return {
  //       status: 201,
  //       data: user,
  //       message: "Tutor created successfully.",
  //     };
  //   } catch (error) {
  //     return { status: 500, message: error.message };
  //   }
  // }

  static async createStudent(req) {
    try {
      const {
        name,
        email,
        username,
        phone,

        academicRecords,
        extracurricularActivities,

        father,
        mother,
        selectionNote,
        numberOfHouseholdMembers,
        familyMembers,
        financialInformation,

        officeUseInfo,
      } = req.body;

      if (!email || !name) {
        return { status: 400, message: "Name and Email are required." };
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return { status: 400, message: "Email already registered." };
      }

      // Generate dummy password
      const tempPassword = crypto.randomBytes(10).toString("hex");
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(tempPassword, salt);

      const user = await User.create({
        name,
        email,
        username,
        phone,
        type: "student",
        password: hashedPassword,
        isActive: false,
        isEmailValid: false,
        createdBy: req.user?._id,

        // Add academic & extracurricular
        academicRecords,
        extracurricularActivities,

        // Family & financial info
        father,
        mother,
        selectionNote,
        numberOfHouseholdMembers,
        familyMembers,
        financialInformation,
        // Office use (admin-only fields)
        officeUseInfo,
      });

      return {
        status: 201,
        data: user,
        message: "Student created successfully. Awaiting password setup.",
      };
    } catch (error) {
      return { status: 500, message: error.message };
    }
  }


  static async sendPasswordSetupLink(req) {
    try {
      const { email } = req.body;

      if (!email) {
        return { status: 400, message: "Email is required." };
      }

      const user = await User.findOne({ email });

      if (!user) {
        return { status: 404, message: "Student not found." };
      }

      if (user.type !== "student") {
        return { status: 400, message: "Only students can receive setup links." };
      }

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      const setupLink = `http://localhost:5173/setup-password?token=${token}`;
      const emailResult = await EmailService.sendPasswordSetupEmail(user.email, user.name, setupLink);

      return {
        status: emailResult.status,
        message: emailResult.message,
      };
    } catch (error) {
      return { status: 500, message: error.message };
    }
  }

  static async setPassword(req) {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return { status: 400, message: "Token and new password are required." };
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user) {
        return { status: 404, message: "User not found." };
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      user.password = hashedPassword;
      user.isActive = true;
      await user.save();

      return { status: 200, message: "Password set successfully." };
    } catch (err) {
      logger.error("Set password failed:", err);
      return { status: 500, message: "Invalid or expired token." };
    }
  }

  static async studentsUpdate(req) {
    try {
      const { id } = req.params;
      const { name, email, username, password } = req.body;
      const student = await User.findOne({ _id: id, type: "student" });
      if (!student) {
        return { status: 404, message: "Student not found" };
      }
      if (email && email !== student.email) {
        const existingUser = await
          User.findOne({
            email,
            _id: { $ne: id },
          })
            .lean();
        if (existingUser) {
          return { status: 400, message: "Email already registered" };
        }
        student.email = email;
      }
      if (username) {
        const existingUserName = await User.findOne({
          username,
          _id: { $ne: id },
        }).lean();
        if (existingUserName) {
          return { status: 400, message: "This Username is Already Taken" };
        }
        student.username = username;
      }
      if (name) student.name = name;
      if (password) {
        const salt = await bcrypt.genSalt(10);
        student.password = await bcrypt.hash(password, salt);
      }
      await student.save();
      return { status: 200, data: student, message: "Student updated successfully." };
    } catch (error) {
      return { status: 500, message: error.message };
    }
  }
  static async updateProfile(req) {
    try {
      const { name, username, image } = req.body;
      const { userId } = req.user;
      if (username) {
        const existingUserName = await User.findOne({ username }).lean();
        if (existingUserName)
          return { status: 400, message: "This Username is Already Taken" };
      }
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            username,
            name,
            image,
          },
        },
        {
          new: true,
        }
      );
      if (!updatedUser)
        return { status: 400, message: "Unable to update user profile" };
      return { status: 200, data: updatedUser };
    } catch (error) {
      return { status: 500, message: error.message };
    }
  }

  static async removeUser(req) {
    try {
      const { userId } = req.user;
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            isActive: false,
          },
        },
        {
          new: true,
        }
      );
      return { status: 200, data: updatedUser };
    } catch (error) {
      return { status: 500, message: error.message };
    }
  }

  static async getUserData(req) {
    try {
      const { userId } = req.user;
      const userData = await User.findById(userId).lean().populate('createdBy', 'name');
      if (!userData)
        return { status: 400, message: "Unable to fetch User's Data" };
      return { status: 200, data: userData };
    } catch (error) {
      return { status: 500, message: error.message };
    }
  }
  static async getAllUsers(req) {
    try {
      const { userId, type } = req.user;

      let users;
      if (type === "admin") {
        users = await User.find({ type: "tutor" })
          .populate('createdBy', 'name')
          .populate('tenantId', 'name')
          .populate('updatedBy', 'name')
          .lean(); // Move lean() to the end
      } else {
        users = await User.findById(userId)
          .populate('createdBy', 'name')
          .populate('tenantId', 'name')
          .populate('updatedBy', 'name')
          .lean();
        if (!users) {
          return { status: 400, message: "User not found" };
        }
      }
      return { status: 200, data: users };
    } catch (error) {
      return { status: 500, message: error.message };
    }
  }

  static async getAllStudents(req) {
    try {
      const { tenantId } = req.user;
      const { page = 1, limit = 10 } = req.query;
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;
      const filter = {
        tenantId,
        type: "student",
      };
      const total = await User.countDocuments(filter);
      const students = await User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

      return {
        status: 200,
        data: {
          students,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            pages: Math.ceil(total / limitNum),
          },
        },
      };
    } catch (error) {
      return { status: 500, message: error.message };
    }
  }
  static async getStudentsByTenant(req) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;
      const filter = {
        type: "student",
        isDeleted: false,
      };
      const total = await User.countDocuments(filter);
      const students = await User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

      return {
        status: 200,
        data: {
          students,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            pages: Math.ceil(total / limitNum),
          },
        },
      };
    } catch (error) {
      return { status: 500, message: error.message };
    }
  }


  static async getUserById(req) {
    try {
      const { id } = req.params;
      const user = await User.findById(id).select
        ("-password").populate('tenantId', 'name')
        .lean();
      if (!user) {
        return { status: 404, message: "User not found" };
      }
      return { status: 200, data: user };
    }
    catch (error) {
      return { status: 500, message: error.message };
    }
  }

  static async updateByAdmin(req) {
    try {
      const { id } = req.params;
      const { name, email, username, type, isActive } = req.body;
      const user = await User.findById(id);
      if (!user) {
        return { status: 404, message: "User not found" };
      }
      if (email && email !== user.email) {
        const existingUser = await
          User.findOne({
            email,
            _id: { $ne: id },
          })
            .lean();
        if (existingUser) {
          return { status: 400, message: "Email already registered" };
        }
        user.email = email;
      }
      if (username) {
        const existingUserName = await User.findOne({
          username,
          _id: { $ne: id },
        }).lean();
        if (existingUserName) {
          return { status: 400, message: "This Username is Already Taken" };
        }
        user.username = username;
      }
      if (name) user.name = name;
      if (type) user.type = type;
      if (typeof isActive === "boolean") user.isActive = isActive;
      await user.save();
      return { status: 200, data: user, message: "User updated successfully." };
    } catch (error) {
      return { status: 500, message: error.message };
    }
  }

  static async removeByAdmin(req) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);

      if (!user) {
        return { status: 404, message: "User not found" };
      }

      // Mark the user as deleted (soft delete)
      user.isDeleted = true;
      await user.save();

      return { status: 200, message: "User removed (soft deleted) successfully." };
    } catch (error) {
      return { status: 500, message: error.message };
    }
  }


  static async updateStudentStatus(req) {
    try {
      const { type: userType } = req.user;
      const { studentId } = req.params;
      const { isActive } = req.body;

      // ✅ Allow only superadmin to update status
      if (userType !== 'superadmin') {
        return { status: 403, message: 'Only superadmin can update student status' };
      }

      // ✅ Validate studentId
      if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
        return { status: 400, message: 'A valid student ID is required' };
      }

      // ✅ Find the student within the same tenant
      const student = await User.findOne({
        _id: studentId,
        type: 'student'
      });

      if (!student) {
        return { status: 404, message: 'Student not found' };
      }

      // ✅ Update the active status
      student.isActive = isActive;
      await student.save();

      return {
        status: 200,
        message: `Student ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: {
          studentId: student._id,
          name: student.name,
          email: student.email,
          isActive: student.isActive
        }
      };
    } catch (error) {
      console.error('Error in updateStudentStatusAPI:', error);
      return { status: 500, message: error.message };
    }
  }

}

module.exports = UserService;
