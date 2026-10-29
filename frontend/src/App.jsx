import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Login from './features/login/pages/Login'
import LandingPage from './features/landing/LandingPage'
import ClientAdmin from './features/client-admin/Clientadmin'

const SuperAdminDashboard = lazy(() =>
  import('./features/super-admin/SuperAdminDashboard')
)

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<p>Loading...</p>}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/super-admin/*" element={<SuperAdminDashboard />} />
          <Route path="/client-admin/*" element={<ClientAdmin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App