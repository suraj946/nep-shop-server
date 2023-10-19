import mongoose from "mongoose";
import validator from "validator";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

const schema = new mongoose.Schema({
    name:{
        type:String,
        required:[true, "Name is required"]
    },
    email:{
        type:String,
        required:[true, "Email is required"],
        unique:[true, "This email already exist"],
        validate:validator.isEmail,
    },
    password:{
        type:String,
        required:[true,"Password is required"],
        minLength:[6, "Password must be 6 characters long"],
        select:false
    },
    address:{
        type:String,
        required:true
    },
    city:{
        type:String,
        required:true
    },
    country:{
        type:String,
        required:true
    },
    pinCode:{
        type:String,
    },
    phone:{
        type:String,
        required:[true, "Phone number is required"],
        validate:validator.isMobilePhone
    },
    role:{
        type:String,
        enum:["admin", "user"],
        default:"user"
    },
    avatar:{
        public_id:String,
        url:String
    },
    otp:Number,
    otp_expire:Date
});

schema.pre("save", async function(next){
    if(!this.isModified("password")){
        next();
    }
    this.password = await bcryptjs.hash(this.password, 10);
});

schema.methods.comparePassword = async function(enteredPassword){
    return await bcryptjs.compare(enteredPassword, this.password);
}

schema.methods.generateToken = function(){
    return jwt.sign({_id:this._id},process.env.JWT_SECRET, {
        expiresIn:"15d"
    });
}

export const User = mongoose.model("User", schema);