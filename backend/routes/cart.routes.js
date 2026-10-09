import { Router } from "express";
import {
  addToCart,
  getCart,
  removeFromCart,
  updateCartItemQuantity,
} from "../controllers/cart.controller.js";
import { authenticateCustomer } from "../middlewares/auth.middleware.js";

const router = Router();

// All cart routes require authentication
router.use(authenticateCustomer);

router.post("/:productId", addToCart);
router.get("/", getCart);
router.patch("/:productId", updateCartItemQuantity);
router.delete("/:productId", removeFromCart);

export default router;
