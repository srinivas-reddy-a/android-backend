import express from "express";
import expressAsyncHandler from "express-async-handler";
import db from "../config/database.js";

const brandRouter = express.Router();

brandRouter.get(
    '/',
    expressAsyncHandler(async (req, res) => {
        try{
            await db
            .select()
            .table('brand')
            .then(brands => {
                res.status(200).send({
                    success:true,
                    brands:brands
                })
            })
            .catch(err => res.status(400).send({
                success:false,
                message:err
            }))
        } catch (error) {
            res.status(500).send({
                success:false,
                message:"server error"
            })
        }
    })
)

brandRouter.get(
    '/:id',
    expressAsyncHandler(async (req, res) => {
        try {
            await db('brand')
            .where('id', req.params.id)
            .select('*')
            .then(brand => {
                res.status(200).send({
                    success:true,
                    brand:brand
                })
            })
            .catch(err => {
                res.status(500).send({
                    success:false,
                    message:'brandd not found db error'
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

export default brandRouter;