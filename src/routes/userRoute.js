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

router.post("/student", userController.createStudentAPI);

router.put("/update/:id", verifyToken, userController.updateProfileAPI);

router.delete("/remove", verifyToken, userController.removeUserAPI);

router.get("/find", verifyToken, userController.getUserDataAPI);

router.get("/students", verifyTutor, userController.getAllStudentsAPI);

router.get("/getStudentByAdmin", verifyTokenAndAdmin, userController.getstudentByAdmin);


router.get("/Get-all", verifyTokenAndAdmin, userController.getAllUsersAPI);

router.put("/student-update/:id", verifyToken, userController.studentsUpdateProfileAPI);

router.get("/user/:id", userController.getUserByIdAPI);

router.put("/admin-update/:id", verifyTokenAndAdmin, userController.updateByAdminAPI);

router.delete("/admin-remove/:id", verifyTokenAndAdmin, userController.removeByAdminAPI);

module.exports = router;
