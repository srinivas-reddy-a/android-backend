import express from "express";
import expressAsyncHandler from "express-async-handler";
import db from "../config/database.js";
// import { AWSTranslateJSON } from "aws-translate-json";

// const awsConfig = {
//     accessKeyId: process.env.AWS_TRANSLATE_ID,
//     secretAccessKey: process.env.AWS_TRANSLATE_SECRET,
//     region: process.env.AWS_TRANSLATE_REGION,
// }

// const source = "en";
// const taget = ["hi"];
// const { translateJSON } = new AWSTranslateJSON(awsConfig, source, taget);

const productRouter = express.Router();

productRouter.get(
    '/',
    expressAsyncHandler(async (req, res) => {

        try {
            await db('product')
            .where((qb)=>{
                if(req.query.name){
                    qb.where('name', 'like', `%${req.query.name}%`)
                }
                if(req.query.category){
                    qb.where('category', '=', req.query.category)
                }                
                if(req.query.crop){
                    qb.where('target_field_crops', 'like', `%${req.query.crop}%`)
                    .orWhere('target_vegetable_crops', 'like', `%${req.query.crop}%`)
                    .orWhere('target_fruit_crops', 'like', `%${req.query.crop}%`)
                    .orWhere('target_plantation_crops', 'like', `%${req.query.crop}%`)
                }
                if(req.query.brand){
                    qb.where('brand', 'like', `%${req.query.brand}%`)
                }
                if(req.query.price){
                    qb.where('price', '<=', req.query.price)
                }
                if(req.query.disease){
                    qb.where('target_disease', 'like', `%${req.query.disease}%`)
                }
                if(req.query.search){
                    qb.where('target_field_crops', 'like', `%${req.query.search}%`)
                    .orWhere('target_vegetable_crops', 'like', `%${req.query.search}%`)
                    .orWhere('target_fruit_crops', 'like', `%${req.query.search}%`)
                    .orWhere('target_plantation_crops', 'like', `%${req.query.search}%`)
                    .orWhere('name', 'like', `%${req.query.search}%`)
                    .orWhere('brand', 'like', `%${req.query.search}%`)
                    .orWhere('target_disease', 'like', `%${req.query.search}%`)
                    .orWhere('category', 'like', `%${req.query.search}%`)
                }
            })
            .orderBy('name', 'asc')
            .then(products => {
                // products.forEach(p => {
                //     console.log(p)
                //     translateJSON({
                //         a:"road"
                //     }).then(console.log);
                // })             
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

//price sort high to low
productRouter.get(
    '/sort/high/',
    expressAsyncHandler(async (req, res) => {
        try {
            await db('product')
                .orderBy('price', 'desc')
                .then(products => {
                    res.status(200).send({
                        success:true,
                        products:products
                    })
                }).catch(err => res.status(400).send({
                    success:false,
                    message:"db error"
                }))
        } catch (error) {
            res.status(500).send({
                success:false,
                message:"server error"
            })
        }
        
    })
)


//price sort low to high
productRouter.get(
    '/sort/low/',
    expressAsyncHandler(async (req, res) => {
        try {
            await db('product')
                .orderBy('price', 'asc')
                .then(products => {
                    res.status(200).send({
                        success:true,
                        products:products
                    })
                }).catch(err => res.status(400).send({
                    success:false,
                    message:"db error"
                }))
        } catch (error) {
            res.status(500).send({
                success:false,
                message:"server error"
            })
        }
        
    })
)

//filter using price ranges
productRouter.get(
    '/filter/',
    expressAsyncHandler(async (req, res) => {
        const {low} = req.body;
        const {high} = req.body;
        try {
            await db('product')
                .havingBetween('price', [low, high])
                .select('*')
                .then(products => {
                    res.status(200).send({
                        success:true,
                        products:products
                    })
                }).catch(err => res.status(400).send({
                    success:false,
                    message:"db error"
                }))
        } catch (error) {
            res.status(500).send({
                success:false,
                message:"server error"
            })
        }
    })
)


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
            await db('product')
            .where('id', req.params.id)
            .select('*')
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

//to get products of particular category
productRouter.get(
    '/category/filter/product/',
    expressAsyncHandler(async (req, res) => {
        const { category } = req.body;
        try {
            await db('product')
            .where({
                'category':category
            }).select('*')
            .then(products => {
                res.status(200).send({
                    success:true,
                    products:products
                })
            }).catch(err => res.status(400).send({
                success:false,
                message:"db error"
            }))
        } catch (error) {
            res.status(500).send({
                success:false,
                message:"server error"
            })
        }
    })
)


//to get products of particular brand
productRouter.get(
    '/brand/product/',
    expressAsyncHandler(async (req, res) => {
        const { brand } = req.body;
        try {
            await db('product')
            .where({
                'brand':brand
            }).select('*')
            .then(products => {
                res.status(200).send({
                    success:true,
                    products:products
                })
            }).catch(err => res.status(400).send({
                success:false,
                message:"db error"
            }))
        } catch (error) {
            res.status(500).send({
                success:false,
                message:"server error"
            })
        }
    })
)

export default productRouter;