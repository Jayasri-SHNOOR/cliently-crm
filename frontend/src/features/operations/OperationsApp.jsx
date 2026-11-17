import "./OperationsApp.css";

import {
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

import { useCurrentUser } from "../../lib/useSession";
import { logout } from "../../lib/auth";

// Layout Components
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

// Dashboard
import Dashboard from "./pages/Dashboard";

// Support Tickets
import TicketsList from "./pages/Tickets/TicketsList";
import TicketDetail from "./pages/Tickets/TicketDetail";

// Work Orders
import WorkOrdersList from "./pages/WorkOrders/WorkOrdersList";
import WorkOrderDetail from "./pages/WorkOrders/WorkOrderDetail";

// Knowledge Base
import KnowledgeBase from "./pages/KnowledgeBase/KnowledgeBase";
import ArticleEditor from "./pages/KnowledgeBase/ArticleEditor";
import ArticleView from "./pages/KnowledgeBase/ArticleView";

// Inventory & Assets
import Assets from "./pages/Assets/Assets";
import AssetDetail from "./pages/Assets/AssetDetail";

// My Profile
import OperationsProfile from "./pages/Profile/OperationsProfile";

function OperationsApp() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();

  // Logout Function
  function handleLogout() {
    logout();
    window.location.assign("/login?reason=SIGNED_OUT");
  }

  // Navigate to Profile Page
  function handleProfile() {
    navigate("/operations/profile");
  }

  return (
    <div className="operations">
      {/* Operations Sidebar */}
      <Sidebar user={user} />

      {/* Main Dashboard Area */}
      <div className="ops-main">
        {/* Topbar with Profile Dropdown and Logout */}
        <Topbar
          user={user}
          onProfile={handleProfile}
          onLogout={handleLogout}
        />

        {/* Operations Pages */}
        <main className="ops-content">
          <Routes>
            {/* Dashboard */}
            <Route
              index
              element={<Dashboard />}
            />

            {/* Support Tickets */}
            <Route
              path="tickets"
              element={<TicketsList />}
            />

            <Route
              path="tickets/:id"
              element={<TicketDetail />}
            />

            {/* Work Orders */}
            <Route
              path="work-orders"
              element={<WorkOrdersList />}
            />

            <Route
              path="work-orders/:id"
              element={<WorkOrderDetail />}
            />

            {/* Knowledge Base */}
            <Route
              path="knowledge-base"
              element={<KnowledgeBase />}
            />

            <Route
              path="knowledge-base/new"
              element={<ArticleEditor />}
            />

            <Route
              path="knowledge-base/:id"
              element={<ArticleView />}
            />

            <Route
              path="knowledge-base/:id/edit"
              element={<ArticleEditor />}
            />

            {/* Inventory & Assets */}
            <Route
              path="assets"
              element={<Assets />}
            />

            <Route
              path="assets/:id"
              element={<AssetDetail />}
            />

            {/* Interactive My Profile */}
            <Route
              path="profile"
              element={<OperationsProfile user={user} />}
            />

            {/* Invalid Route Redirect */}
            <Route
              path="*"
              element={
                <Navigate
                  to="/operations"
                  replace
                />
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default OperationsApp;
