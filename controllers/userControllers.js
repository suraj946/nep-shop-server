import { catchAsyncError } from "../middlewares/error.js";
import { User } from "../models/userModel.js";
import { ErrorHandler } from "../utils/ErrorHandler.js";
import { cookieOptions, getDataUri, sendEmail, sendToken } from "../utils/helperFunctions.js";
import cloudinary from "cloudinary";

export const register = catchAsyncError(async (req, res, next) => {
  const { name, email, password, address, city, country, phone } = req.body;
  let user = await User.findOne({ email });

  if (user) return next(new ErrorHandler("This email already exists", 400));

  let avatar = undefined;
  if(req.file){
    const fileAsDataUri = getDataUri(req.file);
    const myCloud = await cloudinary.v2.uploader.upload(fileAsDataUri.content, {folder: "nepShopAvatars"});
    avatar={
      public_id : myCloud.public_id,
      url : myCloud.secure_url
    }
  }
  user = await User.create({
    name,
    email,
    password,
    address,
    city,
    country,
    phone,
    avatar
  });

  sendToken(user, res, "Registered successfully", 201);
});

export const login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  if(!password) return next(new ErrorHandler("Password is required", 400));

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Incorrect email password", 400));
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return next(new ErrorHandler("Incorrect email password", 400));
  }
  const token = user.generateToken();
  sendToken(user, res, `Welcome back, ${user.name}`, 200);
});

export const getMyProfile = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({
    success: true,
    user,
  });
});

export const logout = catchAsyncError((req, res, next) => {
  res
    .status(200)
    .cookie("token", "", {
      ...cookieOptions,
      expires: new Date(Date.now()),
    })
    .json({
      success: true,
      message: "Logged Out successfully",
    });
});

export const updatePassword = catchAsyncError(async(req, res, next)=>{
  const user = await User.findById(req.user._id);
  const {name, email, address, city, pinCode, country, phone} = req.body;

  if(name) user.name = name;
  if(email) user.email = email;
  if(address) user.address = address;
  if(city) user.city = city;
  if(pinCode) user.pinCode = pinCode;
  if(country) user.country = country;
  if(phone) user.phone = phone;

  await user.save();
  res.status(200).json({
      success:true,
      message:"Profile updated successfully"
  });
});

export const changePassword = catchAsyncError(async(req, res, next)=>{
  const user = await User.findById(req.user._id).select("+password");
  const {oldPassword, newPassword} = req.body;

  if(!oldPassword || !newPassword) return next(new ErrorHandler("Old password and new password is required", 400));

  const isMatch = await user.comparePassword(oldPassword);
  if(!isMatch){
      return next(new ErrorHandler("Incorrect old password", 400));
  }
  user.password = newPassword;
  await user.save();
  res.status(200).json({
      success:true,
      message:"Password changed successfully"
  });
});

export const updatePic = catchAsyncError(async(req, res, next)=>{
  const user = await User.findById(req.user._id);
  await cloudinary.v2.uploader.destroy(user.avatar.public_id);

  const fileAsDataUri = getDataUri(req.file);
  const myCloud = await cloudinary.v2.uploader.upload(fileAsDataUri.content, {folder: "nepShopAvatars"});

  user.avatar={
    public_id : myCloud.public_id,
    url : myCloud.secure_url
  }
  await user.save();
  res.status(200).json({
    success:true,
    message:"Profile pic updated"
  });
});

export const forgotPassword = catchAsyncError(async(req, res, next) => {
  const {email} = req.body;
  const user = await User.findOne({email});
  if(!user) return next(new ErrorHandler("User not found", 404));
  
  const otp = Math.floor(Math.random() * (999999-100000)+100000);
  const otp_expire = 15*60*1000;
  user.otp = otp;
  user.otp_expire = new Date(Date.now() + otp_expire);
  await user.save();

  try {
      await sendEmail({
      toEmail: email,
      subject:`${process.env.APP_NAME} Password Recovery Mail`,
      otp,
    });
  } catch (error) {
    user.otp = undefined;
    user.otp_expire = undefined;
    await user.save();
    console.log(error);
    return next(error);
  }

  res.status(200).json({
    success:true,
    message:`Email sent to ${email}`
  });

});

export const resetPassword = catchAsyncError(async(req, res, next) => {
  const {otp, password} = req.body;
  if(!password) return next(new ErrorHandler("New password is required to reset your password", 400));
  const user = await User.findOne({
    otp,
    otp_expire:{
      $gt:Date.now()
    }
  });
  if(!user) return next(new ErrorHandler("Invalid otp or the otp has been expired", 400));

  user.password = password;
  user.otp = undefined;
  user.otp_expire = undefined;
  await user.save();

  res.status(200).json({
    success:true,
    message:"You password has been reset, You can login with the new one"
  });
});