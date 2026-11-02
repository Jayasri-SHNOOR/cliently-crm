
const express = require("express");
const router = express.Router();

const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require("../controllers/customerController");

// Get all customers and create a customer
router.route("/")
  .get(getCustomers)
  .post(createCustomer);

// Get, update, and delete one customer by ID
router.route("/:id")
  .get(getCustomerById)
  .put(updateCustomer)
  .delete(deleteCustomer);

module.exports = router;
