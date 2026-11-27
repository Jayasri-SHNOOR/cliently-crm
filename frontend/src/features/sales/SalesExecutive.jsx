import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, ContactRound, Wrench, CheckSquare, CalendarDays,
  NotebookPen, Package, CreditCard, Bell, UserRound, CircleHelp,
} from "lucide-react";
import AppShell from "../../layouts/AppShell";
import Sidebar from "../../layouts/Sidebar";
import { useCurrentUser } from "../../lib/useSession";
import SalesTopbar from "./components/SalesTopbar";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Customers from "./pages/Customers";
import CustomerDetail from "./pages/CustomerDetail";
import ServiceRequests from "./pages/ServiceRequests";
import Tasks from "./pages/Tasks";
import Calendar from "./pages/Calendar";
import Notes from "./pages/Notes";
import Products from "./pages/Products";
import Payments from "./pages/Payments";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Help from "./pages/Help";
import "../../shared/ui/ui.css";

const BASE = "/salesExecutive";
const BRAND = { initials: "DH", name: "DevHub", sub: "Powered by Cliently" };

const MENU = [
  { section: "MAIN" },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { section: "SALES" },
  { id: "leads", label: "Leads", icon: Users },
  { id: "customers", label: "Customers", icon: ContactRound },
  { id: "service-requests", label: "Service Requests", icon: Wrench },
  { id: "products", label: "Products", icon: Package },
  { id: "payments", label: "Payments", icon: CreditCard },
  { section: "MY WORK" },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "notes", label: "Notes", icon: NotebookPen },
  { section: "ACCOUNT" },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "profile", label: "My Profile", icon: UserRound },
  { id: "help", label: "Help", icon: CircleHelp },
];

function pageFromPath(pathname) {
  const rest = pathname.slice(BASE.length).replace(/^\/+/, "").toLowerCase();
  return rest.split("/")[0] || "dashboard";
}

function SalesExecutive({ onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const currentPage = pageFromPath(location.pathname);

  const go = (page) => navigate(page === "dashboard" ? BASE : `${BASE}/${page}`);

  return (
    <AppShell
      sidebar={<Sidebar brand={BRAND} items={MENU} sectionTitle={null} currentPage={currentPage} onNavigate={go} onLogout={onLogout} />}
      topbar={<SalesTopbar currentPage={currentPage} user={user} onNavigate={go} />}
    >
      <Routes>
        <Route index element={<Dashboard onNavigate={go} />} />
        <Route path="leads" element={<Leads />} />
        <Route path="customers" element={<Customers />} />
        <Route path="customers/:id" element={<CustomerDetail />} />
        <Route path="service-requests" element={<ServiceRequests />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="notes" element={<Notes />} />
        <Route path="products" element={<Products />} />
        <Route path="payments" element={<Payments />} />
        <Route path="notifications" element={<Notifications onNavigate={go} />} />
        <Route path="profile" element={<Profile />} />
        <Route path="help" element={<Help />} />
        <Route path="*" element={<Navigate to={BASE} replace />} />
      </Routes>
    </AppShell>
  );
}

export default SalesExecutive;