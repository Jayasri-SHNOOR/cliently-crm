
const mongoose = require("mongoose");
const Product = require("../../../models/Product");

// Get all products
const getProducts = async (req, res) => {
  try {
    const { search, category, status } = req.query;
    const filter = { tenantId: req.user.tenantId };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (category) filter.category = category;
    if (status) filter.status = status;

    const products = await Product.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Get products error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

// Get one product
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findOne({
      _id: id,
      tenantId: req.user.tenantId,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
};

// Create product
const createProduct = async (req, res) => {
  try {
    const {
      name, code, type, category, description,
      price, billing, duration, status,
    } = req.body;

    if (!name || !type || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Product name, type, and price are required",
      });
    }

    if (!req.user.tenantId) {
      return res.status(403).json({
        success: false,
        message: "Tenant information is missing",
      });
    }

    const product = await Product.create({
      tenantId: req.user.tenantId,
      name,
      code,
      type,
      category,
      description,
      price,
      billing,
      duration,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const allowedFields = [
      "name", "code", "type", "category", "description",
      "price", "billing", "duration", "status",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one valid field to update",
      });
    }

    const product = await Product.findOneAndUpdate(
      { _id: id, tenantId: req.user.tenantId },
      updates,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findOneAndDelete({
      _id: id,
      tenantId: req.user.tenantId,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
    });
  }
};

// Get product statistics
const getProductStats = async (req, res) => {
  try {
    const tenantFilter = { tenantId: req.user.tenantId };

    const [totalProducts, categories, activeProducts, inactiveProducts] =
      await Promise.all([
        Product.countDocuments(tenantFilter),
        Product.distinct("category", {
          ...tenantFilter,
          category: { $nin: ["", null] },
        }),
        Product.countDocuments({
          ...tenantFilter,
          status: "Active",
        }),
        Product.countDocuments({
          ...tenantFilter,
          status: "Inactive",
        }),
      ]);

    res.status(200).json({
      success: true,
      stats: {
        totalProducts,
        categories: categories.length,
        activeProducts,
        inactiveProducts,
      },
    });
  } catch (error) {
    console.error("Product stats error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product statistics",
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats,
};
