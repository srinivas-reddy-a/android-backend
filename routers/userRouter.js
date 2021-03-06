import express, { response } from "express";
import expressAsyncHandler from "express-async-handler";
import db from "../config/database.js";
import jwt from 'jsonwebtoken';
import userJwt from "../middleware/userMiddleware.js";
import axios from "axios";
import dotenv from 'dotenv';

dotenv.config()
const authkey = process.env.AUTH_KEY;
const msg91_template_id = process.env.TEMPLATE_ID_MSG91;
const otp_length = process.env.OTP_LENGTH;
const unicode = process.env.UNICODE;

const userRouter = express.Router();
userRouter.post(
    '/register/', 
    expressAsyncHandler(async (req, res) => {
        const { phoneNumber} = req.body;
        let existingUser = false;
        try {
            await db('user').where('phone_number', phoneNumber).select('id')
            .then(async user => {
                if(user.length){
                    existingUser = true;
                }
                await axios.get(`https://api.msg91.com/api/v5/otp?template_id=${msg91_template_id}&mobile=91${phoneNumber}&authkey=${authkey}&otp_length=${otp_length}&unicode=${unicode}`)
                .then(response => {
                    if(response.data.type === "success"){
                        res.status(200).send({
                            success:true,
                            existingUser:existingUser,
                            message:"enter otp"
                        })
                    }else{
                        res.status(400).send({
                            success:false,
                            existingUser:existingUser,
                            message:"otp error"
                        })
                    }
                }).catch(err => {
                    res.status(400).send({
                        success:false,
                        existingUser:existingUser,
                        message:"otp error"
                    })
                })
            }).catch(err => {
                res.status(400).send({
                    success:false,
                    existingUser:existingUser,
                    message:"data error"
                })
            })
        } catch (error) {
            res.status(500).send({
                success:false,
                existingUser:existingUser,
                message:"server error"
            })
        }
        
}))

userRouter.post(
    '/register/otp/resend/',
    expressAsyncHandler(async (req, res) => {
        const { phoneNumber} = req.body;
        let existingUser = false;
        try {
            await db('user').where('phone_number', phoneNumber).select('id')
            .then(async user => {
                if(user.length){
                    // res.status(400).send({
                    //     success:false,
                    //     err:"user already exists with the number!"
                    // })
                    existingUser = true;
                }
                await axios.get(`https://api.msg91.com/api/v5/otp/retry?authkey=${authkey}&retrytype=text&mobile=91${phoneNumber}`)
                .then(response => {
                    if(response.data.type === "success"){
                        res.status(200).send({
                            success:true,
                            existingUser:existingUser,
                            message:"enter otp"
                        })
                    }else{
                        res.status(400).send({
                            success:false,
                            existingUser:existingUser,
                            message:"otp error"
                        })
                    }
                }).catch(err => {
                    res.status(400).send({
                        success:false,
                        existingUser:existingUser,
                        message:"otp error"
                    })
                })
            }).catch(err => {
                res.status(400).send({
                    success:false,
                    existingUser:existingUser,
                    message:"data error"
                })
            })
        } catch (error) {
            res.status(500).send({
                success:false,
                existingUser:existingUser,
                message:"server error"
            })
        }
    })

)

