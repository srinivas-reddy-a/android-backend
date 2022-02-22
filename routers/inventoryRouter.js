import express from "express";
import expressAsyncHandler from "express-async-handler";
import userJwt from "../middleware/userMiddleware.js";
import { request } from "express";

const inventoryRouter = express.Router();

inventoryRouter.get(
    '/',
    expressAsyncHandler(async (req, res) => {
        const options={
            uri:'https://inventory.zoho.com/api/v1/items',
            method: 'GET',
            headers:{
                'Content-Type': 'application/json',
                'Authorization': 'Zoho-oauthtoken 1000.3c10364a37cb3a4822adc2eba21e02f0.4d0a22893749f8aabfaa433868436807'
            },
            params:{
                'organization_id':60012963145
            }
        }

        request(options,  (error, response) => {
            console.log(error,response.body);
            return;
        });
    })
)



export default inventoryRouter; 