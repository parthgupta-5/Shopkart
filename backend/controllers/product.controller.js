import mongoose from "mongoose";
import Product from "../models/product.model.js";

export async function getAllProducts(req, res) {
  try {
    const { search, category } = req.query;
    const query = {};

    if (typeof search === "string" && search.trim()) {
      query.name = {
        $regex: search.trim(),
        $options: "i",
      };
    }

    if (typeof category === "string" && category.trim()) {
      query.category = category.trim();
    }

    const products = await Product.find(query);

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
}

export async function getProductById(req, res) {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid product ID",
    });
  }

  try {
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
}

export async function createProduct(req, res) {
  try {
    const { name, description, price, category, image, stock } = req.body ?? {};

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof description !== "string" ||
      !description.trim() ||
      typeof category !== "string" ||
      !category.trim() ||
      typeof image !== "string" ||
      !image.trim() ||
      price === undefined ||
      price === null ||
      stock === undefined ||
      stock === null
    ) {
      return res.status(400).json({
        success: false,
        message: "name, description, price, category, image, and stock are required",
      });
    }

    if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be greater than 0",
      });
    }

    if (typeof stock !== "number" || !Number.isFinite(stock) || stock < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock cannot be negative",
      });
    }

    const product = await Product.create({
      name,
      description,
      price,
      category,
      image,
      stock,
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: {
        _id: product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        image: product.image,
        stock: product.stock,
        createdAt: product.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Product creation failed",
    });
  }
}