userRouter.post(
    '/register/otp/',
    expressAsyncHandler(async (req, res) => {
        const { phoneNumber, otp, existingUser } = req.body;
        await axios.get(`https://api.msg91.com/api/v5/otp/verify?authkey=${authkey}&mobile=91${phoneNumber}&otp=${otp}`)
        .then(async response =>{
            if(response.data.type==="success"){
                try {
                    await db('user')
                        .where('phone_number', phoneNumber)
                        .then(async user => {
                            if(user.length){
                                const payload = {
                                    user: {
                                        id:user[0].id
                                    }
                                }
                                jwt.sign(payload, "jwtsecret", 
                                async (err, token) => {
                                    if(err) throw err        
                                    await db('user')
                                    .where('phone_number', phoneNumber)
                                    .update({
                                        'token':token,
                                        'last_signed_in_at':new Date()
                                    })
                                    .then(user => {
                                        res.status(200).send({
                                            success: true,
                                            token: token
                                        })
                                    })
                                    .catch(err => {
                                        res.status(400).send({
                                            success: false,
                                            message: "db error"
                                        })
                                    }) 
                                })
                            }else{
                                await db('user')
                                .select('id')
                                .orderBy('id','desc')
                                .then(id => {
                                    const payload = {
                                        user: {
                                            id:id[0].id+1
                                        }
                                    }
                                    jwt.sign(payload, "jwtsecret", 
                                        async (err, token) => {
                                            if(err) throw err   
                                            await db('user')
                                                .insert({
                                                    'id':payload.user.id,
                                                    'phone_number':phoneNumber,
                                                    'token':token,
                                                    'created_at':new Date(),
                                                    'last_signed_in_at':new Date()
                                                }).then(user => {
                                                    res.status(200).send({
                                                        success: true,
                                                        token: token
                                                    })
                                                }).catch(err => {
                                                    res.status(400).send({
                                                        success: false,
                                                        message: "db error"
                                                    })
                                                })
                                        })
                                    })
                                        
                                
                            }
                        })
            
                } catch (error) {
                    res.status(500).send({
                        success:false,
                        message:"internal error"
                    });
                }
                
            }
            else{
                res.status(401).send({
                    success:false,
                    message:"invalid otp"
                });
            }
        })
        
    }))

userRouter.post(
    '/token/',
    expressAsyncHandler(async (req, res) =>{
        try {
            const payload = {
                user: {
                    id:req.user.id
                }
            }
            jwt.sign(payload, "jwtsecret", 
                (err, token) => {
                    res.status(200).send({
                        success:true,
                        token:token
                    })
                })
        } catch (error) {
            res.status(401).send({
                success:false,
                message:"internal error"
            });
        }
    })
)

userRouter.post(
    '/auth/',
    expressAsyncHandler(async (req, res, next) => {
        const token = req.body.token;
        if(!token){
            return res.status(403).send({
                message:'no token, unauthorised'
            })
        }
        //save jwtsecret in .env
        try {
            await jwt.verify(token, "jwtsecret", async (err, decoded) => {
                if(err){
                    res.status(403).send({
                        success:false,
                        message:"User not authenticated!"
                    })
                } else{
                    try {
                        await db('user').where('id', decoded.user.id).select('token')
                        .then(user => {
                            // -1 if sorted before
                            // 1 if sorted after
                            // 0 if equal
                            if(!user[0].token.localeCompare(token)){
                                res.status(200).send({
                                    success:true,
                                    message:"User authenticated!"
                                })
                            }else{
                                res.status(403).send({
                                    success:false,
                                    message:"User not authenticated!"
                                })
                            }

                        })
                        .catch(err => {
                            res.status(400).send({
                                success:false,
                                message:'db error'
                                })
                        })
                        
                    } catch (error) {
                        res.status(500).send({
                            success:false,
                            message:'Server error'
                        })
                    }
                }
            })
        } catch (error) {
            res.status(500).send({
                message: 'server error'
            })
        }
    
}))

userRouter.post(
    '/login/', 
    expressAsyncHandler(async (req, res) => {
    const phoneNumber = req.body.phoneNumber;
    try {
        await db('user').where('phone_number', phoneNumber).select('id')
        .then(async user => {
            if(user.length){
                await axios.get(`https://api.msg91.com/api/v5/otp?template_id=${msg91_template_id}&mobile=91${phoneNumber}&authkey=${authkey}&otp_length=${otp_length}&unicode=${unicode}`)
                .then(response => {
                    if(response.data.type === "success"){
                        res.status(200).send({
                            success:true,
                            id:user[0].id,
                            message:"enter otp"
                        })
                    }else{
                        res.status(400).send({
                            success:false,
                            message:"otp error"
                        })
                    }
                })
            }else{
                res.status(400).send("User not registered! Go register");
            }

        }).catch(err => {
            res.status(400).send({
                success:false,
                message:'db error'
                })
        })
    } catch (error) {
        res.status(500).send({
            success:false,
            message:"server error"
        })
    }   
}))
    
