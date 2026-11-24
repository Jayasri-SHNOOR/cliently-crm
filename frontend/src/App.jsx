import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./features/login/pages/Login";
import LandingPage from "./features/landing/LandingPage";
import SuperAdminDashboard from "./features/super-admin/SuperAdminApp";
import ClientAdmin from "./features/client-admin/clientadmin";
import SalesExecutive from "./features/sales/SalesExecutive";
import OperationsApp from "./features/operations/OperationsApp";
import ManagerApp from "./features/manager/ManagerApp";
import SessionGate from "./components/SessionGate";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicSite from "./features/public-site/PublicSite";
import CustomerLogin from "./features/customer-portal/CustomerLogin";
import ActivateAccount from "./features/customer-portal/ActivateAccount";
import CustomerPortal from "./features/customer-portal/CustomerPortal";
import { logout } from "./lib/auth";

async function handleLogout() {
  await logout();
  window.location.replace("/login?reason=SIGNED_OUT");
}

function App() {
  return (
    <BrowserRouter>
      <SessionGate>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/site/:slug/portal" element={<CustomerPortal />} />
          <Route path="/site/:slug" element={<PublicSite />} />
          <Route path="/site/:slug/login" element={<CustomerLogin />} />
          <Route path="/site/:slug/activate" element={<ActivateAccount />} />
          
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/super-admin/*"
            element={
              <ProtectedRoute roles={["SUPER_ADMIN"]}>
                <SuperAdminDashboard onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/salesExecutive/*"
            element={
              <ProtectedRoute roles={["SALES_EXECUTIVE"]}>
                <SalesExecutive onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/client-admin/*"
            element={
              <ProtectedRoute roles={["CLIENT_ADMIN"]}>
                <ClientAdmin onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/operations/*"
            element={
              <ProtectedRoute roles={["OPERATIONAL_STAFF"]}>
                <OperationsApp />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manager/*"
            element={
              <ProtectedRoute roles={["MANAGER", "CLIENT_ADMIN"]}>
                <ManagerApp onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={<Navigate to="/login" replace />}
          />
        </Routes>
      </SessionGate>
    </BrowserRouter>
  );
}

export default App;