import { useEffect, useState } from 'react'
import api from '../services/api'
import './Leads.css'

const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

function Leads() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const fetchLeads = async () => {
      try {
        const response = await api.get('/leads')
        if (!active) return

        const list = Array.isArray(response.data)
          ? response.data
          : response.data.leads || []

        setLeads(list.map((lead) => ({ ...lead, id: lead._id || lead.id })))
      } catch (err) {
        if (!active) return
        setError(
          err.response?.data?.message ||
          'Unable to load leads. Please try again.'
        )
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchLeads()

    return () => {
      active = false
    }
  }, [])

  const assignedExecutives = new Set(
    leads.map((lead) => lead.executive).filter(Boolean)
  ).size

  return (
    <main className="leads-page">
      <section className="leads-page-header">
        <div>
          <h1>Leads</h1>
          <p>Manage and track all your leads</p>
        </div>
      </section>

      {error && (
        <p className="leads-error" role="alert">
          {error}
        </p>
      )}

      <section className="leads-summary">
        <div className="lead-summary-card">
          <span>Total Leads</span>
          <strong>{leads.length}</strong>
        </div>
        <div className="lead-summary-card">
          <span>New</span>
          <strong>{leads.filter((lead) => lead.status === 'New').length}</strong>
        </div>
        <div className="lead-summary-card">
          <span>Qualified</span>
          <strong>{leads.filter((lead) => lead.status === 'Qualified').length}</strong>
        </div>
        <div className="lead-summary-card">
          <span>Assigned Executives</span>
          <strong>{assignedExecutives}</strong>
        </div>
      </section>

      <section className="leads-table-card">
        <div className="leads-table-header">
          <div>
            <h2>All Leads</h2>
            <p>Complete lead information and assigned sales executives</p>
          </div>
        </div>
        <div className="leads-table-wrapper">
          <table className="leads-table">
            <thead>
              <tr>
                <th>LEAD</th>
                <th>COMPANY</th>
                <th>CONTACT</th>
                <th>STATUS</th>
                <th>VALUE</th>
                <th>PRODUCT ENQUIRED</th>
                <th>SALES EXECUTIVE</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="7">Loading leads...</td>
                </tr>
              )}

              {!loading && leads.length === 0 && !error && (
                <tr>
                  <td colSpan="7">No leads found.</td>
                </tr>
              )}

              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <div className="lead-name-cell">
                      <div className="lead-table-avatar">
                        {getInitials(lead.name)}
                      </div>
                      <div>
                        <strong>{lead.name}</strong>
                        <span>{lead.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>{lead.company}</td>
                  <td>{lead.phone}</td>
                  <td>
                    <span
                      className={`lead-page-status ${(lead.status || '').toLowerCase()}`}
                    >
                      {lead.status}
                    </span>
                  </td>
                  <td className="lead-page-value">
                    ₹{((lead.value || 0) / 100000).toFixed(1)}L
                  </td>
                  <td>{lead.productInterested}</td>
                  <td>
                    <div className="executive-cell">
                      <div className="executive-avatar">
                        {getInitials(lead.executive) || '–'}
                      </div>
                      <span>{lead.executive || 'Unassigned'}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

export default Leads
