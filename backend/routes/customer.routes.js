import { Router } from "express";
import {
  getAuthenticatedCustomer,
  loginCustomer,
  logoutCustomer,
  registerCustomer,
} from "../controllers/customer.controller.js";
import { authenticateCustomer } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", registerCustomer);
router.post("/login", loginCustomer);
router.get("/me", authenticateCustomer, getAuthenticatedCustomer);
router.post("/logout", authenticateCustomer, logoutCustomer);

export default router;
