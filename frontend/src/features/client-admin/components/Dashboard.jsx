import { useState, useEffect } from 'react'
import api from '../services/api'
import './Dashboard.css'

const STATUS_COLORS = {
  New: '#123C3A',
  Contacted: '#75D5C5',
  Qualified: '#55B9A8',
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
    return (
      <main className="dashboard">
        Loading dashboard...
      </main>
    )
  }

  if (error) {
    return (
      <main className="dashboard">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </main>
    )
  }

  const {
    stats = {},
    recentLeads = [],
    leadsByStatus = {},
    admin = {}
  } = dashboard || {}

  const statusEntries = Object.entries(STATUS_COLORS).map(
    ([name, color]) => ({
      name,
      color,
      count: leadsByStatus[name] ?? 0
    })
  )

  const statusTotal = statusEntries.reduce(
    (total, entry) => total + entry.count,
    0
  )

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

  return (
    <main className="dashboard">
      <section className="dashboard-header">
        <div className="dashboard-header-left">
          <h1>Hi, {admin?.name || 'Admin'}</h1>
          <p>Here's what's happening today</p>
        </div>

        <div className="dashboard-header-right">
          <button className="month-button">
            This Month
          </button>
        </div>
      </section>

      <section className="sum-cards">
        <div className="sum-card">
          <div className="sum-card-top">
            <div className="sum-icon">♧</div>
            <button className="card-menu">⋯</button>
          </div>
          <p className="sum-label">Total Leads</p>
          <h2 className="sum-value">{stats.totalLeads ?? 0}</h2>
        </div>

        <div className="sum-card">
          <div className="sum-card-top">
            <div className="sum-icon">♧</div>
            <button className="card-menu">⋯</button>
          </div>
          <p className="sum-label">Qualified Leads</p>
          <h2 className="sum-value">{stats.qualifiedLeads ?? 0}</h2>
        </div>

        <div className="sum-card">
          <div className="sum-card-top">
            <div className="sum-icon">▣</div>
            <button className="card-menu">⋯</button>
          </div>
          <p className="sum-label">Open Deals</p>
          <h2 className="sum-value">{stats.openDeals ?? 0}</h2>
        </div>

        <div className="sum-card">
          <div className="sum-card-top">
            <div className="sum-icon">₹</div>
            <button className="card-menu">⋯</button>
          </div>
          <p className="sum-label">Total Revenue</p>
          <h2 className="sum-value">
            ₹{(stats.totalRevenue ?? 0).toLocaleString('en-IN')}
          </h2>
        </div>
      </section>

      <section className="leads-section">
        <div className="recent-leads-card">
          <div className="section-header">
            <div>
              <h2>Recent Leads</h2>
              <p>Latest leads added to your CRM</p>
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
            {recentLeads.map((lead) => (
              <div
                className="lead-row"
                key={lead._id || lead.id}
              >
                <div className="lead-person">
                  <div className="lead-avatar">
                    {(lead.name || 'L')
                      .split(' ')
                      .map((word) => word[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>

                  <div className="lead-info">
                    <strong>{lead.name}</strong>
                    <span>{lead.email}</span>
                  </div>
                </div>

                <div
                  className={`lead-status ${(lead.status || '').toLowerCase()}`}
                >
                  {lead.status}
                </div>

                <div className="lead-value">
                  ₹{((lead.value || 0) / 100000).toFixed(1)}L
                </div>
              </div>
            ))}

            {recentLeads.length === 0 && (
              <p>No leads found.</p>
            )}
          </div>
        </div>

        <div className="status-card">
          <div className="section-header">
            <div>
              <h2>Leads by Status</h2>
              <p>Current lead distribution</p>
            </div>
            <button className="card-menu">⋯</button>
          </div>

          <div className="status-content">
            <div
              className="status-chart"
              style={{ background: chartBackground }}
            >
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
                  <span>{entry.name}</span>
                  <strong>{entry.count}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Dashboard
