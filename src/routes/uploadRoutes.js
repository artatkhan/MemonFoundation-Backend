const {
    verifyToken,
  } = require("../middlewares/verification");
  
  const uploadController = require('../controllers/uploadController');
  const router = require("express").Router();
  const multer = require('multer');
  const upload = multer({ dest: 'uploads/' });
  
  
  
  router.post("/image",  upload.array('images', 5), uploadController.addImages);
 
  module.exports = router;