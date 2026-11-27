import { useState } from 'react'
import {
  LayoutDashboard, Users, UserCheck, UserRound, CalendarClock, Briefcase,
  FileText, Wallet, TrendingUp, BarChart3, Bell, Settings, ContactRound, Wrench,
} from 'lucide-react'

import AppShell from '../../layouts/AppShell'
import Sidebar from '../../layouts/Sidebar'
import Topbar from './components/Topbar'
import { useCurrentUser } from "../../lib/useSession";

import Dashboard from './pages/Dashboard'
import LeadManagement from './pages/LeadManagement'
import LeadAssignment from './pages/LeadAssignment'
import TeamMembers from './pages/TeamMembers'
import FollowUps from './pages/FollowUps'
import Deals from './pages/Deals'
import Quotations from './pages/Quotations'
import CustomerCare from './pages/CustomerCare'
import ServiceRequests from './pages/ServiceRequests'
import Finance from './pages/Finance'
import TeamPerformance from './pages/TeamPerformance'
import Reports from './pages/Reports'
import Notifications from './pages/Notifications'
import ManagerSettings from './pages/Settings'

const BRAND = { initials: 'DH', name: 'DevHub', sub: 'Powered by Cliently' }

const MENU = [
  { section: 'MAIN' },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { section: 'SALES' },
  { id: 'leads', label: 'Lead Management', icon: Users },
  { id: 'assignment', label: 'Lead Assignment', icon: UserCheck },
  { id: 'followups', label: 'Follow-ups', icon: CalendarClock },
  { id: 'deals', label: 'Deals', icon: Briefcase },
  { id: 'quotations', label: 'Quotations', icon: FileText },
  { section: 'CUSTOMERS' },
  { id: 'customers', label: 'Customers', icon: ContactRound },
  { id: 'service-requests', label: 'Service Requests', icon: Wrench },
  { section: 'TEAM' },
  { id: 'team', label: 'Team Members', icon: UserRound },
  { id: 'performance', label: 'Team Performance', icon: TrendingUp },
  { section: 'FINANCE & REPORTS' },
  { id: 'finance', label: 'Finance', icon: Wallet },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { section: 'ACCOUNT' },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'settings', label: 'Profile & Settings', icon: Settings },
]

const PAGES = {
  dashboard: Dashboard, leads: LeadManagement, assignment: LeadAssignment,
  followups: FollowUps, deals: Deals, quotations: Quotations,
  customers: CustomerCare, 'service-requests': ServiceRequests,
  team: TeamMembers, performance: TeamPerformance,
  finance: Finance, reports: Reports,
  notifications: Notifications, settings: ManagerSettings,
}

function ManagerApp({ onLogout }) {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const user = useCurrentUser()
  const Page = PAGES[currentPage] || Dashboard

  return (
    <AppShell
      sidebar={
        <Sidebar
          brand={BRAND} items={MENU} sectionTitle={null}
          currentPage={currentPage} onNavigate={setCurrentPage} onLogout={onLogout}
        />
      }
      topbar={<Topbar currentPage={currentPage} user={user} onNavigate={setCurrentPage} />}
    >
      <Page onNavigate={setCurrentPage} />
    </AppShell>
  )
}

export default ManagerApp