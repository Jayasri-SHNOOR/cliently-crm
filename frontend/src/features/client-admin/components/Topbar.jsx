import './Topbar.css'
import { useState, useEffect, useRef } from 'react'
import {
  Search,
  Bell,
  ChevronDown,
  UserRound
} from 'lucide-react'
import api from '../services/api'

function Topbar({ onNavigate, currentPage, settingsSection }) {
  const [profileOpen, setProfileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState({
    leads: [],
    deals: []
  })
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [notificationOpen, setNotificationOpen] = useState(false)

  const [user, setUser] = useState({
    name: '',
    initials: 'A',
    role: 'Admin',
    company: ''
  })

  const searchRef = useRef(null)
  const profileRef = useRef(null)
  const notificationRef = useRef(null)

  const breadcrumbMap = {
    dashboard: {
      title: 'Dashboard',
      subtitle: 'Overview'
    },
    leads: {
      title: 'Leads',
      subtitle: 'Lead Management'
    },
    deals: {
      title: 'Deals',
      subtitle: 'Deal Management'
    },
    employees: {
      title: 'Employees',
      subtitle: 'Employee Management'
    },
    products: {
      title: 'Our Products',
      subtitle: 'Product Management'
    },
    settings: {
      title: 'Settings',
      subtitle:
        settingsSection === 'profile'
          ? 'Profile'
          : settingsSection === 'security'
            ? 'Security'
            : settingsSection === 'notifications'
              ? 'Notifications'
              : 'Configuration'
    },
    help: {
      title: 'Help & Support',
      subtitle: 'Support Center'
    }
  }

  const breadcrumb =
    breadcrumbMap[currentPage] || breadcrumbMap.dashboard

  useEffect(() => {
    let active = true

    const fetchUser = async () => {
      try {
        const response = await api.get('/me')
        const data = response.data.user ?? response.data
        const name = data.name || data.adminName || 'Admin'

        if (!active) return

        setUser({
          name,
          initials: data.initials || name.charAt(0).toUpperCase(),
          role: data.roleLabel || data.role || 'Admin',
          company: data.company?.name || data.companyName || ''
        })
      } catch (error) {
        console.error('Failed to fetch profile:', error)
      }
    }

    fetchUser()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    const fetchNotifications = async () => {
      try {
        const response = await api.get('/notifications')

        if (!active) return

        const data = response.data
        setNotificationCount(data.unreadCount ?? 0)
        setNotifications(data.notifications || [])
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
      }
    }

    fetchNotifications()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const query = searchQuery.trim()

    if (query.length < 2) {
      setSearchResults({ leads: [], deals: [] })
      setSearchError('')
      setSearchLoading(false)
      return
    }

    if (query.length > 50) {
      setSearchResults({ leads: [], deals: [] })
      setSearchError('Search must be 50 characters or less.')
      setSearchLoading(false)
      return
    }

    let active = true

    setSearchLoading(true)
    setSearchError('')

    const timer = setTimeout(async () => {
      try {
        const response = await api.get('/search', {
          params: { q: query }
        })

        if (!active) return

        setSearchResults({
          leads: response.data.results?.leads || [],
          deals: response.data.results?.deals || []
        })
      } catch (error) {
        if (!active) return

        setSearchError(
          error.response?.data?.message ||
          'Unable to search right now.'
        )

        setSearchResults({ leads: [], deals: [] })
      } finally {
        if (active) setSearchLoading(false)
      }
    }, 300)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [searchQuery])

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false)
      }

      if (
        searchRef.current &&
        !searchRef.current.contains(event.target)
      ) {
        setSearchOpen(false)
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [])

  const displayName = user.name || 'Admin'
  const avatarLetter =
    user.initials || displayName.charAt(0).toUpperCase()

  const handleSearchResult = (type) => {
    setSearchOpen(false)
    setSearchQuery('')
    onNavigate(type)
  }

  const markNotificationsAsRead = async () => {
    try {
      await api.post('/notifications/read-all')

      setNotificationCount(0)
      setNotifications((current) =>
        current.map((item) => ({ ...item, read: true }))
      )
    } catch (error) {
      console.error('Failed to mark notifications as read:', error)
    }
  }

  const handleNotificationClick = async (notification) => {
    setNotificationOpen(false)

    if (!notification.read) {
      try {
        await api.post('/notifications/read-all')

        setNotificationCount(0)
        setNotifications((current) =>
          current.map((item) => ({ ...item, read: true }))
        )
      } catch (error) {
        console.error('Failed to mark notifications as read:', error)
      }
    }

    const pageRoutes = {
      leads: 'leads',
      deals: 'deals',
      support: 'help',
      help: 'help',
      settings: 'settings',
      profile: 'profile',
      products: 'products',
      employees: 'employees',
      dashboard: 'dashboard'
    }

    const page = pageRoutes[notification.link?.page]

    if (page) {
      onNavigate(page)
    }
  }

  const handleViewNotifications = async () => {
    setNotificationOpen(false)
    await markNotificationsAsRead()
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="breadcrumb">
          <span className="breadcrumb-active">
            {breadcrumb.title}
          </span>

          <span className="breadcrumb-separator">/</span>

          <span>{breadcrumb.subtitle}</span>
        </div>

        <div className="search-wrapper" ref={searchRef}>
          <div className="search-box">
            <Search className="search-icon" size={18} />

            <input
              type="text"
              placeholder="Search leads, deals, contacts..."
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value)
                setSearchOpen(true)
              }}
              onFocus={() => setSearchOpen(true)}
              aria-label="Search leads and deals"
            />
          </div>

          {searchOpen && searchQuery.trim().length >= 2 && (
            <div className="search-results">
              {searchLoading && (
                <p className="search-message">Searching...</p>
              )}

              {!searchLoading && searchError && (
                <p className="search-message">{searchError}</p>
              )}

              {!searchLoading &&
                !searchError &&
                searchResults.leads.length === 0 &&
                searchResults.deals.length === 0 && (
                  <p className="search-message">No results found.</p>
                )}

              {searchResults.leads.length > 0 && (
                <div className="search-result-group">
                  <strong className="search-group-title">Leads</strong>

                  {searchResults.leads.map((lead) => (
                    <button
                      type="button"
                      key={lead.id || lead._id}
                      className="search-result-item"
                      onClick={() => handleSearchResult('leads')}
                    >
                      <span>{lead.title || lead.name}</span>
                      <small>
                        {lead.subtitle || lead.company || 'No company'}
                        {' · '}
                        {lead.status}
                      </small>
                    </button>
                  ))}
                </div>
              )}

              {searchResults.deals.length > 0 && (
                <div className="search-result-group">
                  <strong className="search-group-title">Deals</strong>

                  {searchResults.deals.map((deal) => (
                    <button
                      type="button"
                      key={deal.id || deal._id}
                      className="search-result-item"
                      onClick={() => handleSearchResult('deals')}
                    >
                      <span>{deal.title || deal.name}</span>
                      <small>
                        {deal.subtitle || deal.customer || 'No customer'}
                        {' · '}
                        {deal.status}
                      </small>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="topbar-right">
        <div
          className="notification-wrapper"
          ref={notificationRef}
        >
          <button
            type="button"
            className="notification-button"
            aria-label="Notifications"
            aria-expanded={notificationOpen}
            onClick={() => {
              setNotificationOpen((open) => !open)
              setProfileOpen(false)
            }}
          >
            <Bell size={19} />

            {notificationCount > 0 && (
              <span className="notification-count">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </button>

          {notificationOpen && (
            <div className="notification-dropdown">
              <div className="notification-dropdown-header">
                <strong>Notifications</strong>

                <button
                  type="button"
                  onClick={handleViewNotifications}
                >
                  Mark all as read
                </button>
              </div>

              {notifications.length === 0 ? (
                <p className="notification-empty">
                  No notifications.
                </p>
              ) : (
                notifications.map((notification) => (
                  <button
                    type="button"
                    className="notification-item"
                    key={notification.id || notification._id}
                    onClick={() =>
                      handleNotificationClick(notification)
                    }
                  >
                    <strong>{notification.title}</strong>
                    <span>{notification.message}</span>
                    {!notification.read && <small>Unread</small>}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="topbar-divider" />

        <div className="profile-wrapper" ref={profileRef}>
          <button
            type="button"
            className="profile-button"
            aria-expanded={profileOpen}
            onClick={() => {
              setProfileOpen((open) => !open)
              setNotificationOpen(false)
            }}
          >
            <div className="profile-pic">{avatarLetter}</div>

            <div className="profile-info">
              <span className="profile-name">{displayName}</span>
              <span className="profile-role">{user.role}</span>
            </div>

            <ChevronDown
              size={16}
              className={profileOpen ? 'chevron-up' : ''}
            />
          </button>

          {profileOpen && (
            <div className="profile-dropdown">
              <div className="dropdown-user">
                <div className="dropdown-avatar">
                  {avatarLetter}
                </div>

                <div>
                  <strong>{displayName}</strong>
                  <span>{user.role}</span>
                  {user.company && <span>{user.company}</span>}
                </div>
              </div>

              <div className="dropdown-divider" />

              <button
                type="button"
                className="dropdown-item"
                onClick={() => {
                  setProfileOpen(false)
                  onNavigate('profile')
                }}
              >
                <UserRound size={17} />
                <span>Profile</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Topbar
