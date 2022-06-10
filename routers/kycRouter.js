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
    if(file.mimetype.split("/")[0] === "image" || file.mimetype.split("/")[0] === "application"){
        cb(null, true);
    }else{
        cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE"), false);
    }
}

const storage = multer.memoryStorage();

const upload = multer({ 
    storage, 
    fileFilter,
    limits: { fileSize:10000000, files:1 }
 });

//  upload.single - for one file
//  upload.array - for multiple files

kycRouter.put(
    '/',
    userJwt,
    upload.array("file"),
    expressAsyncHandler(async (req, res) => {     
        const {type, num} = req.body;
        try {
            await s3Upload(req.user.id, type, req.files[0])
            .then(async (response) => {
                if(response.$metadata.httpStatusCode==200){
                    if(!type.localeCompare("gst")){
                        await db('user')
                        .where('id',req.user.id)
                        .update({
                            gst:num,
                            gsturl: `kyc/${req.user.id}/${type}-${req.files[0].originalname}-${new Date()}`,
                            modified_at: new Date()
                        })
                        .then((i) => {
                            res.status(200).send({
                                success: true,
                                message: "Uploaded successfully."
                            })
                        }).catch(err => {
                            res.status(400).send({
                                success: false,
                                message: "db error"
                            })
                        })
                    }else{
                        await db('user')
                        .where('id',req.user.id)
                        .update({
                            pan:num,
                            panurl: `kyc/${req.user.id}/${type}-${req.files[0].originalname}-${new Date()}`,
                            modified_at: new Date()
                        })
                        .then((i) => {
                            res.status(200).send({
                                success: true,
                                message: "Uploaded successfully."
                            })
                        }).catch(err => {
                            res.status(400).send({
                                success: false,
                                message: "db error"
                            })
                        })
                    }
                }else{
                    res.status(400).send({
                        success: false,
                        message:"s3 status error"
                    })
                }
            }).catch(err => {
                res.status(400).send({
                    success: false,
                    message: "s3 error"
                })
            })
            // res.status(200).send({
            //     success:true,
            //     // urls: files.map(({location, key, mimetype, size}) => ({
            //     //     url: location,
            //     //     name: key,
            //     //     type: mimetype,
            //     //     size: size
            //     // }))
            //     result
            // })
            
        } catch (error) {
            res.status(500).send({
                success:false,
                message:"Internal Server Error"
            })
        }
    })
)



kycRouter.put(
    '/license/',
    userJwt,
    upload.array("file"),
    expressAsyncHandler(async (req, res) => {     
        const {type, date} = req.body;
            try {
                await s3Upload(req.user.id, type, req.files[0])
                .then(async (response) => {
                    if(response.$metadata.httpStatusCode==200){
                        if(!type.localeCompare("pest")){
                            await db('user')
                                .where('id',req.user.id)
                                .update({
                                    pesticide_license_url : `kyc/${req.user.id}/${type}-${req.files[0].originalname}-${new Date()}`,
                                    pesticide_license_expiry : date,
                                    modified_at: new Date(),
                                    kyc_status: "IR"
                                })
                                .then((i) => {
                                    res.status(200).send({
                                        success: true,
                                        message: "Uploaded successfully."
                                    })
                                }).catch(err => {
                                    res.status(400).send({
                                        success: false,
                                        message: "db error"
                                    })
                                })
                        }else if(!type.localeCompare("fert")){
                            await db('user')
                                .where('id',req.user.id)
                                .update({
                                    fertilizer_license_url : `kyc/${req.user.id}/${type}-${req.files[0].originalname}-${new Date()}`,
                                    fertilizer_license_expiry : date,
                                    modified_at: new Date(),
                                    kyc_status: "IR"
                                })
                                .then((i) => {
                                    res.status(200).send({
                                        success: true,
                                        message: "Uploaded successfully."
                                    })
                                }).catch(err => {
                                    res.status(400).send({
                                        success: false,
                                        message: "db error"
                                    })
                                })
                            
                        }else if(!type.localeCompare("seed")){
                            await db('user')
                                .where('id',req.user.id)
                                .update({
                                    seed_license_url : `kyc/${req.user.id}/${type}-${req.files[0].originalname}-${new Date()}`,
                                    seed_license_expiry : date,
                                    modified_at: new Date(),
                                    kyc_status: "IR"
                                })
                                .then((i) => {
                                    res.status(200).send({
                                        success: true,
                                        message: "Uploaded successfully."
                                    })
                                }).catch(err => {
                                    res.status(400).send({
                                        success: false,
                                        message: "db error"
                                    })
                                })
                        }
                    }else{
                        res.status(400).send({
                            success: false,
                            message:"s3 status error"
                        })
                    }
                }).catch(err => {
                    res.status(400).send({
                        success: false,
                        message: "s3 error"
                    })
                })
                // res.status(200).send({
                //     success:true,
                //     // urls: files.map(({location, key, mimetype, size}) => ({
                //     //     url: location,
                //     //     name: key,
                //     //     type: mimetype,
                //     //     size: size
                //     // }))
                //     result
                // })
                
            } catch (error) {
                res.status(500).send({
                    success:false,
                    message:"Internal Server Error"
                })
            }     
    })
)


kycRouter.get(
    '/',
    userJwt,
    expressAsyncHandler(async (req, res) => {
        try {
            await db('user')
            .where('id', req.user.id)
            .select('kyc_status')
            .then((kyc_status) => {
                res.status(200).send({
                    success:true,
                    kyc_status: kyc_status[0].kyc_status
                })
            }).catch(err => {
                res.status(400).send({
                    success:false,
                    message:"db error"
                })
            })
        } catch (error) {
            res.status(500).send({
                success:false,
                message:"Internal Server Error"
            })
        }
    })
)

export default kycRouter;