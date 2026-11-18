import Topbar from '../../../layouts/Topbar'
import { notifications } from '../services/mockData'

const TITLES = {
  dashboard: ['Dashboard', 'Overview'],
  leads: ['Lead Management', 'Customer Enquiries'],
  assignment: ['Lead Assignment', 'Team Allocation'],
  team: ['Team Members', 'Team Overview'],
  followups: ['Follow-ups & Activities', 'Customer Engagement'],
  deals: ['Deals', 'Sales Conversion'],
  quotations: ['Quotations', 'Price Proposals'],
  finance: ['Finance', 'Invoices & Payments'],
  performance: ['Team Performance', 'Analytics'],
  reports: ['Reports', 'Sales & Financial'],
  notifications: ['Notifications', 'Updates'],
  settings: ['Settings', 'Profile & Preferences'],
}

export default function ManagerTopbar({ currentPage, user, onNavigate }) {
  const [title, subtitle] = TITLES[currentPage] || TITLES.dashboard
  return (
    <Topbar
      breadcrumb={{ title, subtitle }}
      user={user}
      notifications={{
        items: notifications,
        unread: notifications.filter((n) => !n.read).length,
        onSelect: () => onNavigate('notifications'),
      }}
      onProfile={() => onNavigate('settings')}
    />
  )
}