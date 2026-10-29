import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from './features/landing/LandingPage'
import Login from './features/login/pages/Login'
import SuperAdminDashboard from './features/super-admin/SuperAdminDashboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/super-admin/*" element={<SuperAdminDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
