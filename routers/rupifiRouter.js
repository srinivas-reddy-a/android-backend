import express from "express";
import expressAsyncHandler from "express-async-handler";
import db from "../config/database.js";
import userJwt from "../middleware/userMiddleware.js";
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const rupifiRouter = express.Router();

let url = 'https://api-sandbox.rupifi.com/v1/customers/';

rupifiRouter.get(
    '/',
    // userJwt,
    expressAsyncHandler(async (req, res) => {
        const body = {
            "merchantId": process.env.RUPIFI_MERCHANT_ID,
            "merchantSecret": process.env.RUPIFI_MERCHANT_SECRET
        }
        try {
          await db('meta_data')
          .where({
            id:"1"
          }).select('rupifi_token', 'rupifi_token_expiry')
          .limit(1)
          .then(async data => {
            var rupifi_token_expiry = new Date(data[0].rupifi_token_expiry);
            var currentdate = new Date();
            var hourDiff =(Math.abs(rupifi_token_expiry-currentdate)/36e5);
            if(hourDiff > 23){
              await fetch(
                'https://api-sandbox.rupifi.com/v1/merchants/auth/token',
                {
                    method: 'post',
                    body: JSON.stringify(body),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(async res => res.json())
                  .then(async json => {
                    const rupifi_token = json.accessToken;
                    const expiry_date = new Date();
                    try{
                      await db('meta_data')
                      .where({
                        id:"1"
                      }).update({
                        rupifi_token: rupifi_token,
                        rupifi_token_expiry: expiry_date
                      }).then(data => {
                        res.status(201).send({
                          success: true,
                          token: rupifi_token
                        });
                      }).catch(err => {
                        res.status(400).send({
                            success:false,
                            message:'db error'
                        })
                    })
                    }catch (error) {
                      res.status(500).send({
                          success:false,
                          message:"server error!"
                      })
                  }
                  })
                  .catch(err => console.log(err))
            }else{
              res.status(200).send({
                success:true,
                token: data[0].rupifi_token
            })
            }
            
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

rupifiRouter.post(
    '/gmv/',
    userJwt,
    expressAsyncHandler(async (req, res) => {
      const body = req.body.body;
      const rupifi_access_token = req.body.rupifi_access_token;
      try {
        await fetch(
          url+'gmv/',
          {
              method: 'post',
              body: JSON.stringify(body),
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer '+ rupifi_access_token
              }
          }
        ).then(res => res.json())
        .then(json => {
          res.status(200).send({
            success:true,
            message:"GMV data updated successfully!"
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


rupifiRouter.post(
  '/eligibility/',
  userJwt,
  expressAsyncHandler(async (req, res) => {
    const {merchantCustomerRefId, phone, updateGMV, rupifi_access_token} = req.body;
    const localUrl = url+"eligibility/";
    const body = {
      merchantCustomerRefId,
      phone,
      updateGMV
    }
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer '+rupifi_access_token
      },
      body: JSON.stringify(body)
    }
    try {
      await fetch(localUrl, options)
      .then(async res => res.json())
      .then(async json => {
        res.status(200).send({
          success:true,
          eligibility_data: json
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





export default rupifiRouter;