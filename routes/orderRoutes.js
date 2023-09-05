import express from "express";
import {
  createOrder,
  getAdminOrders,
  getMyOrders,
  getOrderDetails,
  processOrder,
  processPayment,
} from "../controllers/orderController.js";
import { authenticate, isAdmin } from "../middlewares/auth.js";
const router = express.Router();

router.post("/new", authenticate, createOrder);
router.post("/payment", authenticate, processPayment);
router.get("/my", authenticate, getMyOrders);
router.get("/admin", authenticate, isAdmin, getAdminOrders);

router
  .route("/single/:orderId")
  .get(authenticate, getOrderDetails)
  .put(authenticate, isAdmin, processOrder);

export default router;
