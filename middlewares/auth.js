import jwt from "jsonwebtoken";
import { ErrorHandler } from "../utils/ErrorHandler.js";
import { catchAsyncError } from "./error.js";
import { User } from "../models/userModel.js";

export const authenticate = catchAsyncError(async(req, res, next)=>{
    const {token} = req.cookies;
    if(!token) return next(new ErrorHandler("You need to be logged in", 401));

    const decodedData = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decodedData._id);

    next();
});

export const isAdmin = catchAsyncError(async(req, res, next)=>{
    if(req.user.role !== "admin") return next(new ErrorHandler("Only admin can access this resources", 403));
    next();
})