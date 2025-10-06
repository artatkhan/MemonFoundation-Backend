const User = require("../models/User");
const Tenant = require("../models/Tenant");
const EmailService = require("./mailerService");
const bcrypt = require("bcrypt");
const { Types } = require("mongoose");

class UserService {
  static async createTutor(req) {
    try {
      const { name, email, tenantId, username, password } = req.body;

      if (!password) {
        return { status: 400, message: "Password is required" };
      }
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return { status: 400, message: "Email already registered" };
      }
      const tenant = await Tenant.findById(tenantId);
      if (!tenant || !tenant.isActive) {
        return { status: 400, message: "Invalid or inactive tenant" };
      }
      const existingTenantUser = await User.findOne({ tenantId });
      if (existingTenantUser) {
        return {
          status: 400,
          message: "This tenant is already assigned to another user",
        };
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create tutor
      const user = await User.create({
        name,
        email,
        type: "tutor",
        tenantId,
        username,
        password: hashedPassword,
      });

      return {
        status: 201,
        data: user,
        message: "Tutor created successfully.",
      };
    } catch (error) {
      return { status: 500, message: error.message };
    }
  }
  static async createStudent(req) {
    try {
      const { name, email, username, password, tenantId, phone } = req.body;
      // const { tenantId } = req.user;

      if (!password) {
        return { status: 400, message: "Password is required" };
      }
      // if (!tenantId) {
      //   return {
      //     status: 400,
      //     message: "TenantId is required to create a student",
      //   };
      // }
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return { status: 400, message: "Email already registered" };
      }

      const tenant = await Tenant.findById(tenantId);
      if (!tenant || !tenant.isActive) {
        return { status: 400, message: "Invalid or inactive tenant" };
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = await User.create({
        name,
        email,
        type: "student",
        tenantId,
        phone,
        username,
        password: hashedPassword,
      });

      // const otpResponse = await EmailService.sendOTP(email);
      // if (otpResponse.status !== 200) {
      //   return { status: 400, message: "Failed to send verification email" };
      // }

      return {
        status: 201,
        data: user,
        message: "Student created successfully.",
      };
    } catch (error) {
      return { status: 500, message: error.message };
    }
  }
  static async studentsUpdate(req) {
    try {
      const { id } = req.params;
      const { name, email, username, password } = req.body;
      // const { tenantId } = req.user;
      // if (!tenantId) {
      //   return {
      //     status: 400,
      //     message: "TenantId is required to update a student",
      //   };
      // }
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
      const userData = await User.findById(userId).lean();
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
        users = await User.find({ type: "tutor" }).lean();
      } else {
        users = await User.findById(userId).lean();
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
        isActive: true,
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
      const { tenantId } = req.query; // ✅ from query, not params
      const { page = 1, limit = 10 } = req.query;

      if (!tenantId || !Types.ObjectId.isValid(tenantId)) {
        return { status: 400, message: "Invalid or missing tenantId" };
      }

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      const filter = {
        tenantId: new Types.ObjectId(tenantId), // ✅ convert to ObjectId
        type: "student",
        isDeleted: false, // ✅ make sure to exclude deleted users
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
}

module.exports = UserService;
