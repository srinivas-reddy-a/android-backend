import express from "express";
import expressAsyncHandler from "express-async-handler";
import db from "../config/database.js";
import userJwt from "../middleware/userMiddleware.js";


const techNameRouter = express.Router();

techNameRouter.get(
    '/',
    userJwt,
    expressAsyncHandler(async (req, res) => {
        try {
            await db('product')
            .select("technical_name")
            .then(technames => {
                res.status(200).send({
                    success:true,
                    technames:technames
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
    })
)

techNameRouter.post(
    '/product/',
    userJwt,
    expressAsyncHandler(async (req, res) => {
        try {
            await db('product')
            .where('technical_name', '=', `${req.body.technical_name}`)
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

export default techNameRouter;