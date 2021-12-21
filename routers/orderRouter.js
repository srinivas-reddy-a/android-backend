import express from "express";
import expressAsyncHandler from "express-async-handler";
import db from "../config/database.js";
import userJwt from "../middleware/userMiddleware.js";

const orderRouter = express.Router();

orderRouter.post(
    '/',
    userJwt,
    expressAsyncHandler(async (req,res) => {
        const {
            total,
            address_id,
        } = req.body
        try {
            await db('order')
            .insert({
                'user_id': req.user.id,
                address_id,
                total
            }).then(order => {
                res.status(201).send({
                    success:true,
                    order:order
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


orderRouter.post(
    '/detail/',
    expressAsyncHandler(async (req, res) => {
        const {
            order_id,
            product_id,
            quantity
        } = req.body
        try {
            await db('order_details')
            .insert({
                order_id,
                'products_id':product_id,
                quantity
            }).then(order => {
                res.status(201).send({
                    success:true,
                    message:"order placed"
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
                message:'user not found db error'
            })
        }
    })
)

orderRouter.get(
    '/:id/',
    userJwt,
    expressAsyncHandler(async (req, res) => {
        try {
            await db('order')
            .where('id', '=', req.params.id)
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
    '',
    userJwt,
    expressAsyncHandler(async (req, res) => {
        try {
            await db('order')
            .where('user_id', '=', req.user.id)
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

export default orderRouter;