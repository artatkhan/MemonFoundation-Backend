import dotenv from 'dotenv';
import fs from 'fs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import path from 'path';
import { logger } from '../utils/logger.js';

dotenv.config({ path: '../.env' });

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;

if (!accessKeyId) {
    throw new Error('AWS access key is not defined');
}
if (!secretAccessKey) {
    throw new Error('AWS secret key is not defined');
}

const s3 = new S3Client({
    region,
    credentials: {
        accessKeyId,
        secretAccessKey,
    },
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 } // 100 MB
});
const uploadFileToS3 = async (file) => {
    try {
        const fileStream = fs.createReadStream(file.path);
        const uploadParams = {
            Bucket: bucketName,
            Body: fileStream,
            Key: `${file.filename}`,
            ContentType: file.mimetype,
        };

        await s3.send(new PutObjectCommand(uploadParams));

        fs.unlink(file.path, (err) => {
            if (err) {
                console.error(`Error deleting file: ${err}`);
            } else {
            }
        });

        return { message: 'File uploaded successfully', ...uploadParams };
    } catch (error) {
        return { message: `File upload failed: ${error.message}` };
    }
};

const fileUpload = async (req) => {
    const uploadResult = await new Promise((resolve, reject) => {
        upload.single('documentFile')(req, {}, (err) => {
            if (err) return reject({ status: 400, message: err.message });
            resolve({ status: 200 }); // You can add more info if needed
        });
    });

    if (uploadResult.status !== 200) {
        return uploadResult;
    }

    const uploadedFile = req?.file;
    const s3UploadResult = await uploadFileToS3(uploadedFile);
    if (!s3UploadResult || s3UploadResult.message.includes('failed')) {
        return { status: 500, message: 'Error Uploading File' };
    }

    return { status: 200, s3UploadResult };
};


const uploadFileToS3Path = async (filePath) => {
    try {
        const file = fs.readFileSync(path.resolve(__dirname, filePath));
        const uploadParams = {
            Bucket: bucketName,
            Body: file,
            Key: `AI-${path.basename(filePath)}`,
        };

        await s3.send(new PutObjectCommand(uploadParams));

        return {
            status: 200,
            message: `${process.env.AWS_BUCKET_URL + uploadParams.Key}`,
            ...uploadParams,
        };
    } catch (error) {
        logger.log({
            level: 'error',
            message: `Error uploading file to S3: ${error.message}`,
        });
        return { message: 'Error uploading file to S3' };
    }
};

export { fileUpload, uploadFileToS3Path };
