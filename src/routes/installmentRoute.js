const InstallmentPlanController = require('../controllers/installment.controller');
const {verifyTokenAndAdmin} = require('../middlewares/verification');
const router = require('express').Router();



router.put('/:id/office-info', verifyTokenAndAdmin, InstallmentPlanController.updateOfficeInfoAPI);
router.get('/:id', verifyTokenAndAdmin, InstallmentPlanController.getAllInstallmentPlansAPI);
router.get('/', verifyTokenAndAdmin, InstallmentPlanController.getAllStudentsInstallmentPlansAPI);
router.put('/:id/installment-status', verifyTokenAndAdmin, InstallmentPlanController.updateInstallmentStatusAPI);


module.exports = router;
