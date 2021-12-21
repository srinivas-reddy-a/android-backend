import express from "express";
import userRouter from "./routers/userRouter.js";
import productRouter from "./routers/productRouter.js";
import orderRouter from "./routers/orderRouter.js";

const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.json());
app.use(express.urlencoded({extended:true}));


app.use('/api/user/', userRouter);
app.use('/api/product/', productRouter);
app.use('/api/order/', orderRouter);

app.use((err, req, res, next) => {
    
    res.status(500).send({ message: err.message });
  });

app.listen(PORT);