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

export default cropRouter;
