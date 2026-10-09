import crypto from "crypto";
import mongoose from "mongoose";
import Order from "../models/order.model.js";
import Customer from "../models/customer.model.js";
import Product from "../models/product.model.js";
import { getRazorpayInstance, isRazorpayConfigured } from "../utils/razorpay.js";

/**
 * Create a payment order for the authenticated customer.
 *
 * Requirements:
 * - Fail safely if Razorpay credentials are missing, invalid, or placeholders
 * - Validate shipping details
 * - Use authenticated customer's persisted cart (reject empty)
 * - Load latest Product documents to check availability and stock
 * - Calculate true total on backend (in rupees and paise)
 * - Build immutable purchase-time snapshots
 * - Create ShopKart order (status: PENDING_PAYMENT, paymentStatus: PENDING)
 * - Create genuine Razorpay order
 * - Clean up local order if Razorpay creation fails (do not leave unexplained pending orders)
 * - Return safe checkout data (shopKartOrderId, razorpayOrderId, amount, currency, keyId)
 * - Preserve cart at this stage
 */
export async function createPaymentOrder(req, res) {
  let createdOrder = null;
  try {
    // 1. Verify Razorpay configuration first
    if (!isRazorpayConfigured()) {
      return res.status(500).json({
        success: false,
        message: "Payment gateway is not configured or unavailable. Please try again later.",
      });
    }

    const { shippingAddress } = req.body ?? {};

    // 2. Validate shipping address
    if (!shippingAddress || typeof shippingAddress !== "object") {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required",
      });
    }

    const {
      fullName,
      phone,
      addressLine1,
      addressLine2 = "",
      city,
      state,
      pincode,
    } = shippingAddress;

    if (
      !fullName?.trim() ||
      !phone?.trim() ||
      !addressLine1?.trim() ||
      !city?.trim() ||
      !state?.trim() ||
      !pincode?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All required shipping fields (fullName, phone, addressLine1, city, state, pincode) must be provided",
      });
    }

    // 3. Load authenticated customer and verify cart
    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (!customer.cart || customer.cart.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // 4. Load latest Product documents from DB and build purchase-time snapshots
    const itemSnapshots = [];
    let calculatedTotal = 0;

    for (const cartItem of customer.cart) {
      const product = await Product.findById(cartItem.product);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${cartItem.product} is no longer available`,
        });
      }

      if (product.stock < cartItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product "${product.name}". Available stock: ${product.stock}, requested: ${cartItem.quantity}`,
        });
      }

      const itemTotal = product.price * cartItem.quantity;
      calculatedTotal += itemTotal;

      itemSnapshots.push({
        product: product._id,
        name: product.name,
        image: product.image,
        price: product.price,
        quantity: cartItem.quantity,
      });
    }

    // 5. Create ShopKart order in database
    createdOrder = await Order.create({
      customer: req.user._id,
      items: itemSnapshots,
      shippingAddress: {
        fullName: fullName.trim(),
        phone: phone.trim(),
        addressLine1: addressLine1.trim(),
        addressLine2: (addressLine2 || "").trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
      },
      totalAmount: calculatedTotal,
      paymentStatus: "PENDING",
      status: "PENDING_PAYMENT",
    });

    // 6. Create Razorpay Test Mode order in paise
    const amountInPaise = Math.round(calculatedTotal * 100);
    let razorpayOrder;

    try {
      const razorpay = getRazorpayInstance();
      razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: createdOrder._id.toString(),
      });
    } catch (rzpErr) {
      // Keep provider diagnostics in server logs only. The browser receives a
      // generic message so implementation details and credentials stay private.
      console.error("Razorpay order creation failed", {
        status: rzpErr?.statusCode ?? rzpErr?.status ?? null,
        code: rzpErr?.error?.code ?? rzpErr?.code ?? null,
        description: rzpErr?.error?.description ?? rzpErr?.message ?? "Unknown error",
      });

      // Clean up the local order to avoid orphaned pending orders on gateway failure
      if (createdOrder?._id) {
        await Order.findByIdAndDelete(createdOrder._id);
        createdOrder = null;
      }
      return res.status(500).json({
        success: false,
        message: "Failed to initialize payment gateway order. Please try again later.",
      });
    }

    // 7. Store Razorpay order ID on the ShopKart order
    createdOrder.razorpayOrderId = razorpayOrder.id;
    await createdOrder.save();

    return res.status(201).json({
      success: true,
      shopKartOrderId: createdOrder._id,
      orderId: createdOrder._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    if (createdOrder?._id) {
      await Order.findByIdAndDelete(createdOrder._id);
    }
    return res.status(500).json({
      success: false,
      message: "Failed to create payment order. Please try again.",
    });
  }
}

