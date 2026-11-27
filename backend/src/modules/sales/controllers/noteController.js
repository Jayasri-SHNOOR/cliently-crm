
const mongoose = require("mongoose");
const Note = require("../models/note");

// Escape special characters in search input
const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/sales/notes
const getNotes = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "Tenant information is missing",
      });
    }

    const { search, category, isPinned } = req.query;
    const filter = { tenantId, userId: req.user.id };

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), "i");

      filter.$or = [
        { title: searchRegex },
        { content: searchRegex },
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (isPinned !== undefined) {
      filter.isPinned = isPinned === "true";
    }

    const notes = await Note.find(filter).sort({
      isPinned: -1,
      updatedAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: notes.length,
      notes,
    });
  } catch (error) {
    console.error("Get notes error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch notes",
    });
  }
};

// GET /api/sales/notes/:id
const getNoteById = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid note ID",
      });
    }

    const note = await Note.findOne({ _id: id, tenantId, userId: req.user.id });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    return res.status(200).json({
      success: true,
      note,
    });
  } catch (error) {
    console.error("Get note error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch note",
    });
  }
};

// POST /api/sales/notes
const createNote = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { title, content, category, isPinned } = req.body;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "Tenant information is missing",
      });
    }

    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Note title and content are required",
      });
    }

    const note = await Note.create({
      tenantId,
      userId: req.user.id,
      title,
      content,
      category,
      isPinned,
    });

    return res.status(201).json({
      success: true,
      message: "Note created successfully",
      note,
    });
  } catch (error) {
    console.error("Create note error:", error.message);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// PUT /api/sales/notes/:id
const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid note ID",
      });
    }

    const allowedFields = [
      "title",
      "content",
      "category",
      "isPinned",
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

    if (
      updates.title !== undefined &&
      !updates.title.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Note title cannot be empty",
      });
    }

    if (
      updates.content !== undefined &&
      !updates.content.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Note content cannot be empty",
      });
    }

    const note = await Note.findOneAndUpdate(
      { _id: id, tenantId, userId: req.user.id },
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Note updated successfully",
      note,
    });
  } catch (error) {
    console.error("Update note error:", error.message);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE /api/sales/notes/:id
const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid note ID",
      });
    }

    const note = await Note.findOneAndDelete({
      _id: id,
      tenantId,
      userId: req.user.id,
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (error) {
    console.error("Delete note error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to delete note",
    });
  }
};

module.exports = {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
};
