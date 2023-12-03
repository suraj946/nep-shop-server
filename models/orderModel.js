import mongoose from "mongoose";
import validator from "validator";

const schema = new mongoose.Schema({
    shippingInfo:{
        address:{
            type:String,
            required:[true, "Address is required"]
        },
        city:{
            type:String,
            required:[true, "City is required"]
        },
        country:{
            type:String,
            required:[true, "Country is required"]
        },
        pinCode:{
            type:Number,
        },
        phone:{
            type:String,
            required:[true, "Phone number is required"],
            validate:validator.isMobilePhone
        },
    },

    orderItems:[
        {
            name:{
                type:String,
                required:[true, "Name of product is required"]
            },
            price:{
                type:Number,
                required:[true, "Price of product is required"]
            },
            quantity:{
                type:Number,
                required:[true, "Quantity of product is required"]
            },
            image:{
                type:String,
                required:[true, "image url of product is required"]
            },
            product:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"Product",
                required:[true, "product id of product is required"]
            }
        }
    ],
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:[true, "User id for an order is required"]
    },
    paymentMethod:{
        type:String,
        enum:["COD", "ONLINE"],
        default:"COD"
    },
    paidAt:Date,
    paymentInfo:{
        id:String,
        status:String
    },
    itemsPrice:{
        type:Number,
        required:[true, "Items price is required"]
    },
    tax:{
        type:Number,
        required:[true, "Tax price is required"]
    },
    shippingCharges:{
        type:Number,
        required:[true, "Shipping charges is required"]
    },
    totalAmount:{
        type:Number,
        required:[true, "Total price is required"]
    },
    orderStatus:{
        type:String,
        enum:["Processing", "Shipped", "Delivered"],
        default:"Processing"
    },
    deliveredAt:Date,
    createdAt:{
        type:Date,
        default:Date.now
    },
    isNewOrder:{
        type:Boolean,
        default:true
    }
});

export const Order = mongoose.model("Order", schema);