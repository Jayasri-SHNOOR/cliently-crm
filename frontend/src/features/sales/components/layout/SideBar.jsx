
import {
  LayoutDashboard,
  Users,
  UserRound,
  CheckSquare,
  CalendarDays,
  NotebookPen,
  Package,
  Bell,
  UserCircle,
  CircleHelp,
} from "lucide-react";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const menuItems = [
    {
      label: "Dashboard",
      path: "/",
      icon: LayoutDashboard,
    },
    {
      label: "Leads",
      path: "/leads",
      icon: Users,
    },
    {
      label: "Customers",
      path: "/customers",
      icon: UserRound,
    },
    {
      label: "Tasks",
      path: "/tasks",
      icon: CheckSquare,
    },
    {
      label: "Calendar",
      path: "/calendar",
      icon: CalendarDays,
    },
    {
      label: "Notes",
      path: "/notes",
      icon: NotebookPen,
    },
    {
      label: "Products",
      path: "/products",
      icon: Package,
    },
    {
      label: "Notifications",
      path: "/notifications",
      icon: Bell,
    },
    {
      label: "Profile",
      path: "/profile",
      icon: UserCircle,
    },
    {
      label: "Help",
      path: "/help",
      icon: CircleHelp,
    },
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
