import './Sidebar.css'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  UserRound,
  Settings,
  HelpCircle,
  PackageCheck,
  LogOut
} from 'lucide-react'

function Sidebar({ onNavigate, currentPage, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-box">DH</div>
        <div className="logo-text">DevHub</div>
        <div className="logo-powered">Powered by Cliently</div>
      </div>

      <div className="sidebar-content">
        <p className="nav-title">NAVIGATION</p>

        <nav className="nav-menu">
          <button
            className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => onNavigate('dashboard')}
          >
            <LayoutDashboard className="nav-icon" />
            <span>Dashboard</span>
          </button>

          <button
            className={`nav-item ${currentPage === 'leads' ? 'active' : ''}`}
            onClick={() => onNavigate('leads')}
          >
            <Users className="nav-icon" />
            <span>Leads</span>
          </button>

          <button
            className={`nav-item ${currentPage === 'deals' ? 'active' : ''}`}
            onClick={() => onNavigate('deals')}
          >
            <Briefcase className="nav-icon" />
            <span>Deals</span>
          </button>

          <button
            className={`nav-item ${currentPage === 'employees' ? 'active' : ''}`}
            onClick={() => onNavigate('employees')}
          >
            <UserRound className="nav-icon" />
            <span>Employees</span>
          </button>

          <button
            className={`nav-item ${currentPage === 'products' ? 'active' : ''}`}
            onClick={() => onNavigate('products')}
          >
            <PackageCheck className="nav-icon" />
            <span>Our Products</span>
          </button>

          <button
            className={`nav-item ${currentPage === 'settings' ? 'active' : ''}`}
            onClick={() => onNavigate('settings')}
          >
            <Settings className="nav-icon" />
            <span>Settings</span>
          </button>

          <button
            className={`nav-item ${currentPage === 'help' ? 'active' : ''}`}
            onClick={() => onNavigate('help')}
          >
            <HelpCircle className="nav-icon" />
            <span>Help &amp; Support</span>
          </button>
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
