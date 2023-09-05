import {app} from "./app.js";
import { connectDB } from "./data/database.js";
import cloudinary from "cloudinary";
import Stripe from "stripe";

cloudinary.v2.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

connectDB();

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.listen(process.env.PORT, ()=>{
    console.log(`Server is running on port : ${process.env.PORT} on ${process.env.NODE_ENV} mode`);
});