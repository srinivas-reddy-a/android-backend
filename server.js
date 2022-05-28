import express from "express";
import userRouter from "./routers/userRouter.js";
import productRouter from "./routers/productRouter.js";
import orderRouter from "./routers/orderRouter.js";
import cartRouter from "./routers/cartRouter.js";
import wishListRouter from "./routers/wishListRouterr.js";
import brandRouter from "./routers/brandRounter.js";
import inventoryRouter from "./routers/inventoryRouter.js";
import cropRouter from "./routers/cropRouter.js";
import bugRouter from "./routers/bugRouter.js";
import kycRouter from "./routers/kycRouter.js";

import cors from "cors";
import multer from "multer";

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cors());

app.use('/api/brand/', brandRouter);
app.use('/api/user/', userRouter);
app.use('/api/product/', productRouter);
app.use('/api/order/', orderRouter);
app.use('/api/cart/', cartRouter);
app.use('/api/wishlist/', wishListRouter);
app.use('/api/inventory/', inventoryRouter);
app.use('/api/crop/', cropRouter);
app.use('/api/bug/', bugRouter);
app.use('/api/kyc/', kycRouter);

app.use((err, req, res, next) => {
  if(err instanceof multer.MulterError){
    if(err.code === "LIMIT_FILE_SIZE" ){
      res.status(500).send({
        succcess:false,
        message:"File is too large!"
      })
    }
    if(err.code === "LIMIT_FILE_COUNT"){
      res.status(500).send({
        success:false,
        message:"File limit reached!"
      })
    }
    if(err.code === "LIMIT_UNEXPECTED_FILE"){
      res.status(500).send({
        success:true,
        message:"File must be an image!"
      })
    }
  }
    res.status(500).send({
      succcess:false,
      message: err.message
    });
  });

app.listen(PORT);