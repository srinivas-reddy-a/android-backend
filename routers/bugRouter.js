import express from "express";
import expressAsyncHandler from "express-async-handler";
import db from "../config/database.js";
import userJwt from "../middleware/userMiddleware.js";

const bugRouter = express.Router();

bugRouter.post(
    '/',
    userJwt,
    expressAsyncHandler(async (req, res) => {
        const userzsz_id = req.user.id;
        const bug_detail = req.body.bug_detail;
        try {
            await db('bug')
            .insert({
                'userzsz_id':userzsz_id,
                'bug_detail':bug_detail,
                'created_at':new Date()
            }).then(() => {
                res.status(200).send({
                    success:true,
                    message:"Reported bug!"
                })
            }).catch(err =>{
                res.status(400).send({
                    success: false,
                    message:"db error"
                })
            })
        } catch (error) {
            res.status(500).send({
                success:false,
                message:"internal error"
            });
        }
    })
)

export default bugRouter;