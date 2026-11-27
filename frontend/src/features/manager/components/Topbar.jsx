import Topbar from '../../../layouts/Topbar'
import { loadAttention } from '../services/attention'
import useLoad from '../services/useLoad'

const TITLES = {
  dashboard: ['Dashboard', 'Overview'],
  leads: ['Lead Management', 'Customer Enquiries'],
  assignment: ['Lead Assignment', 'Team Allocation'],
  team: ['Team Members', 'Team Overview'],
  followups: ['Follow-ups & Activities', 'Customer Engagement'],
  deals: ['Deals', 'Sales Conversion'],
  quotations: ['Quotations', 'Price Proposals'],
  customers: ['Customers', 'Customer Accounts'],
  'service-requests': ['Service Requests', 'Customer Service'],
  finance: ['Finance', 'Invoices & Payments'],
  performance: ['Team Performance', 'Analytics'],
  reports: ['Reports', 'Sales & Financial'],
  notifications: ['Notifications', 'Updates'],
  settings: ['Settings', 'Profile & Preferences'],
}

export default function ManagerTopbar({ currentPage, user, onNavigate }) {
  const [title, subtitle] = TITLES[currentPage] || TITLES.dashboard
  const { data } = useLoad(loadAttention)
  const items = data || []
  return (
    <Topbar
      breadcrumb={{ title, subtitle }}
      user={user}
      notifications={{
        items,
        unread: items.length,
        onSelect: () => onNavigate('notifications'),
      }}
      onProfile={() => onNavigate('settings')}
    />
  )
}