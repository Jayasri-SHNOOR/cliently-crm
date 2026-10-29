
import './Logout.css'
import { LogOut, ArrowLeft } from 'lucide-react'

function Logout({ onBackToLogin }) {
  return (
    <div className="logout-page">
      <div className="logout-card">
        <div className="logout-icon">
          <LogOut size={32} />
        </div>

        <h1>You have been logged out</h1>

        <p>
          Your session has ended successfully.
          Thank you for using Cliently!
        </p>

        <button
          type="button"
          className="logout-back-button"
          onClick={onBackToLogin}
        >
          <ArrowLeft size={18} />
          Back to Login
        </button>
      </div>
    </div>
  )
}

export default Logout
