import { useState } from 'react'
import {
  LayoutDashboard, Users, Briefcase, UserRound, Settings,
  HelpCircle, PackageCheck, CreditCard, ContactRound,
} from 'lucide-react'
import { apiFetch } from '../../lib/api'
import { clearSession } from '../../lib/session'

import AppShell from '../../layouts/AppShell'
import Sidebar from '../../layouts/Sidebar'
import Topbar from './components/Topbar'
import Customers from './components/Customers'
import Dashboard from './components/Dashboard'
import Leads from './components/Leads'
import Settings_ from './components/Settings'
import Products from './components/Products'
import Deals from './components/Deals'
import Employees from './components/Employees'
import HelpSupport from './components/HelpSupport'
import Subscriptions from './components/Subscriptions'

const BRAND = { initials: 'DH', name: 'DevHub', sub: 'Powered by Cliently' }

const MENU = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'customers', label: 'Customers', icon: ContactRound },
  { id: 'deals', label: 'Deals', icon: Briefcase },
  { id: 'employees', label: 'Employees', icon: UserRound },
  { id: 'products', label: 'Our Products', icon: PackageCheck },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'help', label: 'Help & Support', icon: HelpCircle },
]

function ClientAdmin() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [settingsSection, setSettingsSection] = useState('company')

  const handleNavigate = (page) => {
    if (page === 'profile') { setSettingsSection('profile'); setCurrentPage('settings') }
    else if (page === 'settings') { setSettingsSection('company'); setCurrentPage('settings') }
    else setCurrentPage(page)
  }

  const handleLogout = async () => {
    await apiFetch('/api/auth/logout', { method: 'POST', auth: false }).catch(() => null)
    clearSession()
    window.location.replace('/login?reason=SIGNED_OUT')
  }

  return (
    <AppShell
      sidebar={
        <Sidebar
          brand={BRAND} items={MENU}
          currentPage={currentPage} onNavigate={handleNavigate} onLogout={handleLogout}
        />
      }
      topbar={
        <Topbar onNavigate={handleNavigate} currentPage={currentPage} settingsSection={settingsSection} />
      }
    >
      {currentPage === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
      {currentPage === 'customers' && <Customers />}
      {currentPage === 'leads' && <Leads />}
      {currentPage === 'products' && <Products />}
      {currentPage === 'deals' && <Deals />}
      {currentPage === 'employees' && <Employees />}
      {currentPage === 'settings' && <Settings_ initialSection={settingsSection} />}
      {currentPage === 'help' && <HelpSupport />}
      {currentPage === 'subscriptions' && <Subscriptions />}
    </AppShell>
  )
}

export default ClientAdmin