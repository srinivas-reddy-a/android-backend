import express from "express";
import expressAsyncHandler from "express-async-handler";
import db from "../config/database.js";

const cropRouter = express.Router();

cropRouter.get(
    '/',
    expressAsyncHandler(async (req, res) => {
        const limit = req.query.limit || 1000000;
        try{
            await db('crop')
            .orderBy('name', 'asc')
            .limit(limit)
            .then(crops => {
                res.status(200).send({
                    success:true,
                    crops:crops
                })
            }).catch(err => res.status(400).send({
                success:false,
                message:"db error"
            }))
        }catch (error){
            res.status(500).send({
                success:false,
                message:"Internal server error"
            })
        }
    })
)

//get cropwise
cropRouter.get(
    '/:crop/product/',
    expressAsyncHandler(async (req, res) => {
        const limit = req.query.limit || 1000000;
        const crop = req.params.crop;
        try {
            await db('product')
            .where((qb)=>{                
                if(crop){
                    qb.where('target_field_crops', 'like', `%${crop}%`)
                    .orWhere('target_vegetable_crops', 'like', `%${crop}%`)
                    .orWhere('target_fruit_crops', 'like', `%${crop}%`)
                    .orWhere('target_plantation_crops', 'like', `%${crop}%`)
                }
            })
            .select('id', 'category')
            .limit(limit)
            .orderBy('category', 'asc')
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

//get cropwise categorywise product
cropRouter.get(
    '/:crop/product/category/:category',
    expressAsyncHandler(async (req, res) => {
        const limit = req.query.limit || 1000000;
        const crop = req.params.crop;
        const orderby = req.query.orderby || 'name';
        const order = req.query.order || 'asc';
        const category = req.params.category;
        try {
            await db('product')
            .where((qb)=>{                
                if(req.params.crop){
                    qb.where('target_field_crops', 'like', `%${crop}%`)
                    .orWhere('target_vegetable_crops', 'like', `%${crop}%`)
                    .orWhere('target_fruit_crops', 'like', `%${crop}%`)
                    .orWhere('target_plantation_crops', 'like', `%${crop}%`)
                }
            })
            .andWhere((qb) => {
                if(req.params.category){
                    qb.where('category', 'like', `%${category}%`)
                } 
            })
            .limit(limit)
            .orderBy(orderby, order)
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


cropRouter.get(
    '/product/',
    expressAsyncHandler(async (req, res) => {
        const limit = req.query.limit || 1000000;
        const orderby = req.query.orderby || 'name';
        const order = req.query.order || 'desc';
        try {
            await db('product')
            .where((qb)=>{
                if(req.query.name){
                    qb.where('name', 'like', `%${req.query.name}%`)
                }
                if(req.query.technical_name){
                    qb.where('technical_name', 'like', `%${req.query.technical_name}%`)
                }
                if(req.query.category){
                    qb.where('category', 'like', `%${req.query.category}%`)
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
                    .orWhere('technical_name', 'like', `%${req.query.technical_name}%`)
                }
            })
            .limit(limit)
            .orderBy(orderby, order)
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





export default cropRouter;
