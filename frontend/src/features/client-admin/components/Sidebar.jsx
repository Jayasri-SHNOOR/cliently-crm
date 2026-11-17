
import {
  LayoutDashboard,
  Users,
  Briefcase,
  UserRound,
  Settings,
  HelpCircle,
  PackageCheck,
  CreditCard,
  LogOut,
  ContactRound
} from 'lucide-react'

function Sidebar({ onNavigate, currentPage, onLogout }) {

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'customers', label: 'Customers', icon: ContactRound },
    { id: 'deals', label: 'Deals', icon: Briefcase },
    { id: 'employees', label: 'Employees', icon: UserRound },
    { id: 'products', label: 'Our Products', icon: PackageCheck },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'help', label: 'Help & Support', icon: HelpCircle }
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-box">DH</div>

        <div className="logo-brand">
          <div className="logo-text">DevHub</div>
          <div className="logo-powered">Powered by Cliently</div>
        </div>
      </div>

      <div className="sidebar-content">
        <p className="nav-title">MAIN MENU</p>

        <nav className="nav-menu">
          {menuItems.map((item) => {
            const Icon = item.icon

            return (
              <button
                key={item.id}
                className={`nav-item ${
                  currentPage === item.id ? 'active' : ''
                }`}
                onClick={() => onNavigate(item.id)}
              >
                <Icon className="nav-icon" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      <div className="sidebar-bottom">
        <button className="nav-item" onClick={onLogout}>
          <LogOut className="nav-icon" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
