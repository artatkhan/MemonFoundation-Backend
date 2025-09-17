const Tenant = require("../models/Tenant");

class TenantService {
  static async createTenant(req) {
    try {
      const { name, email, phone, address, notes } = req.body;
      const { userId } = req.user;
      const existingTenant = await Tenant.findOne({ email });
      if (existingTenant) {
        return {
          status: 400,
          message: "Tenant with this email already exists",
        };
      }

      const tenant = await Tenant.create({
        name,
        email,
        phone,
        address,
        notes,
        createdBy: userId,
      });

      return { status: 201, data: tenant };
    } catch (error) {
      return { status: 500, message: error.message };
    }
  }

  static async getAllTenants(req) {
    try {
      const { userId } = req.user;
      const tenants = await Tenant.find({
        createdBy: userId,
        isActive: true,
      }).sort({ createdAt: -1 });

      return { status: 200, data: tenants };
    } catch (error) {
      return { status: 500, message: error.message };
    }
  }

  static async getTenantById(req) {
    try {
      const { id } = req.params;
      const { userId } = req.user;

      const tenant = await Tenant.findOne({ _id: id, createdBy: userId });
      if (!tenant) {
        return { status: 404, message: "Tenant not found" };
      }

      return { status: 200, data: tenant };
    } catch (error) {
      return { status: 500, message: error.message };
    }
  }

  static async updateTenant(req) {
    try {
      const { id } = req.params;
      const { userId } = req.user;
      const updateData = req.body;

      if (updateData.email) {
        const existingTenant = await Tenant.findOne({
          email: updateData.email,
          _id: { $ne: id },
        });
        if (existingTenant) {
          return {
            status: 400,
            message: "Email already in use by another tenant",
          };
        }
      }

      const tenant = await Tenant.findOneAndUpdate(
        { _id: id, createdBy: userId },
        { $set: updateData },
        { new: true }
      );

      if (!tenant) {
        return { status: 404, message: "Tenant not found" };
      }

      return { status: 200, data: tenant };
    } catch (error) {
      return { status: 500, message: error.message };
    }
  }

  static async deleteTenant(req) {
    try {
      const { id } = req.params;
      const { userId } = req.user;
      const tenant = await Tenant.findOneAndUpdate(
        { _id: id, createdBy: userId },
        { $set: { isActive: false } },
        { new: true }
      );

      if (!tenant) {
        return { status: 404, message: "Tenant not found" };
      }

      return { status: 200, data: tenant };
    } catch (error) {
      return { status: 500, message: error.message };
    }
  }
}

module.exports = TenantService;
