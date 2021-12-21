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
        otp==1234
        ? db('user').insert({'id':1001, 'phone_number':phoneNumber})
        .then(user => {
            const payload = {
                user: {
                    id: 1001
                }
            }
            jwt.sign(payload, "jwtsecret", {
                expiresIn:360000
            }, (err, token) => {
                if(err) throw err
                res.status(200).send({
                    success: true,
                    token: token
                })
            })
        })
        .catch(err => res.status(400).send("db error"))
        : res.status(401).send({
            success:false,
            message:"invalid otp"
        });
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

userRouter.post('/login/', expressAsyncHandler(async (req, res) => {
    const phoneNumber = req.body.phoneNumber;
    
    db('user').where('phone_number', phoneNumber).select('id')
        .then(user => {
            user.length
            ? res.status(200).send("enter otp")
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
        const { otp } = req.body;
        if(otp==1234){
            const payload = {
                user: {
                    id: 1001
                }
            }
            jwt.sign(payload, "jwtsecret", {
                expiresIn:360000
            }, (err, token) => {
                if(err) throw err
                res.status(200).send({
                    success: true,
                    token: token,
                })
            })
        }else{
            res.status(401).send({
                success: false,
                message: "invalid otp"
            });
        } 
    }))

userRouter.get(
    '/:id',
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
    '',
    userJwt,
    expressAsyncHandler(async (req, res) => {
        db.transaction(trx => {
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
    '/:id/address/',
    userJwt,
    expressAsyncHandler(async (req, res) => {
        const { 
            addressLine1, 
            addressLine2,
            city,
            postalCode,
            country,
            phoneNumber  
        } = req.body;
        try {
            await db('user_address')
            .insert({
                'user_id': req.user.id, 
                'address_line1':addressLine1,
                'address_line2':addressLine2,
                'postal_code':postalCode,
                'phone_number':phoneNumber,
                country,
                city,
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
    '/:id/address/',
    userJwt,
    expressAsyncHandler(async (req, res) => {
        try {
            await db('user_address')
            .where('user_id', '=', req.params.id)
            .select('*')
            .then(address => {
                res.status(200).send({
                    success:true,
                    msg:address
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


userRouter.get(
    '/:id/address/:address_id/',
    userJwt,
    expressAsyncHandler(async (req, res) => {
        try {
            await db('user_address')
            .where('id', '=', req.params.address_id)
            .select('*')
            .then(address => {
                res.status(200).send({
                    success:true,
                    msg:address
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