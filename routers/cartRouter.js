import express from "express";
import expressAsyncHandler from "express-async-handler";
import db from "../config/database.js";
import userJwt from "../middleware/userMiddleware.js";

const cartRouter = express.Router();

//to check whether product is in cart or not
cartRouter.post(
    '/status/',
    userJwt,
    expressAsyncHandler(async (req, res) =>{
        const {product_id, volume} = req.body;
        try {
            await db('cart')
            .where({
                usersz_id:req.user.id,
                product_id:product_id,
                volume:volume
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


//to add items
cartRouter.post(
    '/',
    userJwt,
    expressAsyncHandler(async (req, res) => {
        const {
            product_id,
            // quantity,
            volume,
            price,
            // discount,
            // id
        }  = req.body;
        try {
            await db.transaction(async trx=>{
                return await trx('cart')
                .where({
                    usersz_id:req.user.id,
                    product_id:product_id,
                    volume:volume
                }).then(async products_id=>{
                    if(products_id.length){
                        res.status(200).send({
                            success:true,
                            message:"Product already exists in cart!"
                        })
                    }else{
                        return trx('cart')
                        .insert({
                            // 'id':id,
                            'usersz_id':req.user.id,
                            'product_id':product_id,
                            'quantity':1,
                            'volume':volume,
                            // 'price':price,
                            // 'discount':discount,
                            'created_at':new Date(),
                            'modified_at':new Date()
                        }).then(product => {
                            res.status(201).send({
                                success:true,
                                message:"Product added to cart!"
                            })
                        }).catch(err => {
                            res.status(400).send({
                                success:false,
                                message:'db error'
                            })
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
                .andWhere('conversion_into_order', '=', false)
                .select('*')
                .then(async product_ids => {
                    if(product_ids.length){
                        const promises = product_ids.map(async element => {
                            return await trx('product')
                            .where('id', element.product_id)
                            .select('*')
                            .then(product=>{
                                product[0].cart_id = element.id
                                product[0].quantity=element.quantity
                                product[0].volume = element.volume
                                product[0].price = element.price
                                product[0].discount = element.discount
                                product[0].estimate = element.estimate
                                product[0].conversion_into_order = element.conversion_into_order
                                return product[0]
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
                            products:products
                        })
                    }
                    else{
                        res.status(400).send({
                            success:false,
                            message: "Cart empty"
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

cartRouter.put(
    '/',
    userJwt,
    expressAsyncHandler(async (req, res) =>{
        const {
            product_id,
            quantity,
            volume,
            discount,
            price,
        }  = req.body;
        try {
            await db.transaction(async trx => {
                return trx('cart')
                    .where({
                        usersz_id: req.user.id,
                        product_id: product_id,
                        volume:volume
                    })
                    .then(async product => {
                        if(product.length){
                            product = product[0];
                            product.quantity = quantity;
                            product.discount = discount;
                            product.price = price;
                            return trx('cart')
                            .where({
                                usersz_id: req.user.id,
                                product_id: product_id,
                                volume:volume
                            }).update({
                                quantity:quantity,
                                discount:discount,
                                price:price,
                                modified_at: new Date()
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
                }).catch(err =>  {
                    res.status(400).send({
                        success:false,
                        message:'db error'
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


//to change estimate status
cartRouter.put(
    '/estimate/',
    userJwt,
    expressAsyncHandler(async (req, res) => {
        const {estimate_status} = req.body;
        try {
            await db('cart')
            .where({
                usersz_id: req.user.id,
            }).update({
                estimate:estimate_status
            }).then(product => {
                res.status(200).send({
                    success:true,
                    message: "Updated Successfully!"
                })
            }).catch(err =>  {
                res.status(400).send({
                    success:false,
                    message:'db error'
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

//to change conversion_into_order status
cartRouter.put(
    '/estimate/conversion/',
    userJwt,
    expressAsyncHandler(async (req, res) => {
        try {
            await db('cart')
            where({
                usersz_id: req.user.id,
            }).update({
                conversion_into_order:true
            }).then(data => {
                res.status(200).send({
                    success:true,
                    message: "Updated Successfully!"
                })
            }).catch(err =>  {
                res.status(400).send({
                    success:false,
                    message:'db error'
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

cartRouter.delete(
    '/',
    userJwt,
    expressAsyncHandler(async (req, res) => {
        const {product_id,volume} = req.body;
        try {
            await db('cart')
            .where({
                usersz_id: req.user.id,
                product_id: product_id,
                volume:volume
            }).del()
            .then((success) => {
                success?
                res.status(200).send({
                    success: true,
                    message: "Removed from cart!"
                })
                :res.status(200).send({
                    success: false,
                    message: "dont exist"
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
                message:"server error!"
            })
        }
    })
)

cartRouter.delete(
    '/all/',
    userJwt,
    expressAsyncHandler(async (req, res) => {
        const {product_id,volume} = req.body;
        try {
            await db('cart')
            .where({
                usersz_id: req.user.id
            }).del()
            .then((success) => {
                success?
                res.status(200).send({
                    success: true,
                    message: "Cart Empty"
                })
                :res.status(200).send({
                    success: false,
                    message: "dont exist"
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
                message:"server error!"
            })
        }
    })
)

export default cartRouter;