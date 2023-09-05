import mongoose from "mongoose";

export const connectDB = async()=>{
    try {
        const {connection} = await mongoose.connect(process.env.MONGO_URI);
        console.log(`Database connected successfully to host : ${connection.host}`);
    } catch (error) {
        console.log(`Some error occured : ${error}`);
    }
}