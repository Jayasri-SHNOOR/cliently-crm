
const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    designation: {
      type: String,
      default: "",
      trim: true,
    },
    department: {
      type: String,
      default: "",
      trim: true,
    },
    joiningDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: false,
    collection: "employees",
  }
);

module.exports = mongoose.model("Employee", employeeSchema);
