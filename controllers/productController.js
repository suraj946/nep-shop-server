import { catchAsyncError } from "../middlewares/error.js";
import { Product } from "../models/productModel.js";
import { ErrorHandler } from "../utils/ErrorHandler.js";
import { Category } from "../models/categoryModel.js";
import { getDataUri } from "../utils/helperFunctions.js";
import cloudinary from "cloudinary";

export const getProducts = catchAsyncError(async (req, res, next) => {
  const {keyword, category} = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  const query = {};
  if(category) query.category = category;
  if(keyword) query.name = {$regex:keyword, $options:"i"};

  const products = await Product.find(query).skip((page-1)*limit).limit(limit);
  const totalProducts = await Product.countDocuments(query);

  res.status(200).json({
    success: true,
    products,
    totalProducts,
  });
});

export const getProductsAdmin = catchAsyncError(async (req, res, next) => {
  const products = await Product.find({}).populate("category");

  const outOfStock = products.filter(i => i.stock === 0);

  res.status(200).json({
    success: true,
    products,
    outOfStock:outOfStock.length,
    inStock:products.length - outOfStock.length,
  });
});

export const getSingleProductDetails = catchAsyncError(
  async (req, res, next) => {
    const product = await Product.findById(req.params.productId).populate("category");

    if (!product)
      return next(new ErrorHandler("The requested product not found", 404));

    res.status(200).json({
      success: true,
      product,
    });
  }
);

export const createProduct = catchAsyncError(async (req, res, next) => {
  const { name, description, price, stock, category } = req.body;

  if (category) {
    const cate = await Category.findById(category);
    if (!cate) return next(new ErrorHandler("Category not found", 404));
  }

  if (!req.file)
    return next(
      new ErrorHandler("At least one image of the product is required", 400)
    );

  const fileAsDataUri = getDataUri(req.file);
  const myCloud = await cloudinary.v2.uploader.upload(fileAsDataUri.content, {
    folder: "nepShopProductImg",
  });
  const image = {
    public_id: myCloud.public_id,
    url: myCloud.secure_url,
  };

  await Product.create({
    name,
    description,
    price,
    stock,
    category,
    images: [image],
  });

  res.status(200).json({
    success: true,
    message: "Product added to the store",
  });
});

export const updateProduct = catchAsyncError(async (req, res, next) => {
  const { name, description, stock, price, category } = req.body;
  const product = await Product.findById(req.params.productId);
  if (!product) return next(new ErrorHandler("Product not found", 404));

  if (name) product.name = name;
  if (description) product.description = description;
  if (stock) product.stock = stock;
  if (price) product.price = price;
  if (category) {
    const cate = await Category.findById(category);
    if (!cate) return next(new ErrorHandler("Category not found", 404));
    product.category = category;
  }

  await product.save();

  res.status(200).json({
    success: true,
    message: "Product updated successfully",
  });
});

export const addImage = catchAsyncError(async (req, res, next) => {
  const product = await Product.findById(req.params.productId);
  if (!product) return next(new ErrorHandler("Product not found", 404));

  if (!req.file)
    return next(new ErrorHandler("Please provide an image to add", 400));

  const fileAsDataUri = getDataUri(req.file);
  const myCloud = await cloudinary.v2.uploader.upload(fileAsDataUri.content, {
    folder: "nepShopProductImg",
  });
  const image = {
    public_id: myCloud.public_id,
    url: myCloud.secure_url,
  };

  product.images.push(image);
  await product.save();

  res.status(200).json({
    success:true,
    message:"Image added to the product successfully"
  });

});

export const deleteImage = catchAsyncError(async(req, res, next)=>{
    const product = await Product.findById(req.params.productId);
    if (!product) return next(new ErrorHandler("Product not found", 404));

    const id = req.query.id;
    if(!id) return next(new ErrorHandler("Image id is required to delete an image", 400));

    let imgIndex = -1;

    product.images.forEach((item, index)=>{
        if(item._id.toString() === id.toString()){
            imgIndex = index;
        }
    });

    await cloudinary.v2.uploader.destroy(product.images[imgIndex].public_id);
    product.images.splice(imgIndex, 1);
    await product.save();

    res.status(200).json({
        success:true,
        message:"Image deleted successfully",
    });
});

export const deleteProduct = catchAsyncError(async(req, res, next)=>{
    const product = await Product.findById(req.params.productId);
    if (!product) return next(new ErrorHandler("Product not found", 404));

    for(let i = 0; i < product.images.length; i++){
        await cloudinary.v2.uploader.destroy(product.images[i].public_id);
    }
    await product.deleteOne();

    res.status(200).json({
        success:true,
        message:"Image deleted successfully",
    });
});

export const addCategory = catchAsyncError(async(req, res, next)=>{
    await Category.create(req.body);
    res.status(200).json({
        success:true,
        message:"Category Added successfully"
    });
});

export const getAllCategories = catchAsyncError(async(req, res, next)=>{
    const categories = await Category.find({});

    res.status(200).json({
        success:true,
        categories
    });
});

export const deleteCategory = catchAsyncError(async(req, res, next)=>{
    const category = await Category.findById(req.params.categoryId);
    if(!category) return next(new ErrorHandler("Category not found", 404));

    const products = await Product.find({category:category._id});

    for(let i = 0; i < products.length; i++){
        const product = products[i];
        product.category = undefined;
        await product.save();
    }

    await category.deleteOne();

    res.status(200).json({
        success:true,
        message:"category deleted successfully"
    });
});