/**
 * Verify payment signature from Razorpay.
 *
 * Requirements:
 * - Request payload contract: { shopKartOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * - Verify ShopKart order belongs to authenticated customer
 * - Confirm browser-supplied razorpay_order_id matches database-stored razorpayOrderId
 * - Validate HMAC SHA-256 signature using crypto (no mock signature bypass)
 * - Safe concurrent stock handling: revalidate and atomically decrement stock before finalizing
 * - If stock insufficient, do not mark paid or clear cart; rollback any partial decrements
 * - Set paymentStatus: PAID, status: PLACED
 * - Clear customer cart only after verified payment and stock secured
 * - Idempotency: duplicate calls never re-decrement stock or throw error
 */
export async function verifyPayment(req, res) {
  try {
    const shopKartOrderId = req.body?.shopKartOrderId || req.body?.orderId;
    const razorpay_order_id = req.body?.razorpay_order_id || req.body?.razorpayOrderId;
    const razorpay_payment_id = req.body?.razorpay_payment_id || req.body?.razorpayPaymentId;
    const razorpay_signature = req.body?.razorpay_signature || req.body?.razorpaySignature;

    if (!shopKartOrderId || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "shopKartOrderId, razorpay_payment_id, and razorpay_signature are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(shopKartOrderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findById(shopKartOrderId);
    if (!order || order.customer.toString() !== req.user._id.toString()) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Idempotency: If already verified and paid, return success without re-deducting stock
    if (order.paymentStatus === "PAID") {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        order,
      });
    }

    // Confirm browser-supplied razorpay_order_id matches stored order ID
    if (razorpay_order_id && razorpay_order_id !== order.razorpayOrderId) {
      return res.status(400).json({
        success: false,
        message: "Razorpay order reference mismatch",
      });
    }

    // Validate Razorpay signature using HMAC SHA-256 with stored razorpayOrderId
    const secret = process.env.RAZORPAY_KEY_SECRET?.trim() || "";
    if (!secret) {
      return res.status(500).json({
        success: false,
        message: "Payment verification configuration error",
      });
    }

    const payload = `${order.razorpayOrderId}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      order.paymentStatus = "FAILED";
      await order.save();

      // Return 400, leave customer cart intact
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // Safe stock deduction: Atomically decrement stock for each product where stock >= quantity
    const updatedProducts = [];
    let stockShortageItem = null;

    for (const item of order.items) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { returnDocument: "after" }
      );

      if (!updated) {
        stockShortageItem = item;
        break;
      }

      updatedProducts.push({
        productId: item.product,
        quantity: item.quantity,
      });
    }

    // If any product had insufficient stock, rollback already-decremented items
    if (stockShortageItem) {
      for (const up of updatedProducts) {
        await Product.findByIdAndUpdate(up.productId, {
          $inc: { stock: up.quantity },
        });
      }

      // Do NOT mark order paid or clear cart
      return res.status(409).json({
        success: false,
        message: `Insufficient stock for product "${stockShortageItem.name}". Order could not be finalized.`,
      });
    }

    // Mark order as paid and placed
    order.paymentStatus = "PAID";
    order.status = "PLACED";
    order.razorpayPaymentId = razorpay_payment_id;
    await order.save();

    // Clear customer cart only after successful verification & stock secured
    const customer = await Customer.findById(req.user._id);
    if (customer) {
      customer.cart = [];
      await customer.save();
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Payment verification failed. Please try again.",
    });
  }
}

/**
 * Get all orders for the authenticated customer (newest first).
 */
export async function getOrders(req, res) {
  try {
    const orders = await Order.find({ customer: req.user._id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
}

/**
 * Get single order details with ownership verification.
 */
export async function getOrderById(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findOne({
      _id: id,
      customer: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order",
    });
  }
}

/**
 * Remove an abandoned payment attempt for the authenticated customer.
 * Paid/placed orders are immutable purchase records and can never be deleted.
 */
export async function deletePendingOrder(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findOne({
      _id: id,
      customer: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (
      order.paymentStatus !== "PENDING" ||
      order.status !== "PENDING_PAYMENT"
    ) {
      return res.status(409).json({
        success: false,
        message: "Only pending payment orders can be deleted",
      });
    }

    await order.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Pending order deleted",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete pending order",
    });
  }
}
