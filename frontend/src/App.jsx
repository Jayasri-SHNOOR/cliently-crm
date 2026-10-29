import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Login from './features/login/pages/Login'
import SuperAdminDashboard from './features/super-admin/SuperAdminDashboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/super-admin/*" element={<SuperAdminDashboard />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App