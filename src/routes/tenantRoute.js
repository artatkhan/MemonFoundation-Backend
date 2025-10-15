const router = require("express").Router();
const tenantController = require("../controllers/tenantController");
const {
  verifyToken,
  verifyTokenAndAdmin,
} = require("../middlewares/verification");
// const multer = require("multer");
// const upload = multer({ dest: "uploads/tenants/" });

// Create new tenant - Admin only
router.post("/", verifyTokenAndAdmin, tenantController.createTenantAPI);

router.get("/", verifyTokenAndAdmin, tenantController.getAllTenantsAPI);

router.get("/:id", verifyTokenAndAdmin, tenantController.getTenantByIdAPI);

router.put("/:id", verifyTokenAndAdmin, tenantController.updateTenantAPI);

router.delete("/:id", verifyTokenAndAdmin, tenantController.deleteTenantAPI);

module.exports = router;
