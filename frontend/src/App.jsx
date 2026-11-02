import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./features/login/pages/Login";
import SuperAdminDashboard from "./features/super-admin/SuperAdminDashboard";
import ClientAdmin from "./features/client-admin/clientadmin";
import SalesExecutive from "./features/sales/SalesExecutive";
import SessionGate from "./components/SessionGate";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
    return (
        <BrowserRouter>
            <SessionGate>
                <Routes>
                <Route path="/super-admin/*" element={<SuperAdminDashboard />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/SalesExecutive/*" element={<SalesExecutive />} />
                    <Route
                        path="/client-admin/*"
                        element={
                            <ProtectedRoute roles={["CLIENT_ADMIN"]}>
                                <ClientAdmin />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </SessionGate>
        </BrowserRouter>
    );
}

export default App;
