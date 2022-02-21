import express from "express";
import expressAsyncHandler from "express-async-handler";
import db from "../config/database.js";
import jwt from 'jsonwebtoken';
import userJwt from "../middleware/userMiddleware.js";


const userRouter = express.Router();
userRouter.post(
    '/register/', 
    expressAsyncHandler(async (req, res) => {
        const { phoneNumber} = req.body;
        db('user').where('phone_number', phoneNumber).select('id')
        .then(user => {
            user.length
            ? res.status(400).send({
                success:false,
                err:"user already exists with the number!"
            })
            : res.status(200).send({
                success:true,
                message:"enter otp"}
                );
        })
        .catch(err => {
            res.status(500).send({
                success:false,
                message:"data error"
            })
        })
        
}))

userRouter.post(
    '/register/otp/',
    expressAsyncHandler(async (req, res) => {
        const { phoneNumber,otp } = req.body;
        if(otp==1234){
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
                    (err, token) => {
                        if(err) throw err
                        db('user')
                        .insert({
                            'id':id[0].id+1,
                            'phone_number':phoneNumber,
                            'token':token
                        })
                        .then(user => {
                            res.status(200).send({
                                success: true,
                                token: token
                            })
                        })
                    
                    })
                })
                .catch(err => res.status(400).send("db error"))
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
    }))

userRouter.get(
    '/auth/', 
    userJwt, 
    expressAsyncHandler(async (req, res, next) => {
    try {
        await db('user').where('id', req.user.id).select('phone_number')
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
    
    db('user').where('phone_number', phoneNumber).select('id')
        .then(user => {
            user.length
            ? res.status(200).send({
                id:user[0].id,
                message:"enter otp"
            })
            : res.status(400).send("User not registered! Go register");
        })
        .catch(err => res.status(500).send({
            success:true,
            message:"db error"
        }))
}))
    
userRouter.post(
    '/login/otp/',
    expressAsyncHandler(async (req, res) => {
        const { id, otp } = req.body;
        if(otp==1234){
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
            await db('user').where('id', req.user.id).select('phone_number')
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
        await db.transaction(trx => {
            return trx('user')
            .where('id', req.user.id)
            .then(user => {
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

                    }).then(() => {
                        
                        res.status(201).send({
                            success: true,
                            user: user
                        });
                    })
                    
                } else {
                    res.status(400).send({
                        success:false,
                        msg: "No such user exists!"
                    })
                }
            })
            .then(trx.commit)
            .catch(trx.rollback);
        })
        .catch(err => res.status(400).send({
            success: false,
            msg: err
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
            alternate_number
        } = req.body;
        try {
            await db('user_address')
            .insert({
                address_name,
                'user_id': req.user.id, 
                'address_line1':addressLine1,
                'address_line2':addressLine2,
                'postal_code':postalCode,
                'phone_number':phoneNumber,
                state,
                city,
                alternate_number
            }).then((address) => {
                res.status(201).send({
                    success: true,
                    msg: "added new address",
                })
            }).catch(err => {
                res.status(400).send({
                    success: true,
                    msg: err
                })
            })
        } catch (error) {
            res.status(500).send({
                success:false,
                msg:'server error'
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
                    msg:'db error'
                })
            })
        } catch (error) {
            res.status(500).send({
                success:false,
                msg:'user not found db error'
            })
        }
    })
)

//to retrieve individual address
userRouter.get(
    '/address/:id/',
    userJwt,
    expressAsyncHandler(async (req, res) => {
        try {
            await db('user_address')
            .where('id', '=', req.params.id)
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
                    msg:'db error'
                })
            })
        } catch (error) {
            res.status(500).send({
                success:false,
                msg:'user not found db error'
            })
        }
    })
)

export default  userRouter;