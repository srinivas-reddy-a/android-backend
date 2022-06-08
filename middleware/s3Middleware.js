import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import dotenv from 'dotenv';

dotenv.config();

const s3Upload = (id, type, file) => {
    const s3 = new S3Client();
    const param = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `kyc/${id}/${type}-${file.originalname}`,
        Body: file.buffer,
    }
    return s3.send(new PutObjectCommand(param))
}

export default s3Upload;