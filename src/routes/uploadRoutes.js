// const express = require('express');
// const multer = require('multer');
// const router = express.Router();

// // Configure multer for file uploads
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'uploads/');
//     },
//     filename: (req, file, cb) => {
//         cb(null, Date.now() + '-' + file.originalname);
//     }
// });

// const upload = multer({ 
//     storage: storage,
//     limits: { fileSize: 100 * 1024 * 1024 } // 100 MB
// });

// // Simple upload route for testing
// router.post('/', upload.single('documentFile'), (req, res) => {
//     try {
//         if (!req.file) {
//             return res.status(400).json({ 
//                 status: 400, 
//                 message: 'No file uploaded' 
//             });
//         }

//         // For now, just return success - we'll add S3 upload later
//         return res.status(200).json({
//             status: 200,
//             message: 'File uploaded successfully',
//             data: {
//                 filename: req.file.filename,
//                 path: req.file.path,
//                 size: req.file.size
//             }
//         });
//     } catch (error) {
//         console.error('Upload error:', error);
//         return res.status(500).json({
//             status: 500,
//             message: error.message
//         });
//     }
// });

// // Make sure we're exporting the router
// module.exports = router;