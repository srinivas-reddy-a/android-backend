import express from "express";
import expressAsyncHandler from "express-async-handler";
import db from "../config/database.js";
import userJwt from "../middleware/userMiddleware.js";

const cartRouter = express.Router();
//to add items
cartRouter.post(
    '/',
    userJwt,
    expressAsyncHandler(async (req, res) => {
        const {
            product_id,
            quantity
        }  = req.body;
        try {
            await db('cart')
            .insert({
                usersz_id:req.body.id,
                product_id,
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

cartRouter.get(
    '/',
    userJwt,
    expressAsyncHandler(async (req, res) => {
        try {
            await db('cart')
            .where('usersz_id', '=', req.user.id)
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

cartRouter.put(
    '/',
    userJwt,
    expressAsyncHandler(async (req, res) =>{
        const {
            product_id,
            quantity
        }  = req.body;
        try {
            await db.transaction(async trx => {
                return trx('cart')
                    .where({
                        usersz_id: req.user.id,
                        product_id: product_id
                    })
                    .then(product => {
                        if(product.length){
                            product = product[0];
                            product.quantity = quantity;
                            return trx('cart')
                            .where({
                                usersz_id: req.user.id,
                                product_id: product_id
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

cartRouter.delete(
    '/',
    userJwt,
    expressAsyncHandler(async (req, res) => {
        try {
            await db('cart')
            .where({
                usersz_id: req.user.id,
                product_id: product_id
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

export default cartRouter;