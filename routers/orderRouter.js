import express from "express";
import expressAsyncHandler from "express-async-handler";
import db from "../config/database.js";
import userJwt from "../middleware/userMiddleware.js";
import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import hmacSHA512 from 'crypto-js/hmac-sha512.js';
import Base64 from 'crypto-js/enc-base64.js';
import crypto from 'crypto';

dotenv.config()

const orderRouter = express.Router();


// var date = order[0].created_at;
//timestamp to date conversion
orderRouter.post(
    '/',
    userJwt,
    expressAsyncHandler(async (req,res) => {
        const {
            total,
            savings,
            address_id,
            payment_type,
            is_paid,
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature
        } = req.body;
        
        try {
            
            await db('order')
            .insert({
                'user_id': req.user.id,
                address_id,
                total,
                savings,
                payment_type,
                is_paid,
                razorpay_payment_id,
                razorpay_order_id,
                razorpay_signature,
                'created_at':new Date(),
                'modified_at':new Date(),
            }).then(order => {
                res.status(201).send({
                    success:true,
                    message:"Order Placed Successfully!"
                })
            }).catch(err => {
                res.status(400).send({
                    success:false,
                    message: "db error"
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


orderRouter.post(
    '/detail/',
    expressAsyncHandler(async (req, res) => {
        const {razorpay_payment_id, razorpay_signature} = req.body;
        const hmac = crypto.createHmac('sha256', process.env.RZP_KEY_SECRET);
        hmac.update("order_KHfxEaEmh9MnM5" + "|" + razorpay_payment_id);
        let generated_signature = hmac.digest('hex');
        if (generated_signature == razorpay_signature) {
            console.log("payment is successful");
        }else{
            console.log("not verified");
        }
        // const {
        //     order_id,
        //     product_id,
        //     quantity,
        //     volume,
        //     price,
        //     discount
        // } = req.body
        // try {
        //     const date = new Date();
        //     const dDate = new Date(date.setDate(date.getDate()+1))
        //     await db('order_details')
        //     .insert({
        //         order_id,
        //         'products_id':product_id,
        //         quantity,
        //         'created_at':new Date(),
        //         'modified_at':new Date(),
        //         'delivery_date':dDate,
        //         volume,
        //         price,
        //         discount
        //     }).then(orderDetail => {
        //         res.status(201).send({
        //             success:true,
        //             message:"Order Placed Successfully"
        //         })
        //     }).catch(err => {
        //         res.status(400).send({
        //             success:false,
        //             message:'db error'
        //             })
        //     })
        // } catch (error) {
        //     res.status(500).send({
        //         success:false,
        //         message:'user not found db error'
        //     })
        // }
    })
)


//order id in url
orderRouter.get(
    '/:id/',
    userJwt,
    expressAsyncHandler(async (req, res) => {
        try {
            await db('order')
            .where({
                'id':req.params.id,
                'user_id':req.user.id
            })
            .select('*')
            .then(order => {
                res.status(200).send({
                    success:true,
                    order:order
                })
            }).catch(err => {
                res.status(400).send({
                    success:false,
                    message:"db error!"
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
orderRouter.get(
    '/detail/:id/',
    userJwt,
    expressAsyncHandler(async (req, res) => {
        try {
            await db('order_details')
            .where('id', '=', req.params.id)
            .select('*')
            .then(orderDetails => {
                res.status(200).send({
                    success:true,
                    orderDetails:orderDetails
                })
            }).catch(err => {
                res.status(400).send({
                    success:false,
                    message:"db error!"
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
//get all orders and respected products
orderRouter.get(
    '/',
    userJwt,
    expressAsyncHandler(async (req, res) => {
        try {
            await db.transaction(async trx => {
                return trx('order')
                .where('user_id', '=', req.user.id)
                .orderBy('id','desc')
                .select('*')
                .then(async (orders) => {
                    if(orders.length){
                        const promises = orders.map(async order => {
                            return await trx('order_details')
                            .where({
                                'order_id':order.id
                            }).select('*')

                            .then(orderDetails => {
                                orderDetails.forEach(orderDetails => {
                                    orderDetails.user_id=order.user_id;
                                    orderDetails.total = order.total;
                                    orderDetails.address_id = order.address_id;
                                    orderDetails.payment_type = order.payment_type;
                                    orderDetails.is_paid = order.is_paid;
                                })
                                return orderDetails
                            }).catch(err => {
                                res.status(400).send({
                                    success:false,
                                    message:'db error'
                                })
                            })
                        });
                        const products = await Promise.all(promises)
                        res.status(200).send({
                            success:true,
                            allorders:Array.prototype.concat.apply([],products)
                        })
                    }else{
                        res.status(400).send({
                            success:false,
                            message: "No Orders Found!"
                        })
                    }
                }).catch(err => {
                    res.status(400).send({
                        success:false,
                        message:'db error'
                    })
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


// to delete order after collecting package
// orderRouter.delete(
//     '',
//     userJwt,
//     expressAsyncHandler(async (req, res)=> {
//         const {order_id} = req.body;
//         try {
//             await db.transaction(async (trx) => {
//                 return trx('order_details')
//                 .where({
//                     'order_id':order_id,
//                 }).del()
//                 .then(async () => {
//                     return trx('order')
//                     .where({
//                         'id':order_id,
//                     }).del()
//                     .then(() => {
//                         res.status(200).send({
//                             success:true,
//                             message:"order deleted"
//                         })
//                     }).catch(err => {
//                         res.status(400).send({
                    // success:false,
                    // message:'db error'
                    // })
//                     })
//                 }).catch(err => {
//                     res.status(400).send({
                    // success:false,
                    // message:'db error'
                    // })
//                 })
//             })    
//         } catch (error) {
//             res.status(500).send({
//                 success:false,
//                 message:"server error!"
//             })            
//         }
//     })
// )

//request for cancellation


orderRouter.put(
    '/cancel/req/',
    userJwt,
    expressAsyncHandler(async (req, res) => {
         const { order_id, reason_cancel} = req.body;
         try {
             await db('order')
             .where({
                 user_id:req.user.id,
                 id:order_id,
             }).update({
                 'req_cancel':1,
                 reason_cancel:reason_cancel
             }).then(() => {
                 res.status(200).send({
                    success:true,
                    message:"Requested for Cancellation!"
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
                message:"server error"
            })
         }
    })
)


// To cancel the order after pickup
orderRouter.put(
    '/cancel/',
    userJwt,
    expressAsyncHandler(async (req, res) => {
         const { order_id} = req.body;
         try {
             await db('order')
             .where({
                 user_id:req.user.id,
                 id:order_id,
             }).update({
                 is_cancelled:1,
                 is_refund:1
             }).then(() => {
                 res.status(200).send({
                    success:true,
                    message:"Order Cancelled!"
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
                message:"server error"
            })
         }
    })
)

//to get cancelled items
orderRouter.get(
    '/all/cancel/',
    userJwt,
    expressAsyncHandler(async (req, res) => {
        try {
            await db('order')
            .where({
                user_id:req.user.id,
                is_cancelled:1
            }).select('*')
            .then((canOrders) => {
                res.status(200).send({
                    success:true,
                    cancelled_orders:canOrders
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
                message:'server error'
            })
        }
    })
)

// orderRouter(
//     '/cancel/single/:id/',
//     userJwt,
//     expressAsyncHandler(async (req, res) => {
//         const {order_id} = req.body;
//         await db('order')
//         .where({
//             'user_id': req.user.id,
//             id: order_id
//         }).then((order) => {
            
//         })
//     })
// )

orderRouter.post(
    '/razorpay/order/',
    userJwt,
    expressAsyncHandler(async (req, res) => {
        var instance = new Razorpay({ key_id: process.env.RZP_KEY_ID, key_secret: process.env.RZP_KEY_SECRET })
        var {amount , receipt_id} = req.body;
        var {note} = req.body || "Creating Order";

        try {
            instance.orders.create({
                amount: amount,
                currency: "INR",
                receipt: receipt_id,
                notes: {
                    note1:note
                }

                }).then(order => {
                    res.status(200).send({
                        success:true,
                        rp_order: order
                    })        
                }).catch(err => {
                    res.status(400).send({
                        success:false,
                        message:"check fields"
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

export default orderRouter;