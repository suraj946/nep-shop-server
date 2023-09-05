import express from "express";
import {config} from "dotenv";
import { errorMiddleware } from "./middlewares/error.js";
import cookieParser from "cookie-parser";
import cors from "cors";

config({
    path:"./data/config.env"
});

export const app = express();

//using middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    credentials:true,
    methods:["GET", "POST", "PUT", "DELETE"],
    origin:[process.env.FRONTEND_URL_1, process.env.FRONTEND_URL_2]
}));

app.get("/",(req, res, next)=>{
    res.send(`Server is running in ${process.env.NODE_ENV} mode`);
});

//importing routers here
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/order", orderRoutes);

//using error middlerware
app.use(errorMiddleware)