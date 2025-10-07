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
      const { page = 1, limit = 10 } = req.query;
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      const [tenants, total] = await Promise.all([
        Tenant.find({
          createdBy: userId,
          isDeleted:false
        })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum).populate('createdBy', 'name'),
        Tenant.countDocuments({
          createdBy: userId,
          isDeleted:false
        }),
      ]);

      return {
        status: 200,
        data: tenants,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      };
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
      const { tenantId } = req.user; // Using tenantId instead of userId
      const updateData = req.body;

      if (updateData.email) {
        const existingTenant = await Tenant.findOne({
          email: updateData.email,
          _id: { $ne: id },
          tenantId: tenantId, // Check within same tenant/organization
        });
        if (existingTenant) {
          return {
            status: 400,
            message: "Email already in use by another tenant",
          };
        }
      }

      const tenant = await Tenant.findOneAndUpdate(
        { 
          _id: id, 
          tenantId: tenantId // Update based on tenantId, not userId
        },
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
         const user = await Tenant.findById(id);
   
         if (!user) {
           return { status: 404, message: "Tenant not found" };
         }
   
         // Mark the user as deleted (soft delete)
         user.isDeleted = true;
         await user.save();
   
         return { status: 200, message: "Tenant removed (soft deleted) successfully." };
       } catch (error) {
         return { status: 500, message: error.message };
       }
  }
}

module.exports = TenantService;
