import { LayoutDashboard, Building2, CreditCard, SlidersHorizontal, Activity, Plug, Bell, Megaphone, Settings } from "lucide-react";
import "./Sidebar.css";
export default function Sidebar({ activePage, setActivePage }) {
  return (
<aside className="super-admin-sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">CRM</div>

          <div className="brand-text">
            <strong>Cliently</strong>
            <span>Administration</span>
          </div>
        </div>

        <nav className="sidebar-nav">


  <button
  className={`nav-item ${activePage === "dashboard" ? "active" : ""}`}
  onClick={() => setActivePage("dashboard")}
>
  <span>▪</span>
  Dashboard
</button>


  <button
    className={`nav-item ${activePage === "tenants" ? "active" : ""}`}
    onClick={() => setActivePage("tenants")}
  >
    <span>▣</span>
    Tenant Management
  </button>

  <button
    className={`nav-item ${activePage === "billing" ? "active" : ""}`}
    onClick={() => setActivePage("billing")}
  >
    <span>◫</span>
    Subscription & Billing
  </button>

  <button
    className={`nav-item ${activePage === "features" ? "active" : ""}`}
    onClick={() => setActivePage("features")}
  >
    <span>⚙</span>
    Plans & Feature Flags
  </button>

  <button
    className={`nav-item ${activePage === "health" ? "active" : ""}`}
    onClick={() => setActivePage("health")}
  >
    <span>◉</span>
    System Health
  </button>

  <button
    className={`nav-item ${activePage === "integrations" ? "active" : ""}`}
    onClick={() => setActivePage("integrations")}
  >
    <span>⊞</span>
    Integrations
  </button>


  <button
    className={`nav-item ${activePage === "notifications" ? "active" : ""}`}
    onClick={() => setActivePage("notifications")}
  >
    <span>♢</span>
    Notifications
  </button>

  <button
    className={`nav-item ${activePage === "announcements" ? "active" : ""}`}
    onClick={() => setActivePage("announcements")}
  >
    <span>◌</span>
    Announcements
  </button>


  <button
    className={`nav-item ${activePage === "settings" ? "active" : ""}`}
    onClick={() => setActivePage("settings")}
  >
    <span>⚙</span>
    Settings
  </button>

</nav>
      </aside>
  );
}
