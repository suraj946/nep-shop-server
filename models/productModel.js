import mongoose from "mongoose";

const schema = new mongoose.Schema({
    name:{
        type:String,
        required:[true, "Name of a product is required"]
    },
    description:{
        type:String,
        required:[true, "Description of a product is required"]
    },
    price:{
        type:Number,
        required:[true, "Price of a product is required"]
    },
    stock:{
        type:Number,
        required:[true, "Stock of a product is required"]
    },
    images:[
        {
            public_id:String,
            url:String
        }
    ],
    category:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Category'
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
    isFeatured:{
        type:Boolean,
        default:false
    },
    discount:{
        type:Number,
        default:0
    },
    averageRating:{
        type:Number,
        default:0
    },
    reviews:[
        {
            user:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"User"
            },
            reviewText:String,
            rating:Number
        }
    ],
    isNewArrival:{
        type:Boolean,
        default:true
    }

});

export const Product = mongoose.model("Product", schema);