userRouter.post(
    '/login/otp/resend/',
    expressAsyncHandler(async (req, res) => {
        const phoneNumber = req.body.phoneNumber;
        try {
            await db('user').where('phone_number', phoneNumber).select('id')
            .then(async user => {
                if(user.length){
                    await axios.get(`https://api.msg91.com/api/v5/otp/retry?authkey=${authkey}&retrytype=text&mobile=91${phoneNumber}`)
                    .then(response => {
                        if(response.data.type === "success"){
                            res.status(200).send({
                                success:true,
                                message:"enter otp"
                            })
                        }else{
                            res.status(400).send({
                                success:false,
                                message:"otp error"
                            })
                        }
                    }).catch(err => {
                        res.status(400).send({
                            success:false,
                            message:"otp error"
                        })
                    })
                }else{
                    res.status(400).send({
                        success:false,
                        err:"User not registered! Go register"
                    })
                    
                }
            }).catch(err => {
                res.status(400).send({
                    success:false,
                    message:"data error"
                })
            })
        } catch (error) {
            res.status(500).send({
                success:false,
                message:"server error"
            })
        }
    })
)


//to verify login
userRouter.post(
    '/login/otp/',
    expressAsyncHandler(async (req, res) => {
        const { id, otp,phoneNumber } = req.body;
        await axios.get(`https://api.msg91.com/api/v5/otp/verify?authkey=${authkey}&mobile=91${phoneNumber}&otp=${otp}`)
        .then(response => {
            if(response.data.type==="success"){
                try {
                    const payload = {
                        user: {
                            phoneNumber:phoneNumber
                        }
                    }
                    jwt.sign(payload, "jwtsecret", 
                    (err, token) => {
                        if(err) throw err
                        db('user')
                        .where('phone_Number', phoneNumber)
                        .update({
                            'token':token
                        })
                        .then(user => {
                            res.status(200).send({
                                success: true,
                                token: token
                            })
                        })
                        .catch(err => {
                            res.status(400).send("db error")
                        })  
                    })     
                } catch (error) {
                    res.status(401).send({
                        success:false,
                        message:"internal error"
                    });
                }      
            }
            else{
                res.status(401).send({
                    success:false,
                    message:"invalid otp"
                });
            }
        })
        
    }))


userRouter.post(
    '/logout/',
    userJwt,
    expressAsyncHandler(async (req, res) =>{
        try {
            db('user')
            .where('id', req.user.id)
            .update({
                'token':null
            })
            .then(()=>{
                res.status(200).send({
                    success:true,
                    message:"Logged out!"
                })
            })
        } catch (error) {
            res.status(500).send({
                success:false,
                message:'Server error'
            })
        }
    })
)

userRouter.get(
    '/',
    userJwt,
    expressAsyncHandler(async (req, res) => {
        try {
            await db('user').where('id', req.user.id)
            .select('phone_number', 'name', 'email')
            .then(user => {
                res.status(200).send({
                    success:true,
                    user:user
                })
            })
            .catch(err => {
                res.status(400).send({
                    success:false,
                    message:'db error'
                })
            })
            
        } catch (error) {
            res.status(500).send({
                success:false,
                message:'Server error'
            })
            
        }
    }))


