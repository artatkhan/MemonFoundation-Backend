// import dotenv from 'dotenv';
// import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
// import multer from 'multer';
// import path from 'path';
// import { logger } from '../utils/logger';

// dotenv.config({ path: '../.env' });

// const bucketName = process.env.AWS_BUCKET_NAME;
// const region = process.env.AWS_BUCKET_REGION;
// const accessKeyId = process.env.AWS_ACCESS_KEY;
// const secretAccessKey = process.env.AWS_SECRET_KEY;

// if (!accessKeyId) {
//     throw new Error('AWS access key is not defined');
// }
// if (!secretAccessKey) {
//     throw new Error('AWS secret key is not defined');
// }

// const s3 = new S3Client({
//     region,
//     credentials: {
//         accessKeyId,
//         secretAccessKey,
//     },
// });

// // Use memory storage instead of disk storage
// const storage = multer.memoryStorage();
// const upload = multer({
//     storage,
//     limits: { fileSize: 100 * 1024 * 1024 } // 100 MB
// });

// const uploadFileToS3 = async (file) => {
//     try {
//         const uploadParams = {
//             Bucket: bucketName,
//             Body: file.buffer, // Use file buffer from memory storage
//             Key: `${file.originalname}`,
//             ContentType: file.mimetype,
//         };

//         await s3.send(new PutObjectCommand(uploadParams));

//         return { 
//             message: 'File uploaded successfully', 
//             key: uploadParams.Key,
//             url: `${process.env.AWS_BUCKET_URL}/${uploadParams.Key}`
//         };
//     } catch (error) {
//         logger.log({
//             level: 'error',
//             message: `Error uploading file to S3: ${error.message}`,
//         });
//         return { message: `File upload failed: ${error.message}` };
//     }
// };

// const fileUpload = async (req) => {
//     try {
//         const uploadResult = await new Promise((resolve, reject) => {
//             upload.single('documentFile')(req, {}, (err) => {
//                 if (err) reject({ status: 400, message: err.message });
//                 resolve({ status: 200 });
//             });
//         });

//         if (uploadResult.status !== 200) {
//             return uploadResult;
//         }

//         const uploadedFile = req?.file;
//         if (!uploadedFile) {
//             return { status: 400, message: 'No file uploaded' };
//         }

//         const s3UploadResult = await uploadFileToS3(uploadedFile);
//         if (!s3UploadResult || s3UploadResult.message.includes('failed')) {
//             return { status: 500, message: 'Error Uploading File' };
//         }
        
//         return { status: 200, ...s3UploadResult };
//     } catch (error) {
//         return { status: error.status || 500, message: error.message };
//     }
// };

// const uploadFileToS3Path = async (filePath) => {
//     try {
//         // Note: This function will still fail in serverless if filePath points to local files
//         // You'll need to adjust this based on where your files are stored
//         const file = fs.readFileSync(path.resolve(__dirname, filePath));
//         const uploadParams = {
//             Bucket: bucketName,
//             Body: file,
//             Key: `AI-${path.basename(filePath)}`,
//         };

//         await s3.send(new PutObjectCommand(uploadParams));

//         return {
//             status: 200,
//             message: `${process.env.AWS_BUCKET_URL}/${uploadParams.Key}`,
//             key: uploadParams.Key,
//         };
//     } catch (error) {
//         logger.log({
//             level: 'error',
//             message: `Error uploading file to S3: ${error.message}`,
//         });
//         return { status: 500, message: 'Error uploading file to S3' };
//     }
// };

// export { fileUpload, uploadFileToS3Path };