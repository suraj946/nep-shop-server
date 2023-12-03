import { catchAsyncError } from "../middlewares/error.js";
import { Product } from "../models/productModel.js";
import { Order } from "../models/orderModel.js";
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

  const products = await Product.find(query).select("-reviews").skip((page-1)*limit).limit(limit);
  const totalProducts = await Product.countDocuments(query);

  res.status(200).json({
    success: true,
    products,
    totalProducts,
  });
});

export const getHomePageProducts = catchAsyncError(async(req, res, next)=>{
  const featuredProducts = await Product.find({ isFeatured: true })
    .select("-reviews")
    .sort({ createdAt: -1 })
    .limit(10);
  const highDiscountProducts = await Product.find({ discount: { $gt: 15 }})
    .select("-reviews")
    .sort({ createdAt: -1 })
    .limit(10);
  const highRatingProducts = await Product.find({ averageRating: { $gte: 4 }})
    .select("-reviews")
    .sort({ createdAt: -1 })
    .limit(10);
  const newArrivalProducts = await Product.find({ isNewArrival: true })
    .select("-reviews")
    .sort({ createdAt: -1 })
    .limit(10);

    res.status(200).json({
      success:true,
      featuredProducts,
      highDiscountProducts,
      highRatingProducts,
      newArrivalProducts
    });
})

export const getProductsAdmin = catchAsyncError(async (req, res, next) => {
  const {keyword, category, id, stock} = req.query;

  if(id){
    const product = await Product.findById(id).select("-reviews").populate("category");
    if(!product){
      return next (new ErrorHandler(`Product with id : ${id} not found!`, 404));
    }
    return res.status(200).json({
      success:true,
      products:[product],
      totalProductsCount:1
    });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  let query = {};

  if(category) query.category = category;
  if(keyword) query.name = {$regex:keyword, $options:"i"};

  if(stock){
    const num = parseInt(stock);
    if(num === 0){
      query = {...query, stock : {$eq:0}}
    }else{
      query = {...query, stock : {$gt:0, $lte:num}}
    }
  }
  const [products, totalProductsCount] = await Promise.all([
      Product.find(query)
      .select("-reviews")
      .populate("category")
      .skip((page-1) * limit)
      .limit(limit),
      Product.countDocuments(query)
  ]);

  res.status(200).json({
    success: true,
    products,
    totalProductsCount,
    page
  });
});

export const getUpdates = catchAsyncError(async(req, res, next) => {
  const response = await Promise.all([
    Product.countDocuments({stock : {$eq:0}}),
    Product.countDocuments({stock : {$gt:0, $lte:5}}),
    Product.countDocuments({stock : {$gt:0}}),
    Order.countDocuments({isNewOrder:true})
  ]);
  
  res.status(200).json({
    success:true,
    outOfStock:response[0],
    inStock:response[2],
    lessThanFive:response[1],
    newOrder:response[3]
  });
});

export const getSingleProductDetails = catchAsyncError(
  async (req, res, next) => {
    let product = await Product.findById(req.params.productId).populate("category reviews.user", "name avatar");

    if (!product)
      return next(new ErrorHandler("The requested product not found", 404));

    product = {...product._doc};
    const {reviews, ...rest} = product;

    res.status(200).json({
      success: true,
      product:rest,
      reviews
    });
  }
);

export const createProduct = catchAsyncError(async (req, res, next) => {
  const { name, description, price, stock, category, discount, isFeatured } = req.body;

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
    discount,
    isFeatured
  });

  res.status(200).json({
    success: true,
    message: "Product added to the store",
  });
});

export const updateProduct = catchAsyncError(async (req, res, next) => {
  const { name, description, stock, price, category, discount, isFeatured, isNewArrival } = req.body;
  const product = await Product.findById(req.params.productId);
  if (!product) return next(new ErrorHandler("Product not found", 404));

  if (name) product.name = name;
  if (description) product.description = description;
  if (stock) product.stock = stock;
  if (price) product.price = price;
  if (discount) product.discount = discount;
  if (isFeatured !== undefined) product.isFeatured = isFeatured;
  if (isNewArrival !== undefined) product.isNewArrival = isNewArrival;


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
  let image = {
    public_id: myCloud.public_id,
    url: myCloud.secure_url,
  };

  product.images.push(image);
  await product.save();

  image = product.images.filter(i => i.public_id === image.public_id)[0];

  res.status(200).json({
    success:true,
    message:"Image added to the product successfully",
    image
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
        message:"Product deleted successfully",
    });
});

export const addCategory = catchAsyncError(async(req, res, next)=>{
    const category = await Category.create(req.body);
    res.status(200).json({
        success:true,
        message:"Category Added successfully",
        category
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

export const toggleFeaturedProduct = catchAsyncError(async(req, res, next) => {
  const product = await Product.findById(req.params.productId);
  if(!product) return next(new ErrorHandler("Product not found", 404));

  product.isFeatured = !(product.isFeatured);
  await product.save();
  res.status(200).json({
    success:true,
    featured:product.isFeatured,
    message:`Product marked as ${product.isFeatured ? "featured" : "normal"} product`
  })
});

export const postReview = catchAsyncError(async(req, res, next) => {
  let product = await Product.findById(req.params.productId);
  if(!product) return next(new ErrorHandler("Product not found", 404));
  const reviewText = req.body.reviewText;
  const rating = parseInt(req.body.rating);
  let updated = false;
  let review = {};

  if(!reviewText) return next(new ErrorHandler("Review text is required", 400));
  if(rating < 1 || rating > 5) return next(new ErrorHandler("Rating should be between 1-5", 400));

  const isReviewed = product.reviews.findIndex(i => i.user.toString() === req.user._id.toString());

  if(isReviewed !== -1){
    product.reviews[isReviewed].reviewText = reviewText;
    product.reviews[isReviewed].rating = rating;
    updated = true;
  }else{
    product.reviews.push({
      reviewText,
      rating,
      user:req.user._id
    });
  }

  const totalRating = product.reviews.reduce((prev, curr) => prev+curr.rating, 0);
  product.averageRating = Math.round(totalRating/product.reviews.length);

  await product.save();

  if(!updated){
    review = product.reviews.filter(i=>i.user.toString() === req.user._id.toString())[0];
    review = {...review._doc, user:{_id:req.user._id, avatar:req.user.avatar, name:req.user.name}}
  }

  res.status(200).json({
    success:true,
    message:"Review posted on product",
    review
  });
});

export const getReviews = catchAsyncError(async(req, res, next) => {
  const product = await Product.findById(req.params.productId).populate("reviews.user", "name avatar");
  if(!product) return next(new ErrorHandler("Product not found", 404));
  res.status(200).json({
    success:true,
    reviews: product.reviews,
    productName:product.name
  });
});
