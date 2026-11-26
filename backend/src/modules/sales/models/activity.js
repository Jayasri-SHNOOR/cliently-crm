
const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },

    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },

    activityType: {
      type: String,
      required: true,
      default: "Meeting",
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Meeting description is required"],
      trim: true,
    },

    activityDate: {
      type: Date,
      required: [true, "Meeting date is required"],
    },

    status: {
      type: String,
      required: true,
      trim: true,
      default: "Pending",
    },
  },
  {
    timestamps: false,
    collection: "activities",
  }
);

module.exports = mongoose.model("Activity", activitySchema);
