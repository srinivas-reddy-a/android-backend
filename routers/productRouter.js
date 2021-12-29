import express from "express";
import expressAsyncHandler from "express-async-handler";
import db from "../config/database.js";

const productRouter = express.Router();

productRouter.get(
    '/',
    expressAsyncHandler(async (req, res) => {
        // if(Object.keys(req.query).length!=0){
        //     console.log(req.query);
        // }
        try {
            await db('product')
            .orderBy(req.query.params || 'name', 'desc')
            .then(products => {
                res.status(200).send({
                    success:true,
                    products:products
                })
            })
            .catch(err => res.status(400).send({
                success:false,
                message:"db error"
            }))
        } catch (error) {
            res.status(500).send({
                success:false,
                message:"server error"
            })
        }
    }))


productRouter.get(
    '/category/',
    expressAsyncHandler(async (req, res) => {
        try {
            await db
            .select()
            .table('category')
            .then(categories => {
                res.status(200).send({
                    success:true,
                    categories:categories
                })
            })
            .catch(err => res.status(400).send({
                success:false,
                message:"db error"
            }))
        } catch (error) {
            res.status(500).send({
                success:false,
                message:"server error"
            })
        }
    }))


productRouter.get(
    '/:id/',
    expressAsyncHandler(async (req,res) => {
        try {
            await db('product').where('id', req.params.id).select('*')
            .then(product => {
                res.status(200).send({
                    success:true,
                    product: product
                })
            })
            .catch(err => {
                res.status(500).send({
                    success:false,
                    message:'product not found db error'
                })
            })
            
        } catch (error) {
            console.log(error)
            res.status(500).send({
                success:false,
                message:'Server error'
            })
            
        }
    })
)


productRouter.get(
    '/category/:id/',
    expressAsyncHandler(async (req,res) => {
        try {
            await db('category').where('id', req.params.id).select('*')
            .then(category => {
                res.status(200).send({
                    success:true,
                    category:category
                })
            })
            .catch(err => {
                res.status(500).send({
                    success:false,
                    message:'category not found db error'
                })
            })
            
        } catch (error) {
            console.log(error)
            res.status(500).send({
                success:false,
                message:'Server error'
            })
            
        }
    })
)

productRouter.post(
    '/:id/review/',
    expressAsyncHandler(async (req, res) => {
        const { rating, comment } = req.body;
        try {
            await db('review')
            .insert({'product_id': req.params.id, 'rating':rating, 'comment':comment})
            .then(() => {
                res.status(201).send({
                    success:true,
                    message: "review added"
                })
            })
            .catch(errr => {
                res.status(400).send({
                    success:false,
                    message:"db error"
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

export default productRouter;