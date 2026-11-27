
const mongoose = require("mongoose");
const Task = require("../models/task");

const getTenantId = (req, res) => {
  const tenantId = req.user?.tenantId;

  if (!tenantId || !mongoose.isValidObjectId(tenantId)) {
    res.status(403).json({
      success: false,
      message: "Valid tenant information is required",
    });
    return null;
  }

  return tenantId;
};

// GET all tasks
const getTasks = async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;

    const { search, status, priority } = req.query;
    const filter = { tenantId, userId: req.user.id };

    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.title = { $regex: safeSearch, $options: "i" };
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const tasks = await Task.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error("Get tasks error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tasks",
    });
  }
};

// GET one task
const getTaskById = async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;

    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    const task = await Task.findOne({ _id: id, tenantId, userId: req.user.id });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.status(200).json({ success: true, task });
  } catch (error) {
    console.error("Get task error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch task",
    });
  }
};

// CREATE task
const createTask = async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;

    const { title, description, dueDate, priority, status } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Task title is required",
      });
    }

    const task = await Task.create({
      tenantId,
      userId: req.user.id,
      title: title.trim(),
      description: description || "",
      dueDate: dueDate || null,
      priority,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    console.error("Create task error:", error.message);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE task
const updateTask = async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;

    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    const allowedFields = [
      "title",
      "description",
      "dueDate",
      "priority",
      "status",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.title !== undefined) {
      if (!updates.title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Task title cannot be empty",
        });
      }
      updates.title = updates.title.trim();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update",
      });
    }

    const task = await Task.findOneAndUpdate(
      { _id: id, tenantId, userId: req.user.id },
      updates,
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    console.error("Update task error:", error.message);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE task
const deleteTask = async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;

    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    const task = await Task.findOneAndDelete({
      _id: id,
      tenantId,
      userId: req.user.id,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete task error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete task",
    });
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};
