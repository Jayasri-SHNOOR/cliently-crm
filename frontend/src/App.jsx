import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./features/login/pages/Login";
import SuperAdminDashboard from "./features/super-admin/SuperAdminDashboard";
import ClientAdmin from "./features/client-admin/clientadmin";
import SalesExecutive from "./features/sales/SalesExecutive";
import SessionGate from "./components/SessionGate";
import ProtectedRoute from "./components/ProtectedRoute";
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
                    <Route path="/login" element={<Login />} />
                    <Route path="/super-admin/*" element={<SuperAdminDashboard onLogout={handleLogout} />} />
                    <Route path="/salesExecutive/*" element={ <SalesExecutive onLogout={handleLogout} />}   />
                    <Route
                        path="/client-admin/*"
                        element={
                            <ProtectedRoute roles={["CLIENT_ADMIN"]}>
                                <ClientAdmin />
                            </ProtectedRoute>
                        }
                        onLogout={handleLogout}
                    />

                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </SessionGate>
        </BrowserRouter>
    );
}

export default App;