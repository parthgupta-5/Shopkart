import { Router } from "express";
import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
} from "../controllers/wishlist.controller.js";
import { authenticateCustomer } from "../middlewares/auth.middleware.js";

const router = Router();

// All wishlist routes require authentication
router.use(authenticateCustomer);

router.post("/:productId", addToWishlist);
router.get("/", getWishlist);
router.delete("/:productId", removeFromWishlist);

export default router;
