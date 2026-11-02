
const express = require("express");
const router = express.Router();

const {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
} = require("../controllers/noteController");

// GET all notes and POST a new note
router.route("/")
  .get(getNotes)
  .post(createNote);

// GET, UPDATE, or DELETE a note by ID
router.route("/:id")
  .get(getNoteById)
  .put(updateNote)
  .delete(deleteNote);

module.exports = router;
