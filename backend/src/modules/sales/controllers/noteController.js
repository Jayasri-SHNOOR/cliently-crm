
const mongoose = require("mongoose");
const Note = require("../models/note");

// GET /api/notes - Fetch all notes, with optional search and category filters
const getNotes = async (req, res) => {
  try {
    const { search, category, isPinned } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
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

    res.status(200).json({
      success: true,
      count: notes.length,
      notes,
    });
  } catch (error) {
    console.error("Get notes error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notes",
    });
  }
};

// GET /api/notes/:id - Fetch one note
const getNoteById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid note ID",
      });
    }

    const note = await Note.findById(id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    res.status(200).json({ success: true, note });
  } catch (error) {
    console.error("Get note error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch note",
    });
  }
};

// POST /api/notes - Create a note
const createNote = async (req, res) => {
  try {
    const { title, content, category, isPinned } = req.body;

    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Note title and content are required",
      });
    }

    const note = await Note.create({
      title,
      content,
      category,
      isPinned,
    });

    res.status(201).json({
      success: true,
      message: "Note created successfully",
      note,
    });
  } catch (error) {
    console.error("Create note error:", error.message);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// PUT /api/notes/:id - Update a note
const updateNote = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid note ID",
      });
    }

    const allowedFields = ["title", "content", "category", "isPinned"];
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

    const note = await Note.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Note updated successfully",
      note,
    });
  } catch (error) {
    console.error("Update note error:", error.message);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE /api/notes/:id - Delete a note
const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid note ID",
      });
    }

    const note = await Note.findByIdAndDelete(id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (error) {
    console.error("Delete note error:", error.message);
    res.status(500).json({
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

