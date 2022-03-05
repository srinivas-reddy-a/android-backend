import express from "express";
import expressAsyncHandler from "express-async-handler";
import db from "../config/database.js";
import userJwt from "../middleware/userMiddleware.js";

const orderRouter = express.Router();
// var date = order[0].created_at;
// console.log(date)
//timestamp to date conversion
// console.log(new Date(date.setDate(date.getDate()+4)))
orderRouter.post(
    '/',
    userJwt,
    expressAsyncHandler(async (req,res) => {
        const {
            total,
            address_id,
        } = req.body;
        
        try {
            const date = new Date();
            const dDate = new Date(date.setDate(date.getDate()+4))
            await db('order')
            .insert({
                'user_id': req.user.id,
                'created_at':new Date(),
                'delivery_date':dDate,
                address_id,
                total
            }).then(order => {
                res.status(201).send({
                    success:true,
                    message:order[0]
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
        const {
            order_id,
            product_id,
            quantity,
            volume
        } = req.body
        try {
            await db('order_details')
            .insert({
                order_id,
                'products_id':product_id,
                quantity,
                'created_at':new Date(),
                volume:volume
            }).then(orderDetail => {
                res.status(201).send({
                    success:true,
                    orderDetail:orderDetail,
                    message:"order placed"
                })
            }).catch(err => {
                res.status(400).send({
                    success:false,
                    message: err
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
                                    orderDetails.delivery_type = order.delivery_type
                                    orderDetails.delivery_date = order.delivery_date
                                    orderDetails.is_delivered = order.is_delivered;
                                    orderDetails.is_shipped = order.is_shipped;
                                    orderDetails.delivered_on = order.delivered_on;
                                    orderDetails.address_id = order.address_id
                                })
                                return orderDetails
                            }).catch(err => {
                                res.status(400).send({
                                    success:false,
                                    message: "No such user/address exists!"
                                })
                            })
                        });
                        const products = await Promise.all(promises)
                        res.status(200).send({
                            success:true,
                            products:Array.prototype.concat.apply([],products)
                        })
                    }else{
                        res.status(400).send({
                            success:false,
                            message: "WishList empty!"
                        })
                    }
                }).catch(err => {
                    res.status(400).send({
                        success:false,
                        message: "No such user/address exists!"
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
//                             success:false,
//                             message: err
//                         })
//                     })
//                 }).catch(err => {
//                     res.status(400).send({
//                         success:false,
//                         message: err
//                     })
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
                    message: "No such user/address exists!"
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
                    message: "No such user/address exists!"
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
                console.log(req.user.id)
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

export default orderRouter;