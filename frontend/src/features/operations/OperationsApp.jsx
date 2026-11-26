import "./OperationsApp.css";

import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";

import { useCurrentUser } from "../../lib/useSession";
import { logout } from "../../lib/auth";

import OpsErrorBoundary from "./components/OpsErrorBoundary";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

import Dashboard from "./pages/Dashboard";

import TicketsList from "./pages/Tickets/TicketsList";
import TicketDetail from "./pages/Tickets/TicketDetail";

import WorkOrdersList from "./pages/WorkOrders/WorkOrdersList";
import WorkOrderDetail from "./pages/WorkOrders/WorkOrderDetail";

import KnowledgeBase from "./pages/KnowledgeBase/KnowledgeBase";
import ArticleEditor from "./pages/KnowledgeBase/ArticleEditor";
import ArticleView from "./pages/KnowledgeBase/ArticleView";

import ServiceJobsList from "./pages/ServiceJobs/ServiceJobsList";
import ServiceJobDetail from "./pages/ServiceJobs/ServiceJobDetail";

import Assets from "./pages/Assets/Assets";
import AssetDetail from "./pages/Assets/AssetDetail";

import OperationsProfile from "./pages/Profile/OperationsProfile";

function OperationsApp() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() {
    try {
      await logout();
    } finally {
      window.location.replace("/login?reason=SIGNED_OUT");
    }
  }

  function handleProfile() {
    navigate("/operations/profile");
  }

  return (
    <div className="operations">
      <Sidebar user={user} onLogout={handleLogout} />

      <div className="ops-main">
        <Topbar user={user} onProfile={handleProfile} onLogout={handleLogout} />

        <main className="ops-content">
          <OpsErrorBoundary key={location.pathname}>
            <Routes>
              <Route index element={<Dashboard />} />

              <Route path="tickets" element={<TicketsList />} />
              <Route path="tickets/:id" element={<TicketDetail />} />

              <Route path="work-orders" element={<WorkOrdersList />} />
              <Route path="work-orders/:id" element={<WorkOrderDetail />} />

              <Route path="knowledge-base" element={<KnowledgeBase />} />
              <Route path="knowledge-base/new" element={<ArticleEditor />} />
              <Route path="knowledge-base/:id" element={<ArticleView />} />
              <Route path="knowledge-base/:id/edit" element={<ArticleEditor />} />

              <Route path="service-jobs" element={<ServiceJobsList />} />
              <Route path="service-jobs/:id" element={<ServiceJobDetail />} />

              <Route path="assets" element={<Assets />} />
              <Route path="assets/:id" element={<AssetDetail />} />

              <Route path="profile" element={<OperationsProfile user={user} />} />

              <Route path="*" element={<Navigate to="/operations" replace />} />
            </Routes>
          </OpsErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default OperationsApp;