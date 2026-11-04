const Sale = require("../models/sale");

const mongoose = require("mongoose");
const Customer = require("../models/Customer");

// GET /api/customers - Get all customers and search
const getCustomers = async (req, res) => {
  try {
    const { search, status } = req.query;
    const filter = {};

    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(safeSearch, "i");

      filter.$or = [
        { name: regex },
        { company: regex },
        { email: regex },
        { phone: regex },
      ];
    }

    if (status) {
      if (!["Active", "Inactive", "Prospect"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid customer status",
        });
      }

      filter.status = status;
    }

    const customers = await Customer.find(filter)
  .sort({ createdAt: -1 })
  .lean();

const customersWithSales = await Promise.all(
  customers.map(async (customer) => {
    const customerKey = String(customer.userId || "");

    const sales = customerKey
      ? await Sale.find({ customerId: customerKey })
          .sort({ saleDate: -1 })
          .lean()
      : [];

    const totalSales = sales.reduce(
      (sum, sale) => sum + Number(sale.totalAmount || 0),
      0
    );

    return {
      ...customer,
      totalSales,
      salesCount: sales.length,
      latestSaleDate: sales[0]?.saleDate || null,
      latestSaleStatus: sales[0]?.saleStatus || null,
      latestPaymentStatus: sales[0]?.paymentStatus || null,
    };
  })
);

    res.status(200).json({
      success: true,
      count: customersWithSales.length,
customers: customersWithSales,
    });
  } catch (error) {
    console.error("Get customers error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve customers",
    });
  }
};

// GET /api/customers/:id - Get one customer
const getCustomerById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error("Get customer error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve customer",
    });
  }
};

// POST /api/customers - Create a customer
const createCustomer = async (req, res) => {
  try {
    const { name, company, email, phone, address, status } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required",
      });
    }

    const customer = await Customer.create({
      name,
      company,
      email,
      phone,
      address,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      customer,
    });
  } catch (error) {
    console.error("Create customer error:", error.message);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create customer",
    });
  }
};

// PUT /api/customers/:id - Update a customer
const updateCustomer = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const allowedFields = [
      "name",
      "company",
      "email",
      "phone",
      "address",
      "status",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (
      updates.name !== undefined &&
      (typeof updates.name !== "string" || !updates.name.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Customer name cannot be empty",
      });
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update",
      });
    }

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      customer,
    });
  } catch (error) {
    console.error("Update customer error:", error.message);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update customer",
    });
  }
};

// DELETE /api/customers/:id - Delete a customer
const deleteCustomer = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Delete customer error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete customer",
    });
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
