const router = require("express").Router();
const userController = require("../controllers/userController");
// const { validateRegistration,
//     validateLogin, } = require('../DTO/userDTO');
const {
  verifyToken,
  verifyTokenAndAdmin,
  verifyTutor,
} = require("../middlewares/verification");

// Only admins can create new users
router.post("/tutor", verifyTokenAndAdmin, userController.createUserAPI);

router.post("/student", verifyTutor, userController.createStudentAPI);

router.put("/update", verifyToken, userController.updateProfileAPI);

router.delete("/remove", verifyToken, userController.removeUserAPI);

router.get("/find", verifyToken, userController.getUserDataAPI);

router.get("/students", verifyTutor, userController.getAllStudentsAPI);

module.exports = router;
