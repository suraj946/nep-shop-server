import { catchAsyncError } from "../middlewares/error.js";
import { Order } from "../models/orderModel.js";
import { Product } from "../models/productModel.js";
import { ErrorHandler } from "../utils/ErrorHandler.js";
import {stripe} from "../server.js";

export const processPayment = catchAsyncError(async(req, res, next)=>{
    const {totalAmount} = req.body;
    if(!totalAmount) return next(new ErrorHandler("Totam amount is required for payment", 400));
    const {client_secret} = await stripe.paymentIntents.create({
        amount:Number(totalAmount * 100),
        currency:"inr"
    });

    res.status(200).json({
        success:true,
        client_secret
    })
})

export const createOrder = catchAsyncError(async (req, res, next) => {
  const {
    shippingInfo,
    orderItems,
    paymentMethod,
    paymentInfo,
    itemsPrice,
    tax,
    shippingCharges,
    totalAmount,
  } = req.body;

  await Order.create({
    user:req.user._id,
    shippingInfo,
    orderItems,
    paymentMethod,
    paymentInfo,
    itemsPrice,
    tax,
    shippingCharges,
    totalAmount,
  });

  for(let i = 0; i < orderItems.length; i++){
    const product = await Product.findById(orderItems[i].product);
    product.stock -= orderItems[i].quantity;
    await product.save();
  }

  res.status(201).json({
    success:true,
    message:"Your order has been placed"
  })
});

export const getMyOrders = catchAsyncError(async(req, res, next)=>{
    const orders = await Order.find({user:req.user._id});

    res.status(200).json({
        success:true,
        orders
    })
})

export const getAdminOrders = catchAsyncError(async(req, res, next)=>{
    const orders = await Order.find({});

    res.status(200).json({
        success:true,
        orders
    })
})

export const getOrderDetails = catchAsyncError(async(req, res, next)=>{
    const order = await Order.findById(req.params.orderId);
    if(!order) return next(new ErrorHandler("Order not found", 404));
    res.status(200).json({
        success:true,
        order
    })
})

export const processOrder = catchAsyncError(async(req, res, next)=>{
    const order = await Order.findById(req.params.orderId);
    if(!order) return next(new ErrorHandler("Order not found", 404));

    let updatedStatus = order.orderStatus;

    if(order.orderStatus === "Processing"){
        order.orderStatus = "Shipped";
        updatedStatus = "Shipped";
    }else if(order.orderStatus === "Shipped"){
        order.orderStatus = "Delivered";
        order.deliveredAt = new Date(Date.now());
        updatedStatus = "Delivered"
    }else{
        return next(new ErrorHandler("This order has already been delivered", 400));
    }

    await order.save();

    res.status(200).json({
        success:true,
        message:"Order status has been changed successfully",
        updatedStatus
    })
})

