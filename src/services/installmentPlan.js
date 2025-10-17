// services/installmentPlan.js
const mongoose = require('mongoose');
const Student = require('../models/User');

class InstallmentPlanService {
    static async updateOfficeInfo(studentId, officeUseInfo) {
        try {
            if (!mongoose.Types.ObjectId.isValid(studentId)) {
                return { status: 400, message: 'Invalid student ID' };
            }

            const scholarship = officeUseInfo?.memfOffice?.scholarship;

            // Generate installments if scholarship info is available
            if (scholarship && scholarship.totalAmount) {
                const monthlyAmount = +(scholarship.totalAmount / 12).toFixed(2);
                const installments = Array.from({ length: 12 }, (_, i) => ({
                    month: `Month ${i + 1}`,
                    amount: monthlyAmount,
                    status: 'unpaid'
                }));

                officeUseInfo.memfOffice.scholarship.installments = installments;
            }

            const student = await Student.findByIdAndUpdate(
                studentId,
                { officeUseInfo },
                { new: true, runValidators: true }
            );

            if (!student) {
                return { status: 404, message: 'Student not found' };
            }

            return { status: 200, data: student };
        } catch (error) {
            return { status: 500, message: error.message };
        }
    }
    static async getInstallmentPlan(studentId) {
        try {
          if (!mongoose.Types.ObjectId.isValid(studentId)) {
            return { status: 400, message: 'Invalid student ID' };
          }
      
          const student = await Student.findById(studentId); // ✅ No populate
      
          if (!student) {
            return { status: 404, message: 'Student not found' };
          }
      
          const scholarship = student.officeUseInfo?.memfOffice?.scholarship;
      
          if (!scholarship || !scholarship.totalAmount) {
            return { status: 400, message: 'Scholarship info not available' };
          }
      
          const plan = (scholarship.installments || []).map(inst => ({
            month: inst.month,
            amount: inst.amount,
            status: inst.status || 'unpaid'
          }));
      
          return {
            status: 200,
            studentId: student._id,
            name: student.name,
            email: student.email,
            grantedFor: scholarship.grantedFor,
            totalAmount: scholarship.totalAmount,
            monthlyInstallments: plan,
          };
        } catch (err) {
          return { status: 500, message: err.message };
        }
      }
      

      static async getAllStudentsInstallmentPlans() {
        try {
          const students = await Student.find({
            'officeUseInfo.memfOffice.scholarship.totalAmount': { $exists: true }
          });
      
          const allPlans = students.map((student) => {
            const scholarship = student.officeUseInfo?.memfOffice?.scholarship;
      
            if (!scholarship || !scholarship.totalAmount) {
              return null;
            }
      
            const installments = scholarship.installments?.map(inst => ({
              month: inst.month,
              amount: inst.amount,
              status: inst.status || 'unpaid'
            })) || [];
      
            return {
              studentId: student._id,
              name: student.name,
              email: student.email,
              grantedFor: scholarship.grantedFor,
              totalAmount: scholarship.totalAmount,
              monthlyInstallments: installments
            };
          }).filter(Boolean); // Remove any null entries
      
          return { status: 200, data: allPlans };
        } catch (err) {
          return { status: 500, message: err.message };
        }
      }
      

    static async updateInstallmentStatus(studentId, month, status) {
        try {
            if (!mongoose.Types.ObjectId.isValid(studentId)) {
                return { status: 400, message: 'Invalid student ID' };
            }

            if (!['paid', 'unpaid'].includes(status)) {
                return { status: 400, message: 'Invalid status value' };
            }

            const student = await Student.findOne({
                _id: studentId,
                'officeUseInfo.memfOffice.scholarship.installments.month': month
            });

            if (!student) {
                return { status: 404, message: 'Student or installment not found' };
            }

            const installments = student.officeUseInfo.memfOffice.scholarship.installments;

            const installment = installments.find(inst => inst.month === month);
            if (!installment) {
                return { status: 404, message: 'Installment month not found' };
            }

            installment.status = status;
            await student.save();

            return { status: 200, message: `Installment for ${month} marked as ${status}`, data: student };
        } catch (err) {
            return { status: 500, message: err.message };
        }
    }


}

module.exports = InstallmentPlanService;
