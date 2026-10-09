import { Router } from "express";
import {
  createPaymentOrder,
  deletePendingOrder,
  getOrderById,
  getOrders,
  verifyPayment,
} from "../controllers/order.controller.js";
import { authenticateCustomer } from "../middlewares/auth.middleware.js";

const router = Router();

// All order endpoints require authentication
router.use(authenticateCustomer);

router.post("/create-payment-order", createPaymentOrder);
router.post("/verify-payment", verifyPayment);
router.get("/", getOrders);
router.get("/:id", getOrderById);
router.delete("/:id", deletePendingOrder);

export default router;
