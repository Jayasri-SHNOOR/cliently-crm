
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from "lucide-react";
import api from "../services/api";

function Calendar() {
  const [currentDate, setCurrentDate] = useState(
    new Date(2026, 9, 1)
  );
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Existing sample meetings
  const sampleEvents = [
    { day: 9, title: "Customer follow-up", time: "10:00 AM" },
    { day: 12, title: "Sales meeting", time: "11:30 AM" },
    { day: 15, title: "Product discussion", time: "02:00 PM" },
    { day: 21, title: "Client review", time: "03:00 PM" },
  ];

  useEffect(() => {
    async function loadTasks() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/sales/tasks");
        setTasks(response.tasks || []);
      } catch (err) {
        console.error("Calendar tasks API error:", err);
        setError("Unable to load tasks for the calendar.");
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
    setCurrentDate(new Date(2026, 9, 1));
  }

  // Convert saved tasks into calendar events for the displayed month.
  const taskEvents = tasks
    .filter((task) => task.dueDate)
    .map((task) => {
      const dueDate = new Date(`${String(task.dueDate).slice(0, 10)}T12:00:00`);

      return {
        day: dueDate.getDate(),
        title: task.title,
        time: task.status || "Pending",
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
          <p>View your meetings, tasks and scheduled activities.</p>
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
              Reset
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

        {error && <p role="alert">{error}</p>}

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

            const daySampleEvents = sampleEvents.filter(
              (event) => event.day === day
            );

            const dayTaskEvents = taskEvents.filter(
              (event) => event.day === day
            );

            return (
              <div className="calendar-day" key={day}>
                <span className="calendar-date">{day}</span>

                {daySampleEvents.map((event) => (
                  <div
                    className="calendar-event"
                    key={`sample-${event.title}`}
                  >
                    <strong>{event.title}</strong>
                    <span>{event.time}</span>
                  </div>
                ))}

                {dayTaskEvents.map((event) => (
                  <div
                    className="calendar-event"
                    key={event.taskId}
                    title={`Task status: ${event.time}`}
                  >
                    <strong>{event.title}</strong>
                    <span>Task · {event.time}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {loading && <p>Loading tasks...</p>}

        <div className="calendar-note">
          <CalendarDays size={17} />
          <span>
            Your saved tasks appear on their due dates alongside sample meetings.
          </span>
        </div>
      </div>
    </div>
  );
}

export default Calendar;
