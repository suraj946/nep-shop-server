import express from "express";
import { changePassword, forgotPassword, getMyProfile, login, logout, register, resetPassword, updatePic, updateProfile } from "../controllers/userControllers.js";
import { authenticate } from "../middlewares/auth.js";
import { singleUpload } from "../middlewares/multer.js";

const router = express.Router();

router.route("/login").post(login);
router.route("/signup").post(singleUpload, register);
router.route("/me").get(authenticate, getMyProfile);
router.route("/logout").get(authenticate, logout);

router.route("/updateprofile").put(authenticate, updateProfile);
router.route("/changepassword").put(authenticate, changePassword);
router.route("/updatepic").put(authenticate, singleUpload, updatePic);
router.route("/forgotpassword").post(forgotPassword);
router.route("/resetpassword").put(resetPassword);

export default router;