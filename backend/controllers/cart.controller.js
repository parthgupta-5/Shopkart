import mongoose from "mongoose";
import Customer from "../models/customer.model.js";
import Product from "../models/product.model.js";

/**
 * Add a product to the authenticated customer's cart.
 *
 * Requirements:
 * - Validate ObjectId (400)
 * - Check product exists (404)
 * - If product is out of stock (400)
 * - If already in cart, increase quantity by 1; reject if exceeds stock (400)
 * - If not in cart, add with quantity 1
 * - Return updated populated cart
 */
export async function addToCart(req, res) {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.stock <= 0) {
      return res.status(400).json({
        success: false,
        message: "Product is out of stock",
      });
    }

    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const existingItem = customer.cart.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      if (existingItem.quantity + 1 > product.stock) {
        return res.status(400).json({
          success: false,
          message: "Cannot add more units than available in stock",
        });
      }
      existingItem.quantity += 1;
    } else {
      customer.cart.push({
        product: productId,
        quantity: 1,
      });
    }

    await customer.save();
    await customer.populate("cart.product");

    const validCart = customer.cart.filter((item) => item.product !== null);

    return res.status(200).json({
      success: true,
      message: "Product added to cart",
      cart: validCart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to add product to cart",
    });
  }
}

/**
 * Get all populated cart items for the authenticated customer.
 */
export async function getCart(req, res) {
  try {
    const customer = await Customer.findById(req.user._id).populate(
      "cart.product"
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const validCart = (customer.cart || []).filter(
      (item) => item.product !== null
    );

    return res.status(200).json({
      success: true,
      count: validCart.length,
      cart: validCart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch cart",
    });
  }
}

/**
 * Update quantity of a cart item.
 *
 * Requirements:
 * - Validate ObjectId (400)
 * - Check quantity is an integer >= 1 (400)
 * - Check product exists (404)
 * - Check item is in customer's cart (404)
 * - Check quantity does not exceed product stock (400)
 * - Update quantity and return updated populated cart
 */
export async function updateCartItemQuantity(req, res) {
  try {
    const { productId } = req.params;
    const { quantity } = req.body ?? {};

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    if (
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be an integer of at least 1",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const cartItem = customer.cart.find(
      (item) => item.product.toString() === productId
    );

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
    }

    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: "Quantity exceeds available stock",
      });
    }

    cartItem.quantity = quantity;
    await customer.save();
    await customer.populate("cart.product");

    const validCart = customer.cart.filter((item) => item.product !== null);

    return res.status(200).json({
      success: true,
      message: "Cart item quantity updated",
      cart: validCart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update cart item quantity",
    });
  }
}

/**
 * Remove a product from the customer's cart.
 *
 * Requirements:
 * - Validate ObjectId (400)
 * - Check product in customer's cart (404)
 * - Remove item and return updated populated cart (200)
 */
export async function removeFromCart(req, res) {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const itemIndex = customer.cart.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
    }

    customer.cart.splice(itemIndex, 1);
    await customer.save();
    await customer.populate("cart.product");

    const validCart = customer.cart.filter((item) => item.product !== null);

    return res.status(200).json({
      success: true,
      message: "Product removed from cart",
      cart: validCart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to remove product from cart",
    });
  }
}
