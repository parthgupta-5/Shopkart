import { Router } from "express";
import {
  createProduct,
  getAllProducts,
  getProductById,
} from "../controllers/product.controller.js";

const router = Router();

router.get("/", getAllProducts);
router.post("/", createProduct);
router.get("/:id", getProductById);

export default router;
