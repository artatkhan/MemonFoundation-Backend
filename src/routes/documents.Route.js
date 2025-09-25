const router = require("express").Router();
const documentController = require("../controllers/documents.controller");
const { verifyToken, verifyTutor } = require("../middlewares/verification");

router.post("/create", verifyTutor, documentController.createDocumentAPI);

router.get("/GetAll", verifyToken, documentController.getAllDocumentsAPI);

router.get("/GetById/:id", verifyToken, documentController.getDocumentByIdAPI);

module.exports = router;