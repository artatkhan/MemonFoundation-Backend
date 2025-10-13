const studentEmailAdminController = require("../controllers/studentsendemail.controller");
const { verifyTokenAndAdmin, verifyToken } = require("../middlewares/verification");
const router = require("express").Router();




router.post("/send-email",verifyToken, studentEmailAdminController.sendEmailToAdminAPI);

router.get("/get-all-emails",verifyTokenAndAdmin,studentEmailAdminController.getAllStudentEmailsAPI
);
router.get("/get-email/:id",verifyTokenAndAdmin,studentEmailAdminController.getStudentEmailByIdAPI
);

module.exports = router;