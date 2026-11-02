
import { useState, useEffect } from "react";
import {
  Bell,
  CheckCheck,
  CalendarDays,
  CheckSquare,
  Users,
  Package,
  Info,
  Trash2,
} from "lucide-react";

const API_URL = "http://localhost:5000/api/notifications";

const typeIcons = {
  Calendar: CalendarDays,
  Task: CheckSquare,
  Customer: Users,
  Product: Package,
  General: Info,
};

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function request(url, options = {}) {
    const response = await fetch(url, options);

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "The request failed.");
    }

    return data;
  }

  async function fetchNotifications() {
    try {
      setLoading(true);
      setError("");

      const data = await request(API_URL);
      const items = Array.isArray(data)
        ? data
        : data.notifications || [];

      setNotifications(
        items.map((item) => ({
          ...item,
          id: item._id || item.id,
          title: item.title || item.notificationTitle || "Notification",
          message: item.message || item.description || "",
          type: item.type || item.category || "General",
          read: item.read ?? item.isRead ?? false,
          time: item.time || item.createdAt || item.date || "",
        }))
      );
    } catch (err) {
      setError(err.message || "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  const filteredNotifications = notifications.filter(
    (notification) => {
      if (filter === "Unread") return !notification.read;
      if (filter === "Read") return notification.read;
      return true;
    }
  );

  async function markAsRead(id) {
    try {
      setBusy(true);
      setError("");

      await request(`${API_URL}/${id}/read`, {
        method: "PATCH",
      });

      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === id
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (err) {
      setError(err.message || "Unable to mark notification as read.");
    } finally {
      setBusy(false);
    }
  }

  async function markAllAsRead() {
    try {
      setBusy(true);
      setError("");

      await request(`${API_URL}/read-all`, {
        method: "PATCH",
      });

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          read: true,
        }))
      );
    } catch (err) {
      setError(err.message || "Unable to mark all as read.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteNotification(id) {
    if (!window.confirm("Delete this notification?")) return;

    try {
      setBusy(true);
      setError("");

      await request(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      setNotifications((previous) =>
        previous.filter((notification) => notification.id !== id)
      );
    } catch (err) {
      setError(err.message || "Unable to delete notification.");
    } finally {
      setBusy(false);
    }
  }

  function formatTime(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          <p>Stay updated on your tasks, meetings, and workspace.</p>
        </div>

        <button
          type="button"
          className="notification-read-all"
          onClick={markAllAsRead}
          disabled={unreadCount === 0 || busy}
        >
          <CheckCheck size={17} />
          Mark all as read
        </button>
      </div>

      <div className="notification-summary">
        <div className="notification-summary-icon">
          <Bell size={23} />
        </div>
        <div>
          <span>Unread notifications</span>
          <h2>{unreadCount}</h2>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          style={{ color: "#b42318", margin: "12px 0" }}
        >
          {error}
          <button
            type="button"
            className="filter-button"
            onClick={fetchNotifications}
            style={{ marginLeft: "12px" }}
          >
            Retry
          </button>
        </div>
      )}

      <div className="leads-card notifications-card">
        <div className="notification-toolbar">
          <h2>Recent Notifications</h2>

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            aria-label="Filter notifications"
          >
            <option value="All">All notifications</option>
            <option value="Unread">Unread only</option>
            <option value="Read">Read only</option>
          </select>
        </div>

        <div className="notification-list">
          {loading ? (
            <p>Loading notifications...</p>
          ) : (
            <>
              {filteredNotifications.map((notification) => {
                const Icon = typeIcons[notification.type] || Info;

                return (
                  <div
                    key={notification.id}
                    className={`notification-item ${
                      notification.read ? "is-read" : "is-unread"
                    }`}
                  >
                    <div className="notification-icon">
                      <Icon size={21} />
                    </div>

                    <div className="notification-content">
                      <div className="notification-title-row">
                        <h3>{notification.title}</h3>
                        {!notification.read && (
                          <span className="notification-unread-dot" />
                        )}
                      </div>

                      <p>{notification.message}</p>

                      <div className="notification-meta">
                        <span>{notification.type}</span>
                        <span>{formatTime(notification.time)}</span>
                      </div>
                    </div>

                    <div className="notification-actions">
                      {!notification.read && (
                        <button
                          type="button"
                          title="Mark as read"
                          aria-label={`Mark ${notification.title} as read`}
                          disabled={busy}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <CheckCheck size={18} />
                        </button>
                      )}

                      <button
                        type="button"
                        title="Delete notification"
                        aria-label={`Delete ${notification.title}`}
                        disabled={busy}
                        onClick={() =>
                          deleteNotification(notification.id)
                        }
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredNotifications.length === 0 && (
                <div className="notification-empty">
                  <Bell size={28} />
                  <h3>No notifications found</h3>
                  <p>There are no notifications in this category.</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="notification-footer">
          Showing {filteredNotifications.length} notifications
        </div>
      </div>
    </div>
  );
}

export default Notifications;