import { LogOut } from 'lucide-react'

export default function Sidebar({ brand, items, currentPage, onNavigate, onLogout, sectionTitle = 'MAIN MENU' }) {
  return (
    <aside className="ly-sidebar">
      <div className="ly-sidebar__logo">
        <div className="ly-logo-box">{brand.initials}</div>
        <div className="ly-logo-brand">
          <div className="ly-logo-text">{brand.name}</div>
          {brand.sub && <div className="ly-logo-sub">{brand.sub}</div>}
        </div>
      </div>

      <div className="ly-sidebar__content">
  {sectionTitle && <p className="ly-nav-title">{sectionTitle}</p>}
  <nav className="ly-nav">
    {items.map((item) =>
      item.section ? (
        <p key={item.section} className="ly-nav-title ly-nav-title--sub">{item.section}</p>
      ) : (
        <button
          key={item.id}
          className={`ly-nav-item ${currentPage === item.id ? 'active' : ''}`}
          onClick={() => onNavigate(item.id)}
        >
          <item.icon className="ly-nav-icon" />
          <span>{item.label}</span>
        </button>
      )
    )}
  </nav>
</div>

      <div className="ly-sidebar__bottom">
        <button className="ly-nav-item" onClick={onLogout}>
          <LogOut className="ly-nav-icon" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}