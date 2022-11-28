import { initializeApp } from "firebase-admin/app";
import admin from "firebase-admin";
import { getMessaging } from "firebase-admin/messaging";
import dotenv from "dotenv";
import express from "express";
import expressAsyncHandler from "express-async-handler";
import db from "../config/database.js";
import userJwt from "../middleware/userMiddleware.js";

dotenv.config();
// var serviceAccount = require(process.env.PATH_TO_SERVICE_ACCOUNT_PRIVATE_KEY_JSON_FILE);

const firebaseRouter = express.Router();
initializeApp({
    "type": "service_account",
    "project_id": "arraykart-b2b-node-server",
    "private_key_id": "b953986f66c461a4cbd0d9d77e3d69bbf6a63300",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC/HxaqNThOKqX6\nZz2AMjZibNGAhzbgGq6RTSWNFi8VuhY7UePvxGdrZEKnpOPVoXJWhNtm76g6KWgj\np4oJLtppqvE5Gb7oeRV+ImPqyqfNmPLlEWWJvBDFlPXXTW9YzYznhnPRcOW8Tby/\nuif/PEmhtEtAPcM1sfC2EJiceNeAYb7n45wU4qD3A2rnHbvvsjlwYt/BTlG8MbZD\ntC6zn7uqM3c0nBEpl98nPj6Q2QlHU+VzfM+sdXjIrvdfVZRaaWHnH9KVgsB4yiNY\nyprKLbAaB3Dj+6wXY6RqXZ/KpAtDkqii9TVNJ8B+5qyZ8euAyKFkJGeF1p832UTT\nalcHLwNdAgMBAAECggEALL8qn082j5aMpcPmMk2PThwMMPt3baDRnlNhp1a6T2vy\nKJFTvJ9PV2Vx9a41aZ8TFg6lD8SsrnFjYHWpa9z8ZiEPuT6948/1qEKFAkPQZeKZ\ne+hGzaiqhJgLtwz6NOBrTQm9tBuqrhvFRV5gXvHOi32a4L+VJM00fmwETx471mKk\nUcLiwT3fSw2BNffORRuXyrMtCVwV/MHyAa461ZcnOKjBAt4xC86qqh+Rr+LPQK83\nZmrbS6jnHF/C4uTDgfG+L8g/isFBa5jlYBdk9GnvxdtOD1v284OlM9NOgYPoFC4I\nue2hHrpp7lkiRVjDFJ0LwoKRHaxA6rYwHOIAjnxUQQKBgQDwN/pWo4BHUP+tJgPp\nw7qPRfDtUo7oLkpCZGaswCr1HrGthExtSJ8uyg0HAMAJN6Q46EAdpK06nkVpuCWx\nkl94qJCJRSFb909yv9BDbpr+sC/YoEWwqUowlVM5rwbVFxJG+E8Wvq/JVNL0yqBX\nFUZzpDo10NFEnPOGho9bZ8zMvwKBgQDLrWN04+ScPFug3cfMWbemUtZ0wmqI5//D\n5SvuRE6n2XSL1KD+NMwATQE8pNglpGZlcU5JAyyRXUi7QZ7T/M5hWBQ8c1Y+pvJD\nzRYE8RSgEMPGiPMB2G7/DX2uGj036FQezC2K/zGdUyKoFd/81tF0f1eUvVcQAuMp\nBuFuquoK4wKBgEOqsRUIt5DfSzZeGAoYfYvwWr6vW9whdf+fwqB0/WTRAaHsO48p\nPtXySpsnZfDywIrbOXxgL//sJ4dxPQT5Q3V8nkJcu9npH3MmfycPmA+YV9IAy8DI\n30IyPiBoolcSSa6+MaEpk+D1yPr1vRbqwk6++zq/mMNoJt1FOEq6QaGHAoGBAMMl\ndc1hLIClNAWFeRFKRLOPWvqz6+8QmfXPda/sspAPwaLYLwhg/bSsEytPpekrAxDe\n5ur9p43/mtgPn2XtKrAJ/BmPSGru+eAMd7R0aBaU+X8XZ/20qWSmQGy3p0AR0cdQ\nSbKLn7XlGaeCjgFqsXS1LezNHMWyfoOonAW0rFmRAoGBAJE6anMRFCJ0gVA5H5ta\n2IuKxVlIdIbssAtc5W5GgFMHBJ7bkdP2YP069YnpQdY+CAW3sLY37Tmmg8RXT+sg\nn1JY+YPfxonrMu1t/up9dP6WnTw42ElX0J3l39TRgOOgXR7WiOUx+NG0F2eTXh/Y\nTNOofQ6POJDfzV15elGCGkwx\n-----END PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk-htg3o@arraykart-b2b-node-server.iam.gserviceaccount.com",
    "client_id": "117865074769334783021",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-htg3o%40arraykart-b2b-node-server.iam.gserviceaccount.com"
  }
  );

firebaseRouter.get(
    '',
    // userJwt,
    expressAsyncHandler(async (req, res) => {
        var topic = 'general';
        var message = {
            notification: {
                title: 'Notification from node',
                body: 'hey there! check!    '
            },
            topic: topic
        };
        // Send a message to devices subscribed to the provided topic.
        await getMessaging().send(message)
        .then((response) => {
            // Response is a message ID string.
            res.status(200).send({
                success: true,
                message: 'Successfully sent message:' + response
            })
        }).catch((error) => {
            console.log('Error sending message:', error);
        });
    })
)




export default firebaseRouter;