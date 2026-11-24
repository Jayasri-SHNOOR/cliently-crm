import { useCallback, useEffect, useState } from 'react'
import api from '../services/api'
import Topbar from '../../../layouts/Topbar'

const TITLES = {
  dashboard: ['Dashboard', 'Overview'],
  leads: ['Leads', 'Lead Management'],
  customers: ['Customers', 'Customer Management'],
  deals: ['Deals', 'Deal Management'],
  employees: ['Employees', 'Employee Management'],
  products: ['Our Products', 'Product Management'],
  subscriptions: ['Subscriptions', 'Plans & Billing'],
  help: ['Help & Support', 'Support Center'],
}

const SETTINGS_SUB = { profile: 'Profile', security: 'Security', notifications: 'Notifications' }
const NOTIF_ROUTES = {
  leads: 'leads', deals: 'deals', support: 'help', help: 'help', settings: 'settings',
  profile: 'profile', products: 'products', employees: 'employees', dashboard: 'dashboard',
}

export default function ClientAdminTopbar({ onNavigate, currentPage, settingsSection }) {
  const [user, setUser] = useState({ name: '', initials: 'A', role: 'Admin', company: '' })
  const [notes, setNotes] = useState({ items: [], unread: 0 })

  useEffect(() => {
    let active = true
    api.get('/me').then((res) => {
      if (!active) return
      const d = res.data.user ?? res.data
      const name = d.name || d.adminName || 'Admin'
      setUser({
        name,
        initials: d.initials || name.charAt(0).toUpperCase(),
        role: d.roleLabel || d.role || 'Admin',
        company: d.company?.name || d.companyName || '',
      })
    }).catch((e) => console.error('Failed to fetch profile:', e))

    api.get('/notifications').then((res) => {
      if (!active) return
      setNotes({ items: res.data.notifications || [], unread: res.data.unreadCount ?? 0 })
    }).catch((e) => console.error('Failed to fetch notifications:', e))

    return () => { active = false }
  }, [])

  const handleSearch = useCallback(async (q) => {
    try {
      const res = await api.get('/search', { params: { q } })
      const r = res.data.results || {}
      const toItems = (list, page, fallback) =>
        (list || []).map((x) => ({
          key: x.id || x._id,
          title: x.title || x.name,
          subtitle: `${x.subtitle || x.company || x.customer || fallback} · ${x.status}`,
          onSelect: () => onNavigate(page),
        }))
      return [
        { title: 'Leads', items: toItems(r.leads, 'leads', 'No company') },
        { title: 'Deals', items: toItems(r.deals, 'deals', 'No customer') },
      ].filter((g) => g.items.length)
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Unable to search right now.')
    }
  }, [onNavigate])

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all')
      setNotes((n) => ({ unread: 0, items: n.items.map((i) => ({ ...i, read: true })) }))
    } catch (e) { console.error('Failed to mark notifications as read:', e) }
  }

  const handleNotificationSelect = async (n) => {
    if (!n.read) await markAllRead()
    const page = NOTIF_ROUTES[n.link?.page]
    if (page) onNavigate(page)
  }

  const [title, subtitle] =
    currentPage === 'settings'
      ? ['Settings', SETTINGS_SUB[settingsSection] || 'Configuration']
      : TITLES[currentPage] || TITLES.dashboard

  return (
    <Topbar
      breadcrumb={{ title, subtitle }}
      user={user}
      onSearch={handleSearch}
      searchPlaceholder="Search leads, deals, contacts..."
      notifications={{ items: notes.items, unread: notes.unread, onMarkAll: markAllRead, onSelect: handleNotificationSelect }}
      onProfile={() => onNavigate('profile')}
    />
  )
}