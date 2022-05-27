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
        .then(response =>{
            if(response.data.type==="success"){
                try {
                    db.select('id')
                    .from('user')
                    .orderBy('id', 'desc')
                    .limit(1)
                    .then(id => {
                        const payload = {
                            user: {
                                id: id[0].id+1
                            }
                        }
                        jwt.sign(payload, "jwtsecret", 
                        async (err, token) => {
                            if(err) throw err
                            if(existingUser){
                                db('user')
                                    .where('phone_number', phoneNumber)
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
                                        res.status(400).send(err)
                                    })  
                            }else{
                                await db.transaction(async trx => {
                                    return trx('user')
                                    .where('phone_number', phoneNumber)
                                    .then(async user => {
                                        if(user.length){
                                            return trx('user')
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
                                                res.status(400).send(err)
                                            }) 
                                        }else{
                                            return trx('user')
                                                .insert({
                                                    'id':id[0].id+1,
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
                                                    res.status(400).send(err)
                                                })
                                        }
                                    })
                                })
                                  
                            }
                           
                        
                        })
                    })
                    .catch(err => res.status(400).send(err))
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
                    id: 1
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

userRouter.get(
    '/auth/', 
    userJwt, 
    expressAsyncHandler(async (req, res, next) => {
    try {
        await db('user').where('id', req.user.id).select('*')
        .then(user => {
            res.status(200).send({
                success:true,
                user:user
            })
        })
        .catch(err => {
            res.status(500).send({
                success:false,
                message:'user not found db error'
            })
        })
        
    } catch (error) {
        res.status(500).send({
            success:false,
            message:'Server error'
        })
        next()
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

        }).catch(err => res.status(500).send({
            success:true,
            message:"db error"
        }))
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
                            id: id
                        }
                    }
                    jwt.sign(payload, "jwtsecret", 
                    (err, token) => {
                        if(err) throw err
                        db('user')
                        .where('id', id)
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
                res.status(500).send({
                    success:false,
                    message:'user not found db error'
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
        .catch(err => res.status(400).send({
            success: false,
            message: err
        }))
        
    })
)

userRouter.post(
    '/address/',
    userJwt,
    expressAsyncHandler(async (req, res) => {
        const { 
            address_name,
            addressLine1, 
            addressLine2,
            city,
            postalCode,
            state,
            phoneNumber,
            alternate_number,
            is_default,
        } = req.body;
        try {
            await db('user_address')
            .insert({
                'address_name':address_name,
                'user_id': req.user.id, 
                'address_line1':addressLine1,
                'address_line2':addressLine2,
                'postal_code':postalCode,
                'phone_number':phoneNumber,
                state,
                city,
                alternate_number,
                is_default
            }).then((address) => {
                res.status(201).send({
                    success: true,
                    message: "added new address",
                })
            }).catch(err => {
                res.status(400).send({
                    success: true,
                    message: err
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
            const {id} = req.body;
            await db.transaction(async trx => {
                return trx('user_address')
                .where({
                    id:id
                }).then(async address => {
                    if(address.length){
                        address=address[0];
                        address.address_name= req.body.address_name || address.address_name;
                        address.addressLine1 = req.body.addressLine1 || address.addressLine1;
                        address.addressLine2 = req.body.addressLine2 || address.addressLine2;
                        address.city = req.body.city || address.city;
                        address.postal_code = req.body.postal_code || address.postal_code;
                        address.state = req.body.state || address.state;
                        address.phone_number = req.body.phone_number || address.phone_number;
                        address.alternate_number = req.body.alternate_number || address.alternate_number;
                        address.is_default = req.body.is_default || address.is_default;
                        return trx('user_address')
                        .where({
                            id:id
                        }).update({
                            'address_name':address.address_name,
                            'address_line1':address.addressLine1,
                            'address_line2':address.addressLine2,
                            'postal_code':address.postalCode,
                            'phone_number':address.phoneNumber,
                            'state':address.state,
                            'city':address.city,
                            'alternate_number':address.alternate_number,
                            'is_default':address.is_default
                        }).then((address)=>{
                            res.status(200).send({
                                success:true,
                                message:"Successfully Updated!"
                            })
                        }).catch(err => {
                            res.status(400).send({
                                success:false,
                                message: "No such user/address exists!"
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

export default  userRouter;