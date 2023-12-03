import express from "express";
import {
    addCategory,
    addImage,
    createProduct,
    deleteCategory,
    deleteImage,
    deleteProduct,
    getAllCategories,
    getHomePageProducts,
    getProducts,
    getProductsAdmin,
    getReviews,
    getSingleProductDetails,
    getUpdates,
    postReview,
    toggleFeaturedProduct,
    updateProduct,
} from "../controllers/productController.js";
import { authenticate, isAdmin } from "../middlewares/auth.js";
import { singleUpload } from "../middlewares/multer.js";

const router = express.Router();

router.route("/all").get(getProducts);
router.route("/gethomeproducts").get(getHomePageProducts);
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

router.route("/togglefeature/:productId").put(authenticate, isAdmin, toggleFeaturedProduct);
router
  .route("/review/:productId")
  .post(authenticate, postReview)
  .get(getReviews);

router.get("/getupdates", authenticate, isAdmin, getUpdates);

export default router;
