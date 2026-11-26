
import {
  LayoutDashboard,
  Users,
  UserRound,
  CheckSquare,
  CalendarDays,
  NotebookPen,
  Package,
  CreditCard,
  Bell,
  CircleHelp,
} from "lucide-react";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const menuItems = [
  { label: "Dashboard", path: "/SalesExecutive", icon: LayoutDashboard },
  { label: "Leads", path: "/SalesExecutive/leads", icon: Users },
  { label: "Customers", path: "/SalesExecutive/customers", icon: UserRound },
  { label: "Tasks", path: "/SalesExecutive/tasks", icon: CheckSquare },
  { label: "Calendar", path: "/SalesExecutive/calendar", icon: CalendarDays },
  { label: "Notes", path: "/SalesExecutive/notes", icon: NotebookPen },
  { label: "Products", path: "/SalesExecutive/products", icon: Package },
  { label: "Payments", path: "/SalesExecutive/payments", icon: CreditCard },
  { label: "Notifications", path: "/SalesExecutive/notifications", icon: Bell },
  { label: "Help", path: "/SalesExecutive/help", icon: CircleHelp },
];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">C</div>
        <div>
          <h2>CRM Portal</h2>
          <span>Sales Executive</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/sales"}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <Icon size={20} strokeWidth={1.8} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
