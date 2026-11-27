
const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    title: {
      type: String,
      required: [true, "Note title is required"],
      trim: true,
    },

    content: {
      type: String,
      required: [true, "Note content is required"],
      trim: true,
    },

    category: {
      type: String,
      trim: true,
      default: "General",
    },

    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "notes",
  }
);

noteSchema.index({ tenantId: 1, updatedAt: -1 });

module.exports = mongoose.models.Note ||
  mongoose.model("Note", noteSchema);