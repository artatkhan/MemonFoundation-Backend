// const { logger } = require('../utils/logger');
// const { fileUpload } = require('../helper/fileUpload');
// require('dotenv').config();

// class UploadService {
//      static async uploadFile(req ) {
//         try {
//             const uploadResult = await fileUpload(req);
//             if (uploadResult.status !== 200) {
//                 return { status: 400, message: 'File upload failed' };
//             }
//             let filePath;
//             let fileUrl;

//             if ('s3UploadResult' in uploadResult) {
//                 filePath = uploadResult.s3UploadResult.key;
//                 fileUrl = process.env.AWS_BUCKET_URL + uploadResult.s3UploadResult.key;
//             } else if ('Key' in uploadResult) {
//                 filePath = uploadResult.Key;
//                 fileUrl = process.env.AWS_BUCKET_URL + filePath;
//                 return {
//                     status: 200,
//                     message: 'File uploaded successfully',
//                     data:  fileUrl ,
//                 };
//             } else {
//                 throw new Error('Unexpected upload result format');
//             }
//             return {
//                 status: 200,
//                 message: 'File uploaded successfully',
//                 data: fileUrl ,
//             };
//         } catch (error) {
//             logger.log({
//                 level: 'error',
//                 message: error.message,
//             });
//             return { status: 500, message: error.message };
//         }
//     }
// }

// module.exports = { UploadService };