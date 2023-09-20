import DataUriParser from "datauri/parser.js";
import path from "path";
import {createTransport} from "nodemailer";

export const sendToken = (user, res, message, statusCode) => {
  const token = user.generateToken();

  res
    .status(statusCode)
    .cookie("token", token, {
      ...cookieOptions,
      expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    })
    .json({
      success: true,
      message: message,
      user
    });
};

export const cookieOptions = {
  secure: process.env.NODE_ENV === "development" ? false : true,
  httpOnly: process.env.NODE_ENV === "development" ? false : true,
  sameSite: process.env.NODE_ENV === "development" ? false : "none",
};

export const getDataUri = (file) => {
  const parser = new DataUriParser();
  const extName = path.extname(file.originalname).toString();
  return parser.format(extName, file.buffer);
};

export const sendEmail = async ({toEmail, subject, otp}) => {
  const transporter = createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    to: toEmail,
    subject,
    html:`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            margin-top: 20px;
          }
          h1 {
            color: #ff0040;
            text-align: center;
            margin-bottom: 20px;
          }
          p {
            color: #555;
            text-align: center;
            font-size: 20px;
          }
          .otp-box {
            margin: 20px auto;
            padding: 10px;
            text-align: center;
            background-color: #ffd2d2;
            border-radius: 50px 10px;
            width: 85%;
          }
          .app-name {
            color: #fff;
            text-align: center;
            background-color: #ff0040;
            width: 120px;
            margin: 20px auto;
            padding: 10px;
            border-radius: 12px 0px;
          }
        </style>
      </head>
      <body>
        <div class="container">
            <p class="app-name">${process.env.APP_NAME}</p>
          <h1>Password Recovery</h1>
          <p>Use the following OTP to reset your password</p>
          <div class="otp-box">
            <p>Your OTP : <strong>${otp}</strong></p>
          </div>
        </div>
      </body>
    </html>
    
    `
  });
};

