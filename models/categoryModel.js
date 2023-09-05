import mongoose from "mongoose";

const schema = new mongoose.Schema({
    name:{
        type:String,
        required:[true, "Category name is required"]
    },
});

export const Category = mongoose.model("Category", schema);