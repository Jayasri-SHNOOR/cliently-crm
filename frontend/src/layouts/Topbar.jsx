import { useEffect, useRef, useState } from 'react'
import { Search, Bell, ChevronDown, UserRound } from 'lucide-react'

export default function Topbar({
  breadcrumb, user = {}, onSearch, searchPlaceholder = 'Search...', notifications, onProfile,
}) {
  const [query, setQuery] = useState('')
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const searchRef = useRef(null)
  const notifRef = useRef(null)
  const profileRef = useRef(null)

  useEffect(() => {
    const q = query.trim()
    if (!onSearch || q.length < 2) { setGroups([]); setError(''); setLoading(false); return }
    if (q.length > 50) { setGroups([]); setError('Search must be 50 characters or less.'); setLoading(false); return }

    let active = true
    setLoading(true)
    setError('')
    const timer = setTimeout(async () => {
      try {
        const result = await onSearch(q)
        if (active) setGroups(result)
      } catch (err) {
        if (active) { setError(err.message || 'Unable to search right now.'); setGroups([]) }
      } finally {
        if (active) setLoading(false)
      }
    }, 300)
    return () => { active = false; clearTimeout(timer) }
  }, [query, onSearch])

  useEffect(() => {
    const onDown = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const name = user.name || 'User'
  const letter = user.initials || name.charAt(0).toUpperCase()
  const unread = notifications?.unread ?? 0
  const noResults = !loading && !error && groups.length === 0

  return (
    <header className="ly-topbar">
      <div className="ly-topbar__left">
        {breadcrumb && (
          <div className="ly-breadcrumb">
            <span className="ly-breadcrumb__active">{breadcrumb.title}</span>
            <span className="ly-breadcrumb__sep">/</span>
            <span>{breadcrumb.subtitle}</span>
          </div>
        )}

        {onSearch && (
          <div className="ly-search" ref={searchRef}>
            <div className="ly-search__box">
              <Search size={18} className="ly-search__icon" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSearchOpen(true) }}
                onFocus={() => setSearchOpen(true)}
                aria-label="Search"
              />
            </div>

            {searchOpen && query.trim().length >= 2 && (
              <div className="ly-pop ly-pop--search">
                {loading && <p className="ly-msg">Searching...</p>}
                {!loading && error && <p className="ly-msg">{error}</p>}
                {noResults && <p className="ly-msg">No results found.</p>}
                {groups.map((g) => (
                  <div className="ly-group" key={g.title}>
                    <strong className="ly-group__title">{g.title}</strong>
                    {g.items.map((it) => (
                      <button
                        type="button" key={it.key} className="ly-result"
                        onClick={() => { setSearchOpen(false); setQuery(''); it.onSelect?.() }}
                      >
                        <span>{it.title}</span>
                        <small>{it.subtitle}</small>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="ly-topbar__right">
        {notifications && (
          <div className="ly-rel" ref={notifRef}>
            <button
              type="button" className="ly-bell" aria-label="Notifications"
              onClick={() => { setNotifOpen((o) => !o); setProfileOpen(false) }}
            >
              <Bell size={19} />
              {unread > 0 && <span className="ly-badge">{unread > 99 ? '99+' : unread}</span>}
            </button>

            {notifOpen && (
              <div className="ly-pop ly-pop--notif">
                <div className="ly-notif__head">
                  <strong>Notifications</strong>
                  <button type="button" onClick={() => { setNotifOpen(false); notifications.onMarkAll?.() }}>
                    Mark all as read
                  </button>
                </div>
                {notifications.items.length === 0 ? (
                  <p className="ly-msg">No notifications.</p>
                ) : (
                  notifications.items.map((n) => (
                    <button
                      type="button" key={n.id || n._id} className="ly-notif__item"
                      onClick={() => { setNotifOpen(false); notifications.onSelect?.(n) }}
                    >
                      <strong>{n.title}</strong>
                      <span>{n.message}</span>
                      {!n.read && <small>Unread</small>}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {notifications && <div className="ly-divider" />}

        <div className="ly-rel" ref={profileRef}>
          <button
            type="button" className="ly-profile-btn"
            onClick={() => { setProfileOpen((o) => !o); setNotifOpen(false) }}
          >
            <div className="ly-avatar">{letter}</div>
            <div className="ly-profile-info">
              <span className="ly-profile-name">{name}</span>
              <span className="ly-profile-role">{user.role}</span>
            </div>
            <ChevronDown size={16} className={profileOpen ? 'ly-flip' : ''} />
          </button>

          {profileOpen && (
            <div className="ly-pop ly-pop--profile">
              <div className="ly-dd-user">
                <div className="ly-avatar ly-avatar--lg">{letter}</div>
                <div>
                  <strong>{name}</strong>
                  <span>{user.role}</span>
                  <span>{user?.tenant?.name || user?.tenant}</span>
                </div>
              </div>
              {onProfile && (
                <>
                  <div className="ly-dd-divider" />
                  <button type="button" className="ly-dd-item" onClick={() => { setProfileOpen(false); onProfile() }}>
                    <UserRound size={17} />
                    <span>Profile</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}