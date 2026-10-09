import bcrypt from "bcrypt";
import mongoose from "mongoose";
import Customer from "../models/customer.model.js";
import { generateToken } from "../utils/generateToken.js";

function sendAuthenticationFailure(res) {
  return res.status(401).json({
    success: false,
    message: "Invalid credentials",
  });
}

export async function registerCustomer(req, res) {
  try {
    const { fullName, email, password, phone } = req.body ?? {};

    if (!fullName || typeof email !== "string" || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: "fullName, email, password, and phone are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "fullName, email, password, and phone are required",
      });
    }

    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const customer = await Customer.create({
      fullName,
      email: normalizedEmail,
      password: hashedPassword,
      phone,
    });

    return res.status(201).json({
      success: true,
      message: "Customer registered successfully",
      customer: {
        _id: customer._id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Customer registration failed",
    });
  }
}

export async function loginCustomer(req, res) {
  try {
    const { email, password } = req.body ?? {};

    // Reject missing or non-string credentials with the same generic message
    // so we never reveal whether the email or password was wrong.
    if (typeof email !== "string" || !email.trim() || typeof password !== "string" || !password) {
      return sendAuthenticationFailure(res);
    }

    const customer = await Customer.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!customer) {
      return sendAuthenticationFailure(res);
    }

    const isPasswordValid = await bcrypt.compare(password, customer.password);

    if (!isPasswordValid) {
      return sendAuthenticationFailure(res);
    }

    const token = generateToken(customer._id);

    const isProduction = process.env.NODE_ENV === "production";

    // httpOnly prevents JS access; maxAge keeps the cookie alive for 10 days.
    // In production, secure: true and sameSite: 'none' are required for cross-origin Netlify <-> Render requests.
    // In development/localhost, secure: false and sameSite: 'lax' allow HTTP requests to work properly.
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 10 * 24 * 60 * 60 * 1000, // 10 days in milliseconds
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Customer login failed",
    });
  }
}

export async function getAuthenticatedCustomer(req, res) {
  return res.status(200).json({
    _id: req.user._id,
    fullName: req.user.fullName,
    email: req.user.email,
    phone: req.user.phone,
  });
}

export async function logoutCustomer(req, res) {
  const isProduction = process.env.NODE_ENV === "production";
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
}
