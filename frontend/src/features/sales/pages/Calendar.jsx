
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from "lucide-react";
import api from "../services/api";

function Calendar() {
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Fetch actual saved tasks
  useEffect(() => {
    async function loadTasks() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/api/sales/tasks");
        setTasks(response.tasks || []);
      } catch (err) {
        console.error("Calendar tasks API error:", err);
        setError(err.message || "Unable to load tasks for the calendar.");
      } finally {
        setLoading(false);
      }
    }

    loadTasks();
  }, []);

  const monthName = currentDate.toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });

  function changeMonth(amount) {
    setCurrentDate(new Date(year, month + amount, 1));
  }

  function resetCalendar() {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  // Display only actual saved tasks for the selected month
  const taskEvents = tasks
    .filter((task) => task.dueDate)
    .map((task) => {
      const dueDate = new Date(task.dueDate);

      return {
        day: dueDate.getDate(),
        title: task.title,
        status: task.status || "Pending",
        taskId: task._id,
        dueDate,
      };
    })
    .filter(
      (task) =>
        !Number.isNaN(task.dueDate.getTime()) &&
        task.dueDate.getFullYear() === year &&
        task.dueDate.getMonth() === month
    );

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Calendar</h1>
          <p>View your saved tasks and scheduled activities.</p>
        </div>
      </div>

      <div className="leads-card calendar-card">
        <div className="calendar-header">
          <div>
            <h2>{monthName}</h2>
            <p className="section-description">
              Your sales schedule
            </p>
          </div>

          <div className="calendar-controls">
            <button
              className="calendar-nav"
              onClick={() => changeMonth(-1)}
              aria-label="Previous month"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              className="calendar-today"
              onClick={resetCalendar}
            >
              Today
            </button>

            <button
              className="calendar-nav"
              onClick={() => changeMonth(1)}
              aria-label="Next month"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" style={{ color: "#b42318" }}>
            {error}
          </p>
        )}

        <div className="calendar-grid">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
            (day) => (
              <div className="calendar-weekday" key={day}>
                {day}
              </div>
            )
          )}

          {Array.from({ length: firstDay }, (_, index) => (
            <div
              className="calendar-day empty-day"
              key={`empty-${index}`}
            />
          ))}

          {Array.from({ length: daysInMonth }, (_, index) => {
            const day = index + 1;

            const dayTaskEvents = taskEvents.filter(
              (event) => event.day === day
            );

            return (
              <div className="calendar-day" key={day}>
                <span className="calendar-date">{day}</span>

                {dayTaskEvents.map((event) => (
                  <div
                    className="calendar-event"
                    key={event.taskId}
                    title={`Task status: ${event.status}`}
                  >
                    <strong>{event.title}</strong>
                    <span>Task · {event.status}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {loading && <p>Loading tasks...</p>}

        {!loading && !error && taskEvents.length === 0 && (
          <p className="empty-tasks">
            No saved tasks for this month.
          </p>
        )}

        <div className="calendar-note">
          <CalendarDays size={17} />
          <span>
            Only saved tasks with due dates are displayed.
          </span>
        </div>
      </div>
    </div>
  );
}

export default Calendar;

