
const express = require("express");
const router = express.Router();

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats,
} = require("../controllers/productController");

// Product statistics — keep this before /:id
router.get("/stats", getProductStats);

// Get all products and create a product
router.route("/")
  .get(getProducts)
  .post(createProduct);

// Get, update, or delete one product
router.route("/:id")
  .get(getProductById)
  .put(updateProduct)
  .delete(deleteProduct);

module.exports = router;
