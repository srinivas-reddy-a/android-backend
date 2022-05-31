import express from "express";
import expressAsyncHandler from "express-async-handler";
import db from "../config/database.js";
import userJwt from "../middleware/userMiddleware.js";

const metaRouter = express.Router();

metaRouter.get(
    '/',
    userJwt,
    expressAsyncHandler(async (req, res) => {
        try {
            await db('meta_data')
            .where('id','=',1)
            .select('ads','product')
            .then(ads => {
                res.status(200).send({
                    success:true,
                    ads:ads
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

metaRouter.get(
    '/review/',
    userJwt,
    expressAsyncHandler(async (req, res) => {
        try {
            await db('meta_data')
            .where('id','=',1)
            .select('reviewimg','review','review_cus_name')
            .then(reviews => {
                res.status(200).send({
                    success:true,
                    reviews:reviews
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

export default metaRouter;