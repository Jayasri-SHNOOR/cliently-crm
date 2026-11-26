
const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
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

module.exports = mongoose.model("Note", noteSchema);
