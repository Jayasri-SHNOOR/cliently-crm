import { useState, useEffect } from 'react'
import api from '../services/api'
import './Dashboard.css'

const STATUS_COLORS = {
  New: '#123C3A',
  Contacted: '#75D5C5',
  Qualified: '#2E9C88',
  Demo: '#3674A9',
  Proposal: '#7253A6',
  Negotiation: '#A36A18',
  Won: '#2D7A48',
  Lost: '#A04A4A'
}

function Dashboard({ onNavigate }) {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/dashboard')
        setDashboard(response.data)
      } catch (err) {
        console.error('Dashboard API error:', err)
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  if (loading) {
    return <main className="dashboard">Loading dashboard...</main>
  }

  if (error) {
    return (
      <main className="dashboard">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </main>
    )
  }

  const {
    stats = {},
    recentLeads = [],
    leadsByStatus = {},
    admin = {}
  } = dashboard || {}

  const statusEntries = Object.entries(STATUS_COLORS).map(([name, color]) => ({
    name,
    color,
    count: leadsByStatus[name] ?? 0
  }))

  const statusTotal = statusEntries.reduce((sum, entry) => sum + entry.count, 0)

  let angle = 0
  const gradientStops = statusEntries
    .filter((entry) => entry.count > 0)
    .map((entry) => {
      const start = angle
      angle += (entry.count / statusTotal) * 360
      return `${entry.color} ${start}deg ${angle}deg`
    })

  const chartBackground =
    statusTotal > 0
      ? `conic-gradient(${gradientStops.join(', ')})`
      : 'var(--soft-border)'

  const getInitials = (name) =>
    (name || 'L')
      .split(' ')
      .map((word) => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()

  return (
    <main className="dashboard">
      <section className="dashboard-header">
        <div className="dashboard-header-left">
          <h1>Hi, {admin?.name || 'Admin'}</h1>
          <p>Here's what's happening today</p>
        </div>

        <div className="dashboard-header-right">
          <button className="month-button">This Month</button>
        </div>
      </section>

      <section className="top-row">
        <div className="revenue-card">
          <span className="revenue-circle revenue-circle-one"></span>
          <span className="revenue-circle revenue-circle-two"></span>
          <p className="revenue-label">Total Revenue</p>
          <h2 className="revenue-value">
            ₹{(stats.totalRevenue ?? 0).toLocaleString('en-IN')}
          </h2>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
            </svg>
          </div>
          <div>
            <p className="stat-label">Total Leads</p>
            <h2 className="stat-value">{stats.totalLeads ?? 0}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l5 5L20 7" />
            </svg>
          </div>
          <div>
            <p className="stat-label">Qualified Leads</p>
            <h2 className="stat-value">{stats.qualifiedLeads ?? 0}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="7" width="18" height="13" rx="2" />
              <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
            </svg>
          </div>
          <div>
            <p className="stat-label">Open Deals</p>
            <h2 className="stat-value">{stats.openDeals ?? 0}</h2>
          </div>
        </div>
      </section>

      <section className="bottom-row">
        <div className="panel status-card">
          <h2 className="panel-title">Leads by Status</h2>
          <p className="panel-subtitle">{stats.totalLeads ?? 0} total leads</p>

          <div className="status-chart" style={{ background: chartBackground }}>
            <div className="status-chart-center">
              <strong>{stats.totalLeads ?? 0}</strong>
              <span>Total Leads</span>
            </div>
          </div>

          <div className="status-list">
            {statusEntries.map((entry) => (
              <div className="status-item" key={entry.name}>
                <span
                  className="status-dot"
                  style={{ backgroundColor: entry.color }}
                ></span>
                <span className="status-name">{entry.name}</span>
                <strong>{entry.count}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="panel recent-leads-card">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Recent Leads</h2>
              <p className="panel-subtitle">Latest leads added to your CRM</p>
            </div>

            <button
              type="button"
              className="view-all-button"
              onClick={() => onNavigate?.('leads')}
            >
              View all ↗
            </button>
          </div>

          <div className="recent-leads-list">
            {recentLeads.slice(0, 5).map((lead) => (
              <div className="lead-card" key={lead._id || lead.id}>
                <div className="lead-avatar">{getInitials(lead.name)}</div>

                <div className="lead-info">
                  <strong>{lead.name}</strong>
                  <span>{lead.email || 'No email yet'}</span>
                </div>

                <div className={`lead-status ${(lead.status || '').toLowerCase()}`}>
                  {lead.status}
                </div>

                <div className="lead-value">
                  ₹{((lead.value || 0) / 100000).toFixed(1)}L
                </div>
              </div>
            ))}

            {recentLeads.length === 0 && (
              <p className="no-leads">No leads found.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

export default Dashboard
