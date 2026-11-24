
import { useEffect, useState } from "react";
import { CheckSquare, Clock, Circle } from "lucide-react";
import api from "../services/api";

function formatDueDate(date) {
  if (!date) return "No due date";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "No due date";

  return parsedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Tasks() {
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "Medium",
  });

  async function loadTasks() {
    try {
      setError("");
      const response = await api.get("/api/sales/tasks");
      setTasks(response.tasks || []);
    } catch (err) {
      console.error("Tasks API error:", err);
      setError("Unable to load tasks. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  const filteredTasks =
    filter === "All"
      ? tasks
      : tasks.filter((task) => task.status === filter);

  const pendingCount = tasks.filter(
    (task) => task.status === "Pending"
  ).length;

  async function handleCreateTask(e) {
    e.preventDefault();

    if (!newTask.title.trim()) return;

    try {
      setSaving(true);
      setError("");

      const response = await api.post("/api/sales/tasks", {
  title: newTask.title.trim(),
  description: newTask.description.trim(),
  dueDate: newTask.dueDate || null,
  priority: newTask.priority,
  status: "Pending",
});

      if (response.task) {
        setTasks((current) => [...current, response.task]);
      } else {
        await loadTasks();
      }

      setNewTask({
        title: "",
        description: "",
        dueDate: "",
        priority: "Medium",
      });

      setShowForm(false);
    } catch (err) {
      console.error("Create task error:", err);
      setError(err.message || "Unable to create task.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleTask(task) {
    const updatedStatus =
      task.status === "Completed" ? "Pending" : "Completed";

    try {
      setError("");

      await api.put(`/api/sales/tasks/${task._id}`, {
  status: updatedStatus,
});

      setTasks((current) =>
        current.map((item) =>
          item._id === task._id
            ? { ...item, status: updatedStatus }
            : item
        )
      );
    } catch (err) {
      console.error("Update task error:", err);
      setError(err.message || "Unable to update task status.");
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Tasks</h1>
          <p>Organize your work and track your follow-ups.</p>
        </div>

        <button
          className="primary-button"
          onClick={() => setShowForm(!showForm)}
        >
          + Add Task
        </button>
      </div>

      {showForm && (
        <form className="task-form" onSubmit={handleCreateTask}>
          <h2>Create New Task</h2>

          <label>Task Title *</label>
          <input
            type="text"
            placeholder="Enter task title"
            value={newTask.title}
            onChange={(e) =>
              setNewTask({ ...newTask, title: e.target.value })
            }
            required
          />

          <label>Description</label>
          <textarea
            placeholder="Enter task details"
            value={newTask.description}
            onChange={(e) =>
              setNewTask({ ...newTask, description: e.target.value })
            }
          />

          <label>Due Date</label>
          <input
            type="date"
            value={newTask.dueDate}
            onChange={(e) =>
              setNewTask({ ...newTask, dueDate: e.target.value })
            }
          />

          <label>Priority</label>
          <select
            value={newTask.priority}
            onChange={(e) =>
              setNewTask({ ...newTask, priority: e.target.value })
            }
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>

          <div className="task-form-actions">
            <button
              type="button"
              className="filter-button"
              onClick={() => setShowForm(false)}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Task"}
            </button>
          </div>
        </form>
      )}

      <div className="leads-card">
        <div className="leads-card-header">
          <div>
            <h2>Your Tasks</h2>
            <p className="section-description">
              Manage your daily activities
            </p>
          </div>

          <div className="lead-count">{pendingCount} Pending</div>
        </div>

        <div className="lead-toolbar">
          <div className="task-summary">
            <span>
              <CheckSquare size={16} />
              {tasks.length} Total Tasks
            </span>
            <span>
              <Clock size={16} />
              {pendingCount} Pending
            </span>
          </div>

          <select
            className="filter-button"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="All">All Tasks</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div className="task-list">
          {loading ? (
            <p className="empty-tasks">Loading tasks...</p>
          ) : error && tasks.length === 0 ? (
            <p className="empty-tasks">{error}</p>
          ) : (
            <>
              {error && <p className="empty-tasks">{error}</p>}

              {filteredTasks.map((task) => (
                <div className="task-item" key={task._id}>
                  <button
                    className={`task-check ${
                      task.status === "Completed" ? "checked" : ""
                    }`}
                    onClick={() => toggleTask(task)}
                    aria-label={`Mark ${task.title} ${
                      task.status === "Completed"
                        ? "pending"
                        : "completed"
                    }`}
                  >
                    {task.status === "Completed" ? (
                      "✓"
                    ) : (
                      <Circle size={19} />
                    )}
                  </button>

                  <div className="task-details">
                    <h3
                      className={
                        task.status === "Completed" ? "task-done" : ""
                      }
                    >
                      {task.title}
                    </h3>
                    <p>{task.description || "No description"}</p>
                  </div>

                  <div className="task-meta">
                    <span
                      className={`lead-priority priority-${(
                        task.priority || "Medium"
                      ).toLowerCase()}`}
                    >
                      {task.priority || "Medium"}
                    </span>

                    <span className="task-date">
                      {formatDueDate(task.dueDate)}
                    </span>

                    <span
                      className={`lead-status ${
                        task.status === "Completed"
                          ? "status-qualified"
                          : "status-contacted"
                      }`}
                    >
                      {task.status || "Pending"}
                    </span>
                  </div>
                </div>
              ))}

              {filteredTasks.length === 0 && (
                <p className="empty-tasks">
                  {tasks.length === 0
                    ? "No tasks yet. Click + Add Task to create one."
                    : "No tasks in this category."}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Tasks;