import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './clientadmin.css'

import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Dashboard from './components/Dashboard'
import Leads from './components/Leads'
import Settings from './components/Settings'
import Products from './components/Products'
import Deals from './components/Deals'
import Employees from './components/Employees'
import HelpSupport from './components/HelpSupport'
import Logout from './components/Logout'

function ClientAdmin() {
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [settingsSection, setSettingsSection] = useState('company')
  const [loggedOut, setLoggedOut] = useState(false)

  const handleNavigate = (page) => {
    if (page === 'profile') {
      setSettingsSection('profile')
      setCurrentPage('settings')
    } else if (page === 'settings') {
      setSettingsSection('company')
      setCurrentPage('settings')
    } else {
      setCurrentPage(page)
    }
  }
  const handleLogout = () => {
    setLoggedOut(true)
  }

  const handleBackToLogin = () => {
    navigate('/login')
  }

  if (loggedOut) {
    return (
      <div className="client-admin">
        <Logout onBackToLogin={handleBackToLogin} />
      </div>
    )
  }

  return (
    <div className="client-admin">

      <div className="app">
        <Sidebar
          onNavigate={handleNavigate}
          currentPage={currentPage}
          onLogout={handleLogout}
        />

        <div className="main-area">
          <Topbar
            onNavigate={handleNavigate}
            currentPage={currentPage}
            settingsSection={settingsSection}
          />

          {currentPage === 'dashboard' && (
            <Dashboard onNavigate={handleNavigate} />
          )}
          {currentPage === 'leads' && <Leads />}
          {currentPage === 'products' && <Products />}
          {currentPage === 'deals' && <Deals />}
          {currentPage === 'employees' && <Employees />}
          {currentPage === 'settings' && (
            <Settings initialSection={settingsSection} />
          )}
          {currentPage === 'help' && <HelpSupport />}
        </div>
      </div>
    </div>
  )
}

export default ClientAdmin