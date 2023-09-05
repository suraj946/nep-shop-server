import express from "express";
import {
    addCategory,
    addImage,
    createProduct,
    deleteCategory,
    deleteImage,
    deleteProduct,
    getAllCategories,
    getProducts,
    getProductsAdmin,
    getSingleProductDetails,
    updateProduct,
} from "../controllers/productController.js";
import { authenticate, isAdmin } from "../middlewares/auth.js";
import { singleUpload } from "../middlewares/multer.js";

const router = express.Router();

router.route("/all").get(getProducts);
router.route("/admin").get(authenticate, isAdmin, getProductsAdmin);
router
  .route("/single/:productId")
  .get(getSingleProductDetails)
  .put(authenticate, isAdmin, updateProduct)
  .delete(authenticate, isAdmin, deleteProduct);
router.route("/new").post(authenticate, isAdmin, singleUpload, createProduct);

router
  .route("/images/:productId")
  .post(authenticate, isAdmin, singleUpload, addImage)
  .delete(authenticate, isAdmin, deleteImage);

router.route("/categories").get(getAllCategories);
router.route("/category").post(authenticate, isAdmin, addCategory);
router.route("/category/:categoryId").delete(authenticate, isAdmin, deleteCategory);

export default router;
