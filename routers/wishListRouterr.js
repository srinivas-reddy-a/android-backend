import express from "express";
import expressAsyncHandler from "express-async-handler";
import db from "../config/database.js";
import userJwt from "../middleware/userMiddleware.js";

const wishListRouter = express.Router();

wishListRouter.post(
    '/',
    userJwt,
    expressAsyncHandler(async (req, res) => {
        const {
            product_id,
            quantity
        }  = req.body;
        try {
            await db('wish_list')
            .insert({
                userszs:req.user.id,
                productszs_id:product_id,
                quantity,
            }).then(product => {
                res.status(201).send({
                    success:true,
                    product:product
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

wishListRouter.get(
    '/',
    userJwt,
    expressAsyncHandler(async (req, res) => {
        try {
            await db('wish_list')
            .where('userszs_id', '=', req.user.id)
            .select('*')
            .then(products => {
                res.status(200).send({
                    success:true,
                    products: products
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

wishListRouter.put(
    '/',
    userJwt,
    expressAsyncHandler(async (req, res) =>{
        const {
            product_id,
            quantity
        }  = req.body;
        try {
            await db.transaction(trx => {
                return trx('wish_list')
                    .where({
                        userszs_id: req.user.id,
                        productszs_id: product_id
                    }).then(product => {
                        if(product.length){
                            product = product[0];
                            product.quantity = quantity;
                            return trx('wish_list')
                            .where({
                                userszs_id: req.user.id,
                                productszs_id: product_id
                            }).update({
                                quantity:quantity
                            }).then(product => {
                                res.status(201).send({
                                    success: true,
                                    product:product
                                });
                            })
                        }else {
                            res.status(400).send({
                                success:false,
                                msg: "No such user/product exists!"
                            })
                        }
                    }).then(trx.commit)
                    .catch(trx.rollback);
                }).catch(err => res.status(400).send({
                    success: false,
                    msg: err
                }))
        } catch (error) {
            res.status(500).send({
                success:false,
                message:"server error!"
            })
        }
    })
)

wishListRouter.delete(
    '/',
    userJwt,
    expressAsyncHandler(async (req, res) => {
        try {
            await db('cart')
            .where({
                userszs_id: req.user.id,
                productszs_id: product_id
            }).del()
            .then(() => {
                res.status(200).send({
                    success: true,
                    message: "deleted"
                });
            }).catch(err => {
                res.status(400).send({
                    success:false,
                    msg: "No such user/product exists!"
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

export default wishListRouter