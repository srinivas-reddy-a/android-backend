import express from "express";
import userRouter from "./routers/userRouter.js";

const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.json());
app.use(express.urlencoded({extended:true}));


app.use('/api/user/', userRouter);

app.use((err, req, res, next) => {
    res.status(500).send({ message: err.message });
  });

app.listen(PORT);