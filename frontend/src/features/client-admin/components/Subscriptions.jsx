
import { useEffect, useState } from 'react'
import {
  CreditCard,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  X,
  CheckCircle,
  Clock,
  Ban,
  AlertCircle
} from 'lucide-react'
import api from '../services/api'
import './Subscriptions.css'

const emptyForm = {
  customerName: '',
  customerEmail: '',
  customerCompany: '',
  productName: '',
  amount: '',
  billingCycle: 'Monthly',
  startDate: new Date().toISOString().slice(0, 10),
  nextBillingDate: '',
  endDate: '',
  status: 'Active',
  notes: ''
}

function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const loadSubscriptions = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await api.get('/subscriptions')
      const result = response.data
      const data = Array.isArray(result)
        ? result
        : result.data || result.subscriptions || []

      setSubscriptions(data)
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to load subscriptions. Please check the backend API.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadSubscriptions, 0)
    return () => clearTimeout(timer)
  }, [])

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  const openCreateForm = () => {
    setEditingId(null)
    setForm({ ...emptyForm, startDate: new Date().toISOString().slice(0, 10) })
    setShowForm(true)
    setError('')
  }

  const openEditForm = (subscription) => {
    setEditingId(subscription._id)
    setForm({
      customerName: subscription.customerName || '',
      customerEmail: subscription.customerEmail || '',
      customerCompany: subscription.customerCompany || '',
      productName: subscription.productName || '',
      amount: subscription.amount ?? '',
      billingCycle: subscription.billingCycle || 'Monthly',
      startDate: subscription.startDate
        ? subscription.startDate.slice(0, 10)
        : '',
      nextBillingDate: subscription.nextBillingDate
        ? subscription.nextBillingDate.slice(0, 10)
        : '',
      endDate: subscription.endDate
        ? subscription.endDate.slice(0, 10)
        : '',
      status: subscription.status || 'Pending',
      notes: subscription.notes || ''
    })
    setShowForm(true)
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      ...form,
      amount: Number(form.amount),
      startDate: form.startDate || undefined,
      nextBillingDate: form.nextBillingDate || undefined,
      endDate: form.endDate || undefined
    }

    try {
      if (editingId) {
        await api.put(`/subscriptions/${editingId}`, payload)
      } else {
        await api.post('/subscriptions', payload)
      }

      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm)
      await loadSubscriptions()
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to save subscription. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  const cancelSubscription = async (subscription) => {
    const confirmed = window.confirm(
      `Cancel the subscription for ${subscription.customerName}?`
    )

    if (!confirmed) return

    setError('')

    try {
      await api.patch(`/subscriptions/${subscription._id}/cancel`)
      await loadSubscriptions()
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to cancel this subscription.'
      )
    }
  }

  const filteredSubscriptions = subscriptions.filter((subscription) => {
    const searchText = [
      subscription.customerName,
      subscription.customerEmail,
      subscription.customerCompany,
      subscription.productName
    ].join(' ').toLowerCase()

    const matchesSearch = searchText.includes(search.toLowerCase())
    const matchesStatus =
      statusFilter === 'All' || subscription.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const activeCount = subscriptions.filter(
    (item) => item.status === 'Active'
  ).length

  const pendingCount = subscriptions.filter(
    (item) => item.status === 'Pending'
  ).length

  const totalRevenue = subscriptions
    .filter((item) => item.status === 'Active')
    .reduce((total, item) => total + Number(item.amount || 0), 0)

  const formatAmount = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(Number(amount || 0))

  const formatDate = (date) => {
    if (!date) return '—'

    const parsed = new Date(date)
    if (Number.isNaN(parsed.getTime())) return '—'

    return parsed.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <section className="subscriptions-page">
      <div className="subscriptions-header">
        <div>
          <h1>Subscriptions</h1>
          <p>Manage customer plans, billing cycles and subscription status.</p>
        </div>

        <button className="subscription-primary-btn" onClick={openCreateForm}>
          <Plus size={18} />
          Add Subscription
        </button>
      </div>

      {error && (
        <div className="subscription-error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError('')} aria-label="Dismiss error">
            <X size={17} />
          </button>
        </div>
      )}

      <div className="subscription-stats">
        <div className="subscription-stat-card">
          <div className="subscription-stat-icon">
            <CreditCard size={21} />
          </div>
          <span>Total Subscriptions</span>
          <strong>{subscriptions.length}</strong>
        </div>

        <div className="subscription-stat-card">
          <div className="subscription-stat-icon active-icon">
            <CheckCircle size={21} />
          </div>
          <span>Active</span>
          <strong>{activeCount}</strong>
        </div>

        <div className="subscription-stat-card">
          <div className="subscription-stat-icon pending-icon">
            <Clock size={21} />
          </div>
          <span>Pending</span>
          <strong>{pendingCount}</strong>
        </div>

        <div className="subscription-stat-card">
          <div className="subscription-stat-icon revenue-icon">
            <CreditCard size={21} />
          </div>
          <span>Active Subscription Value</span>
          <strong>{formatAmount(totalRevenue)}</strong>
        </div>
      </div>

      <div className="subscription-toolbar">
        <div className="subscription-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search customer, email or product..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter by subscription status"
        >
          <option value="All">All statuses</option>
          <option value="Active">Active</option>
          <option value="Pending">Pending</option>
          <option value="Expired">Expired</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <button
          className="subscription-refresh-btn"
          onClick={loadSubscriptions}
          title="Refresh subscriptions"
        >
          <RefreshCw size={17} />
        </button>
      </div>

      <div className="subscription-table-card">
        <div className="subscription-table-heading">
          <div>
            <h2>Customer Plans</h2>
            <p>{filteredSubscriptions.length} subscriptions found</p>
          </div>
        </div>

        {loading ? (
          <div className="subscription-empty">
            <RefreshCw size={25} />
            <p>Loading subscriptions...</p>
          </div>
        ) : filteredSubscriptions.length === 0 ? (
          <div className="subscription-empty">
            <CreditCard size={35} />
            <h3>No subscriptions found</h3>
            <p>Add a subscription or change your search filters.</p>
          </div>
        ) : (
          <div className="subscription-table-wrapper">
            <table className="subscription-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Product / Plan</th>
                  <th>Amount</th>
                  <th>Billing Cycle</th>
                  <th>Next Billing</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredSubscriptions.map((subscription) => (
                  <tr key={subscription._id}>
                    <td>
                      <div className="subscription-customer">
                        <div className="subscription-avatar">
                          {(subscription.customerName || '?')
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div>
                          <strong>{subscription.customerName}</strong>
                          <span>{subscription.customerEmail}</span>
                          {subscription.customerCompany && (
                            <small>{subscription.customerCompany}</small>
                          )}
                        </div>
                      </div>
                    </td>

                    <td>
                      <strong>{subscription.productName}</strong>
                    </td>

                    <td className="subscription-amount">
                      {formatAmount(subscription.amount)}
                    </td>

                    <td>{subscription.billingCycle || '—'}</td>

                    <td>{formatDate(subscription.nextBillingDate)}</td>

                    <td>
                      <span
                        className={`subscription-status status-${(
                          subscription.status || 'pending'
                        ).toLowerCase()}`}
                      >
                        {subscription.status || 'Pending'}
                      </span>
                    </td>

                    <td>
                      <div className="subscription-actions">
                        <button
                          onClick={() => openEditForm(subscription)}
                          title="Edit subscription"
                          aria-label="Edit subscription"
                        >
                          <Pencil size={16} />
                        </button>

                        {subscription.status !== 'Cancelled' &&
                          subscription.status !== 'Expired' && (
                            <button
                              className="subscription-cancel-action"
                              onClick={() => cancelSubscription(subscription)}
                              title="Cancel subscription"
                              aria-label="Cancel subscription"
                            >
                              <Ban size={16} />
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div
          className="subscription-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setShowForm(false)
            }
          }}
        >
          <div
            className="subscription-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="subscription-form-title"
          >
            <div className="subscription-modal-header">
              <div>
                <h2 id="subscription-form-title">
                  {editingId ? 'Edit Subscription' : 'Add Subscription'}
                </h2>
                <p>Enter the customer and plan details below.</p>
              </div>

              <button
                onClick={() => setShowForm(false)}
                disabled={saving}
                aria-label="Close form"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="subscription-form-grid">
                <label>
                  Customer Name *
                  <input
                    name="customerName"
                    value={form.customerName}
                    onChange={updateField}
                    required
                    maxLength={120}
                  />
                </label>

                <label>
                  Customer Email *
                  <input
                    type="email"
                    name="customerEmail"
                    value={form.customerEmail}
                    onChange={updateField}
                    required
                    maxLength={160}
                  />
                </label>

                <label>
                  Company
                  <input
                    name="customerCompany"
                    value={form.customerCompany}
                    onChange={updateField}
                    maxLength={160}
                  />
                </label>

                <label>
                  Product / Plan *
                  <input
                    name="productName"
                    value={form.productName}
                    onChange={updateField}
                    required
                    maxLength={160}
                  />
                </label>

                <label>
                  Amount (₹) *
                  <input
                    type="number"
                    name="amount"
                    value={form.amount}
                    onChange={updateField}
                    min="0"
                    step="0.01"
                    required
                  />
                </label>

                <label>
                  Billing Cycle *
                  <select
                    name="billingCycle"
                    value={form.billingCycle}
                    onChange={updateField}
                    required
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Yearly">Yearly</option>
                    <option value="One-time">One-time</option>
                  </select>
                </label>

                <label>
                  Start Date
                  <input
                    type="date"
                    name="startDate"
                    value={form.startDate}
                    onChange={updateField}
                  />
                </label>

                <label>
                  Next Billing Date
                  <input
                    type="date"
                    name="nextBillingDate"
                    value={form.nextBillingDate}
                    onChange={updateField}
                  />
                </label>

                <label>
                  End Date
                  <input
                    type="date"
                    name="endDate"
                    value={form.endDate}
                    onChange={updateField}
                  />
                </label>

                <label>
                  Status *
                  <select
                    name="status"
                    value={form.status}
                    onChange={updateField}
                    required
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Expired">Expired</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </label>

                <label className="subscription-notes-field">
                  Notes
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={updateField}
                    rows="3"
                    maxLength={1000}
                  />
                </label>
              </div>

              <div className="subscription-form-actions">
                <button
                  type="button"
                  className="subscription-secondary-btn"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                >
                  Close
                </button>

                <button
                  type="submit"
                  className="subscription-primary-btn"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : editingId
                      ? 'Save Changes'
                      : 'Create Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

export default Subscriptions
