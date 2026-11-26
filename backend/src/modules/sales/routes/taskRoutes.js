
const express = require("express");
const router = express.Router();

const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");

// GET all tasks and POST a new task
router.route("/")
  .get(getTasks)
  .post(createTask);

// GET, UPDATE, or DELETE a task by ID
router.route("/:id")
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);

module.exports = router;
