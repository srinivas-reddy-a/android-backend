import express from "express";
import expressAsyncHandler from "express-async-handler";
import db from "../config/database.js";
import userJwt from "../middleware/userMiddleware.js";
import multer from "multer";
import multerS3 from 'multer-s3';
import s3Upload from '../middleware/s3Middleware.js';

const kycRouter = express.Router();

const bucketName = process.env.AWS_BUCKET_NAME;





// const storage = multer({
//     storage: multerS3({
//         bucket: bucketName,
//         s3: s3Upload,
//         acl: 'public-read',
//         storageClass: 'REDUCED_REDUNDANCY',
//         serverSideEncryption: 'AES256',
//         contentEncoding: 'gzip',
//         contentType: multerS3.AUTO_CONTENT_TYPE,
//         metadata(req, {fieldname}, cb) {
//             cb(null, {fieldName: fieldname});
//           },
//         key(req, file, cb) {
//         cb(null, Date.now().toString())
//         }
//     })
// })


//to upload multiple files
// const upload = multer({dest:"uploads/"});
// const multiUpload = upload.fields([
//     {name:"GST", maxCount:1},
//     {name:"aadhaar", maxCount:1}
// ])

//custom filename
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, "uploads/");
//     },
//     filename: (req, file, cb) => {
//         cb(null, `${new Date().toISOString().replace(/:/g, '-')}-${file.originalname}`)
//     }
// })

//file filter
const fileFilter = (req, file, cb) => {
    if(file.mimetype.split("/")[0] === "image"){
        cb(null, true);
    }else{
        cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE"), false);
    }
}

const storage = multer.memoryStorage();

const upload = multer({ 
    storage, 
    fileFilter,
    limits: { fileSize:100000, files:2 }
 });

kycRouter.post(
    '/',
    userJwt,
    upload.array("file"),
    expressAsyncHandler(async (req, res) => {     
        const result = await s3Upload(req.files[0]);
        res.status(200).send({
            success:true,
            // urls: files.map(({location, key, mimetype, size}) => ({
            //     url: location,
            //     name: key,
            //     type: mimetype,
            //     size: size
            // }))
            result
        })
    })
)

export default kycRouter;