userRouter.put(
    '/',
    userJwt,
    expressAsyncHandler(async (req, res) => {
        await db.transaction(async trx => {
            return trx('user')
            .where('id', req.user.id)
            .then(async user => {
                if(user.length){
                    user = user[0]; 
                    user.phone_number= req.body.phoneNumber || user.phone_number;
                    user.email= req.body.email || user.email;
                    user.name= req.body.name || user.name;
                    return trx('user')
                    .where('id', req.user.id)
                    .update({
                        id:req.user.id,
                        phone_number:user.phone_number,
                        email: user.email,
                        name: user.name,
                        modified_at:new Date()
                    }).then(() => {
                        res.status(201).send({
                            success: true,
                            message: "Profile Updated!"
                        });
                    })
                    
                } else {
                    res.status(400).send({
                        success:false,
                        message: "No such user exists!"
                    })
                }
            })
            .then(trx.commit)
            .catch(trx.rollback);
        })
        .catch(err => {
            res.status(400).send({
                success:false,
                message:'db error'
            })
        })
        
    })
)

userRouter.post(
    '/address/',
    userJwt,
    expressAsyncHandler(async (req, res) => {
        const { 
            address_name,
            address_line1,
            city,
            postal_code,
            state,
            phone_number,
            gst,
            pan
        } = req.body;
        try {
            await db('user_address')
            .insert({
                'address_name':address_name,
                'user_id': req.user.id, 
                'address_line1':address_line1,
                'postal_code':postal_code,
                'phone_number':phone_number,
                state,
                city,
                gst,
                pan,
                'kyc_status':'IR'
            }).then((address) => {
                res.status(201).send({
                    success: true,
                    message: "Submitted Successfully!",
                })
            }).catch(err => {
                res.status(400).send({
                    success:false,
                    message:'db error'
                })
            })
        } catch (error) {
            res.status(500).send({
                success:false,
                message:'server error'
            })
        }
    }))

userRouter.get(
    '/address/',
    userJwt,
    expressAsyncHandler(async (req, res) => {
        try {
            await db('user_address')
            .where('user_id', '=', req.user.id)
            .select(
                'address_name',
                'user_id',
                'address_line1',
                'postal_code',
                'phone_number',
                'city',
                'state',
                'gst',
                'pan',
                'kyc_status'
            )
            .then(address => {
                res.status(200).send({
                    success:true,
                    address:address
                })
            })
            .catch(err => {
                res.status(400).send({
                    success:false,
                    message:'db error'
                })
            })
        } catch (error) {
            res.status(500).send({
                success:false,
                message:'user not found db error'
            })
        }
    })
)

//to retrieve individual address
userRouter.get(
    '/address/default/',
    userJwt,
    expressAsyncHandler(async (req, res) => {
        try {
            await db('user_address')
            .where({
                user_id:req.user.id,
                is_default:1
            })
            .select('*')
            .then(address => {
                res.status(200).send({
                    success:true,
                    address:address
                })
            })
            .catch(err => {
                res.status(400).send({
                    success:false,
                    message:'db error'
                })
            })
        } catch (error) {
            res.status(500).send({
                success:false,
                message:'server error'
            })
        }
    })
)

userRouter.put(
    '/address/',
    userJwt,
    expressAsyncHandler(async (req, res) => {
        try {
            const id = req.user.id;
            await db.transaction(async trx => {
                return trx('user_address')
                .where({
                    user_id:id
                }).then(async address => {
                    if(address.length){
                        address=address[0];
                        address.address_name= req.body.address_name || address.address_name;
                        address.address_line1 = req.body.address_line1 || address.address_line1;
                        address.city = req.body.city || address.city;
                        address.postal_code = req.body.postal_code || address.postal_code;
                        address.state = req.body.state || address.state;
                        address.phone_number = req.body.phone_number || address.phone_number;
                        address.gst = req.body.gst || address.gst;
                        address.pan = req.body.pan || address.pan;
                        return trx('user_address')
                        .where({
                            user_id:id
                        }).update({
                            'address_name':address.address_name,
                            'address_line1':address.address_line1,
                            'postal_code':address.postal_code,
                            'phone_number':address.phone_number,
                            'state':address.state,
                            'city':address.city,
                            'gst':address.gst,
                            'pan':address.pan
                        }).then((address)=>{
                            res.status(200).send({
                                success:true,
                                message:"Successfully Updated!"
                            })
                        }).catch(err => {
                            res.status(400).send({
                                success:false,
                                message:'db error'
                            })
                        })
                    }
                })
            })
        } catch (error) {
            res.status(500).send({
                success:false,
                message:'Server error'
            })
        }
    })
)

