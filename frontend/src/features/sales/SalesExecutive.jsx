import { Routes, Route } from "react-router-dom";
import "./style/variable.css";
import "./style/layout.css";
import MainLayout from "./components/layout/MainLayout";
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

function SalesExecutive() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="leads" element={<Leads />} />
        <Route path="customers" element={<Customers />} />
        <Route path="customers/:id" element={<CustomerDetail />} />
        <Route path="service-requests" element={<ServiceRequests />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="notes" element={<Notes />} />
        <Route path="products" element={<Products />} />
        <Route path="payments" element={<Payments />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
        <Route path="help" element={<Help />} />
      </Route>
    </Routes>
  );
}

export default SalesExecutive;
