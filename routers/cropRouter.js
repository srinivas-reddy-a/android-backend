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

//get cropwise categories
cropRouter.get(
    '/:crop/category/',
    expressAsyncHandler(async (req, res) => {
        const limit = req.query.limit || 1000000;
        const crop = req.params.crop;
        const orderby = req.query.orderby || 'name';
        const order = req.query.order || 'asc';
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
            .orderBy(orderby, order)
            .then(categories => {            
                res.status(200).send({
                    success:true,
                    cwcategories:categories
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
    '/:crop/category/:category/product',
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

export default cropRouter;