userRouter.delete(
    '/address/:id/',
    userJwt,
    expressAsyncHandler(async (req, res)=>{
        try {
            const id = req.params.id;
            await db('user_address')
            .where({
                id:id
            }).del()
            .then(() => {
                res.status(200).send({
                    success: true,
                    message: "deleted"
                });
            }).catch(err => {
                res.status(400).send({
                    success:false,
                    message: "No such user/address exists!"
                })
            })
        } catch (error) {
            res.status(500).send({
                success:false,
                message:'Server error'
            })
        }
    })
)
userRouter.put(
    '/address/default/',
    userJwt,
    expressAsyncHandler(async (req, res) => {
        const{ id } = req.body;
        try {
            await db.transaction(async trx => {
                return trx('user_address')
                .where({
                    user_id:req.user.id,
                    is_default:1
                }).update({
                    is_default:0
                }).then(async (address) => {
                    return trx('user_address')
                    .where({
                        id:id
                    }).update({
                        'is_default':1
                    }).then((address) => {
                        res.status(200).send({
                            success:true,
                            address:address
                        })
                    }).catch(err => {
                        res.status(400).send({
                            success:false,
                            message: "No such user/address exists!"
                        })
                    })
                }).catch(err => {
                    res.status(400).send({
                        success:false,
                        message: "No such user exists!"
                    })
                })
            })
        } catch (error) {
            res.status(500).send({
                success:false,
                message:'Server error'
            })
        }
    })
)

userRouter.get(
    '/address/:id/',
    userJwt,
    expressAsyncHandler(async (req, res) => {
        const address_id = req.params.id;
        try {
            await db('user_address')
            .where({
                'id':address_id
            }).select('*')
            .then(async (address) => {
                res.status(200).send({
                    success:true,
                    address:address
                })
            }).catch(err => {
                res.status(400).send({
                    success:false,
                    message:"No user/address found!"
                })
            })
        } catch (error) {
            res.status(500).send({
                success:false,
                message:"Server error!"
            })
        }
    })
)

userRouter.put(
    '/community/register/',
    userJwt,
    expressAsyncHandler(async (req, res) => {
        const {aadhaar,name} = req.body;
        try {
            await db('user')
            .where({
                id:req.user.id
            }).update({
                is_pradhaan:1,
                aadhaar:aadhaar,
                name:name
            }).then(user => {
                res.status(200).send({
                    success:true,
                    message:"Registered Successfully, We will get back to you!"
                })
            }).catch(err => {
                res.status(400).send({
                    success:false,
                    message: "Not registered/db error"
                })
            })
        } catch (error) {
            res.status(500).send({
                success:false,
                message:"server error!"
            })
        }
    })
)

userRouter.get(
    '/community/register/',
    userJwt,
    expressAsyncHandler(async (req, res) => {
        try {
            await db('user')
            .where({
                'id':req.user.id
            }).select('is_pradhaan')
            .then(user => {
                if(user[0].is_pradhaan){
                    res.status(200).send({
                        success:true,
                        message:"Already Registered!"
                    })
                }else{
                    res.status(200).send({
                        success:true,
                        message:"Not Registered!"
                    })
                }
                
            }).catch(err => {
                res.status(400).send({
                    success:false,
                    message:"db error"
                })
            })
        } catch (error) {
            res.status(500).send({
                success:false,
                message:"server error!"
            })
        }
    })
)

export default userRouter;