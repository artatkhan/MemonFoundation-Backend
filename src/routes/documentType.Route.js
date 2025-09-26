const documentTypeController = require('../controllers/documentType.controller');
const { verifyTokenAndAdmin } = require('../middlewares/verification');
const router = require('express').Router();

router.post('/Doc-type', verifyTokenAndAdmin, documentTypeController.createDocumentTypeAPI);
router.get('/GetAll', documentTypeController.getAllDocumentTypesAPI);
router.get('/Doc-type/:id', verifyTokenAndAdmin, documentTypeController.getDocumentTypeByIdAPI);
router.put('/update/:id', verifyTokenAndAdmin, documentTypeController.updateDocumentTypeAPI);
router.delete('/delete/:id', verifyTokenAndAdmin, documentTypeController.deleteDocumentTypeAPI);
module.exports = router;
