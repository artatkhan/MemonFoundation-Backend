// controllers/installment.controller.js
const InstallmentPlanService = require('../services/installmentPlan');

async function updateOfficeInfoAPI(req, res) {
  try {
    const { id: studentId } = req.params;
    const officeUseInfo = req.body.officeUseInfo;

    if (!officeUseInfo) {
      return res.status(400).json({ message: 'officeUseInfo is required in request body' });
    }

    const result = await InstallmentPlanService.updateOfficeInfo(studentId, officeUseInfo);
    return res.status(result.status).json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getAllInstallmentPlansAPI(req, res) {
  try {
    const { id: studentId } = req.params;
    const result = await InstallmentPlanService.getInstallmentPlan(studentId);
    return res.status(result.status).json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
async function getAllStudentsInstallmentPlansAPI(req, res) {
    try {
      const result = await InstallmentPlanService.getAllStudentsInstallmentPlans();
      return res.status(result.status).json(result);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
  async function updateInstallmentStatusAPI(req, res) {
    const { id } = req.params;
    const { month, status } = req.body;
  
    const result = await InstallmentPlanService.updateInstallmentStatus(id, month, status);
    return res.status(result.status).json(result);
  }
  
  

module.exports = {
  updateOfficeInfoAPI,
  getAllInstallmentPlansAPI,
  getAllStudentsInstallmentPlansAPI,
  updateInstallmentStatusAPI
};
