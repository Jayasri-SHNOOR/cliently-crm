
import { useEffect, useState } from 'react'
import api from '../services/api'
import './HelpSupport.css'

function HelpSupport() {
  const [search, setSearch] = useState('')
  const [articles, setArticles] = useState([])
  const [guides, setGuides] = useState([])
  const [tickets, setTickets] = useState([])
  const [systemStatus, setSystemStatus] = useState(null)

  const [showContact, setShowContact] = useState(false)
  const [showTickets, setShowTickets] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState(null)

  const [form, setForm] = useState({
    subject: '',
    category: 'Technical Issue',
    priority: 'Medium',
    description: ''
  })

  const [loading, setLoading] = useState(false)
  const [closingTicketId, setClosingTicketId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    async function loadHelpData() {
      try {
        const [guideRes, statusRes] = await Promise.all([
          api.get('/help/guides'),
          api.get('/help/status')
        ])

        setGuides(guideRes.data.guides || [])
        setSystemStatus(statusRes.data)
      } catch (err) {
        setError(
          err.response?.data?.message ||
          'Unable to load help information.'
        )
      }
    }

    loadHelpData()
  }, [])

  async function searchArticles(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setSelectedArticle(null)

    if (search.trim().length < 2) {
      setError('Enter at least 2 characters to search.')
      return
    }

    try {
      setLoading(true)

      const response = await api.get('/help/articles', {
        params: { search: search.trim() }
      })

      setArticles(response.data.articles || [])

      if ((response.data.articles || []).length === 0) {
        setSuccess('No matching help articles found.')
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to search help articles.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function openArticle(slug) {
    try {
      setError('')
      setSuccess('')

      const response = await api.get(
        `/help/articles/${encodeURIComponent(slug)}`
      )

      setSelectedArticle(response.data)
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to open this article.'
      )
    }
  }

  async function loadTickets() {
    try {
      setError('')
      setSuccess('')
      setShowTickets(true)
      setLoading(true)

      const response = await api.get('/support/tickets')
      setTickets(response.data.tickets || [])
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to load support tickets.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function submitTicket(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    try {
      setLoading(true)

      const response = await api.post('/support/tickets', {
        ...form,
        subject: form.subject.trim(),
        description: form.description.trim()
      })

      setSuccess(
        `Ticket ${response.data.ticketNumber} created successfully!`
      )

      setForm({
        subject: '',
        category: 'Technical Issue',
        priority: 'Medium',
        description: ''
      })

      setShowContact(false)

      const ticketResponse = await api.get('/support/tickets')
      setTickets(ticketResponse.data.tickets || [])
      setShowTickets(true)
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to create support ticket.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function closeTicket(ticket) {
    setError('')
    setSuccess('')
    setClosingTicketId(ticket.id)

    try {
      const response = await api.post(`/support/tickets/${ticket.id}/close`)

      setTickets((currentTickets) =>
        currentTickets.map((currentTicket) =>
          currentTicket.id === ticket.id
            ? { ...currentTicket, status: response.data?.status || 'Closed' }
            : currentTicket
        )
      )

      setSuccess(`Ticket ${ticket.ticketNumber} closed successfully.`)
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to close support ticket.'
      )
    } finally {
      setClosingTicketId(null)
    }
  }

  return (
    <main className="help-page">
      <section className="help-header">
        <div>
          <h1>Help &amp; Support</h1>
          <p>
            Get help with Cliently and manage your support requests.
          </p>
        </div>
      </section>

      {error && <p className="help-error">{error}</p>}
      {success && <p className="help-success">{success}</p>}

      <section className="help-search-card">
        <div className="help-search-icon">⌕</div>

        <div>
          <h2>How can we help?</h2>
          <p>
            Search Cliently guides, features and troubleshooting articles.
          </p>
        </div>

        <form onSubmit={searchArticles} className="help-search-form">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            type="search"
            placeholder="Search help articles..."
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </section>

      {articles.length > 0 && (
        <section className="help-section-card">
          <h2>Search Results</h2>

          {articles.map((article) => (
            <div className="guide-item" key={article.slug}>
              <div>
                <strong>{article.title}</strong>
                <p>{article.summary}</p>

                <button
                  type="button"
                  onClick={() => openArticle(article.slug)}
                >
                  Read article →
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {selectedArticle && (
        <section className="help-section-card">
          <h2>{selectedArticle.title}</h2>
          <p>{selectedArticle.content}</p>

          <button
            type="button"
            onClick={() => setSelectedArticle(null)}
          >
            Back
          </button>
        </section>
      )}

      <section className="help-grid">
        <div className="help-card">
          <div className="help-card-icon">?</div>
          <h2>Help Center</h2>
          <p>Find answers and learn how to use Cliently CRM.</p>

          <button
            type="button"
            onClick={() => {
              setSearch('')
              setArticles([])
              setSelectedArticle(null)
              setError('')
              setSuccess('')
            }}
          >
            Browse Help Center →
          </button>
        </div>

        <div className="help-card">
          <div className="help-card-icon">✉</div>
          <h2>Contact Support</h2>
          <p>
            Need assistance? Send a request to the Cliently support team.
          </p>

          <button
            type="button"
            onClick={() => {
              setShowContact(!showContact)
              setShowTickets(false)
              setError('')
              setSuccess('')
            }}
          >
            Contact Support →
          </button>
        </div>

        <div className="help-card">
          <div className="help-card-icon">✓</div>
          <h2>My Tickets</h2>
          <p>
            View and track your support requests submitted to Cliently.
          </p>

          <button type="button" onClick={loadTickets}>
            View Tickets →
          </button>
        </div>
      </section>

      {showContact && (
        <section className="help-section-card">
          <h2>Create Support Ticket</h2>

          <form onSubmit={submitTicket} className="support-form">
            <label>
              Subject
              <input
                required
                maxLength={150}
                value={form.subject}
                onChange={(event) =>
                  setForm({ ...form, subject: event.target.value })
                }
                placeholder="Enter ticket subject"
              />
            </label>

            <label>
              Category
              <select
                value={form.category}
                onChange={(event) =>
                  setForm({ ...form, category: event.target.value })
                }
              >
                {[
                  'Technical Issue',
                  'Billing',
                  'Account',
                  'Feature Request',
                  'Other'
                ].map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Priority
              <select
                value={form.priority}
                onChange={(event) =>
                  setForm({ ...form, priority: event.target.value })
                }
              >
                {['Low', 'Medium', 'High', 'Urgent'].map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Description
              <textarea
                required
                maxLength={2000}
                rows={5}
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                placeholder="Describe your issue..."
              />
            </label>

            <button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </form>
        </section>
      )}

      {showTickets && (
        <section className="help-section-card">
          <div className="help-section-header">
            <div>
              <h2>My Support Tickets</h2>
              <p>
                Tickets raised by your company to Cliently support.
              </p>
            </div>

            
          </div>

          {loading ? (
            <p>Loading tickets...</p>
          ) : tickets.length === 0 ? (
            <p>No support tickets found.</p>
          ) : (
            <div className="support-ticket-list">
              {tickets.map((ticket) => (
                <div className="support-ticket-item" key={ticket.id}>
                  <strong>{ticket.ticketNumber}</strong>

                  <p>{ticket.subject}</p>

                  <span>{ticket.category}</span>
                  <span>{ticket.priority}</span>
                  <span>{ticket.status}</span>

                  <small>
                    Created: {new Date(ticket.createdAt).toLocaleString()}
                  </small>

                  {ticket.status !== 'Closed' && (
                    <button
                      type="button"
                      className="delete-ticket-button"
                      onClick={() => closeTicket(ticket)}
                      disabled={closingTicketId !== null}
                    >
                      {closingTicketId === ticket.id
                        ? 'Closing...'
                        : 'Close Ticket'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="help-bottom-grid">
        <div className="help-section-card">
          <div className="help-section-header">
            <div>
              <h2>Quick Guides</h2>
              <p>Learn the basics of Cliently CRM.</p>
            </div>
          </div>

          <div className="guide-list">
            {guides.map((guide) => (
              <div className="guide-item" key={guide.slug}>
                <div>
                  <strong>{guide.title}</strong>
                  <p>{guide.summary}</p>
                </div>

                <button
                  type="button"
                  onClick={() => openArticle(guide.slug)}
                >
                  Read →
                </button>
              </div>
            ))}

            {guides.length === 0 && (
              <p>No quick guides available.</p>
            )}
          </div>
        </div>

        <div className="help-section-card">
          <div className="help-section-header">
            <div>
              <h2>System Status</h2>
              <p>Current Cliently platform status.</p>
            </div>

            <span className="system-status-badge">
              {systemStatus?.overall || 'Checking status...'}
            </span>
          </div>

          <div className="system-status-list">
            {(systemStatus?.services || []).map((service) => (
              <div className="system-status-item" key={service.name}>
                <span>{service.name}</span>
                <strong>{service.status}</strong>
              </div>
            ))}
          </div>

          {systemStatus?.checkedAt && (
            <small>
              Last checked:{' '}
              {new Date(systemStatus.checkedAt).toLocaleString()}
            </small>
          )}
        </div>
      </section>
    </main>
  )
}

export default HelpSupport
