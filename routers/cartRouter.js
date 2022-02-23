import express from "express";
import expressAsyncHandler from "express-async-handler";
import db from "../config/database.js";
import userJwt from "../middleware/userMiddleware.js";

const cartRouter = express.Router();

//to check whether product is in cart or not
cartRouter.post(
    '/status/:id/',
    userJwt,
    expressAsyncHandler(async (req, res) =>{
        const product_id = req.params.id;
        try {
            await db('cart')
            .where({
                usersz_id:req.user.id,
                product_id:product_id,
            }).then((product) => {
                product.length
                ? res.status(200).send({
                    success:true,
                    message:"Product already exists in cart!"
                })
                : res.status(400).send({
                    success:false,
                    message:"Product not in cart!"
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
                message:'server error'
            })
        }
    })
)


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
            await db.transaction(async trx=>{
                return await trx('cart')
                .where({
                    usersz_id:req.user.id,
                    product_id:product_id,
                }).then(async products_id=>{
                    if(products_id.length){
                        res.status(200).send({
                            success:true,
                            message:"Product already exists in cart!"
                        })
                    }else{
                        return trx('cart')
                        .insert({
                            'usersz_id':req.user.id,
                            'product_id':product_id,
                            'quantity':quantity,
                        }).then(product => {
                            res.status(201).send({
                                success:true,
                                message:"Successfully added!"
                            })
                        }).catch(err => {
                            res.status(400).send({
                                success:false,
                                message: err
                            })
                        })
                    }
                }).catch(err => {
                    res.status(400).send({
                        success:false,
                        message: err
                    })
                })
            })
            // await db('wish_list')
            // .insert({
            //     userszs_id:req.user.id,
            //     productszs_id:product_id,
            //     quantity,
            // }).then(product => {
            //     res.status(201).send({
            //         success:true,
            //         message:"Successfully added!"
            //     })
            // }).catch(err => {
            //     res.status(400).send({
            //         success:false,
            //         message: err
            //     })
            // })
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
            await db.transaction(async trx => {
                return trx('cart')
                .where('usersz_id', '=', req.user.id)
                .select('*')
                .then(async product_ids => {
                    if(product_ids.length){
                        const promises = product_ids.map(async element => {
                            return await trx('product')
                            .where('id', element.product_id)
                            .select('*')
                            .then(product=>{     
                                console.log(element)
                                return product[0]
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
                            products:products
                        })
                    }
                    else{
                        res.status(400).send({
                            success:false,
                            message: "WishList empty"
                        })
                    }
                }).catch(err => {
                    res.status(400).send({
                        success:false,
                        message: "No such user/address exists!"
                    })
                })
            })
            // await db('wish_list')
            // .where('userszs_id', '=', req.user.id)
            // .select('*')
            // .then(products => {
            //     console.log(products)
            //     res.status(200).send({
            //         success:true,
            //         products: products
            //     })
            // }).catch(err => {
            //     res.status(400).send({
            //         success:false,
            //         message:"db error!"
            //     })
            // })
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
                                    message:"Updated Successfully!"
                                });
                            })
                        }else {
                            res.status(400).send({
                                success:false,
                                message: "No such user/product exists!"
                            })
                        }
                    }).then(trx.commit)
                    .catch(trx.rollback);
                }).catch(err => res.status(400).send({
                    success: false,
                    message: err
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
    '/:id/',
    userJwt,
    expressAsyncHandler(async (req, res) => {
        const product_id = req.params.id
        try {
            await db('cart')
            .where({
                usersz_id: req.user.id,
                product_id: product_id
            }).del()
            .then((success) => {
                success?
                res.status(200).send({
                    success: true,
                    message: "deleted"
                })
                :res.status(200).send({
                    success: false,
                    message: "dont exist"
                })
            }).catch(err => {
                res.status(400).send({
                    success:false,
                    message: "No such user/product exists!"
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