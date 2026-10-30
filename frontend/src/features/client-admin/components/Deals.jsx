
import { useEffect, useState } from 'react'
import api from '../services/api'
import './Deals.css'

const emptyForm = {
  name: '',
  customer: '',
  product: '',
  value: '',
  status: 'New',
  assignedTo: '',
  expectedClose: ''
}

const statuses = [
  'New',
  'Qualified',
  'Proposal',
  'Negotiation',
  'Won',
  'Lost'
]

const normalizeDeal = (deal) => ({
  ...deal,
  id: deal._id || deal.id,
  name: deal.name || '',
  customer: deal.customer || '',
  product: deal.product || '',
  value: Number(deal.value) || 0,
  status: deal.status || 'New',
  assignedTo: deal.assignedTo || '',
  expectedClose: deal.expectedClose || '',
  activities: Array.isArray(deal.activities) ? deal.activities : []
})

const getDateInputValue = (date) => {
  if (!date) return ''

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    const match = String(date).match(
      /^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/
    )

    if (match) {
      const monthNames = [
        'jan', 'feb', 'mar', 'apr', 'may', 'jun',
        'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
      ]

      const month = monthNames.indexOf(match[2].slice(0, 3).toLowerCase())

      if (month !== -1) {
        return `${match[3]}-${String(month + 1).padStart(2, '0')}-${String(
          match[1]
        ).padStart(2, '0')}`
      }
    }

    return ''
  }

  return [
    parsedDate.getFullYear(),
    String(parsedDate.getMonth() + 1).padStart(2, '0'),
    String(parsedDate.getDate()).padStart(2, '0')
  ].join('-')
}

const formatDate = (date) => {
  if (!date) return 'Not set'

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return date
  }

  return parsedDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

function Deals() {
  const [deals, setDeals] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [productFilter, setProductFilter] = useState('All')
  const [salesFilter, setSalesFilter] = useState('All')

  const [selectedDeal, setSelectedDeal] = useState(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [formData, setFormData] = useState(emptyForm)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pageError, setPageError] = useState('')
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  useEffect(() => {
    const fetchDeals = async () => {
      try {
        setLoading(true)
        setPageError('')

        const response = await api.get('/deals')

        const dealList = Array.isArray(response.data)
          ? response.data
          : response.data.deals || []

        setDeals(dealList.map(normalizeDeal))
      } catch (error) {
        setPageError(
          error.response?.data?.message ||
          'Unable to load deals. Please try again.'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchDeals()
  }, [])

  const filteredDeals = deals.filter((deal) => {
    const search = searchTerm.toLowerCase()

    const matchesSearch =
      deal.name.toLowerCase().includes(search) ||
      deal.customer.toLowerCase().includes(search) ||
      deal.product.toLowerCase().includes(search)

    const matchesStatus =
      statusFilter === 'All' || deal.status === statusFilter

    const matchesProduct =
      productFilter === 'All' || deal.product === productFilter

    const matchesSales =
      salesFilter === 'All' || deal.assignedTo === salesFilter

    return (
      matchesSearch &&
      matchesStatus &&
      matchesProduct &&
      matchesSales
    )
  })

  const totalValue = deals.reduce(
    (total, deal) => total + deal.value,
    0
  )

  const inProgress = deals.filter(
    (deal) => !['Won', 'Lost'].includes(deal.status)
  ).length

  const wonDeals = deals.filter(
    (deal) => deal.status === 'Won'
  ).length

  const products = [
    ...new Set(deals.map((deal) => deal.product).filter(Boolean))
  ]

  const salesUsers = [
    ...new Set(deals.map((deal) => deal.assignedTo).filter(Boolean))
  ]

  const openEditForm = () => {
    if (!selectedDeal) return

    setFormData({
      name: selectedDeal.name,
      customer: selectedDeal.customer,
      product: selectedDeal.product,
      value: String(selectedDeal.value),
      status: selectedDeal.status,
      assignedTo: selectedDeal.assignedTo,
      expectedClose: getDateInputValue(selectedDeal.expectedClose)
    })

    setFormError('')
    setSuccessMessage('')
    setShowEditForm(true)
  }

  const handleInputChange = (event) => {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }))
  }
  const handleSaveDeal = async (event) => {
    event.preventDefault()

    if (!selectedDeal?.id) {
      setFormError('Deal ID is missing. Unable to update this deal.')
      return
    }

    setFormError('')
    setSuccessMessage('')

    const payload = {
      name: formData.name.trim(),
      customer: formData.customer.trim(),
      product: formData.product.trim(),
      value: Number(formData.value),
      status: formData.status,
      assignedTo: formData.assignedTo.trim(),
      expectedClose: formData.expectedClose || null
    }

    if (
      !payload.name ||
      !payload.customer ||
      !payload.product ||
      !payload.assignedTo ||
      formData.value === '' ||
      !Number.isFinite(payload.value) ||
      payload.value < 0
    ) {
      setFormError('Please fill all required fields with valid values.')
      return
    }

    try {
      setSaving(true)

      const response = await api.patch(
        `/deals/${selectedDeal.id}`,
        payload
      )

      const responseDeal =
        response.data.deal || response.data.updatedDeal || response.data
      const updatedDeal = normalizeDeal({
        ...selectedDeal,
        ...payload,
        ...(responseDeal || {}),
        _id: responseDeal?._id || selectedDeal.id,
        id: responseDeal?._id || responseDeal?.id || selectedDeal.id,
        activities:
          responseDeal?.activities ?? selectedDeal.activities
      })

      setDeals((previous) =>
        previous.map((deal) =>
          deal.id === selectedDeal.id ? updatedDeal : deal
        )
      )

      setSelectedDeal(updatedDeal)
      setShowEditForm(false)
      setSuccessMessage('Deal updated successfully.')
    } catch (error) {
      setFormError(
        error.response?.data?.message ||
        'Unable to update deal. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="deals-page">
      <section className="deals-header">
        <div>
          <h1>Deals</h1>
          <p>Manage and monitor your sales opportunities.</p>
        </div>
      </section>

      {pageError && (
        <p className="deals-error" role="alert">
          {pageError}
        </p>
      )}

      {successMessage && (
        <p className="deals-success" role="status">
          {successMessage}
        </p>
      )}

      <section className="deals-summary">
        <div className="deal-summary-card">
          <span>Total Deals</span>
          <strong>{deals.length}</strong>
        </div>

        <div className="deal-summary-card">
          <span>In Progress</span>
          <strong>{inProgress}</strong>
        </div>

        <div className="deal-summary-card">
          <span>Won</span>
          <strong>{wonDeals}</strong>
        </div>

        <div className="deal-summary-card">
          <span>Total Value</span>
          <strong>₹{(totalValue / 100000).toFixed(1)}L</strong>
        </div>
      </section>

      <section className="deals-table-card">
        <div className="deals-toolbar">
          <div className="deal-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Search deals..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <div className="deal-filters">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="All">All Status</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <select
              value={productFilter}
              onChange={(event) => setProductFilter(event.target.value)}
            >
              <option value="All">All Products</option>
              {products.map((product) => (
                <option key={product} value={product}>
                  {product}
                </option>
              ))}
            </select>

            <select
              value={salesFilter}
              onChange={(event) => setSalesFilter(event.target.value)}
            >
              <option value="All">All Sales Users</option>
              {salesUsers.map((user) => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="deals-table-wrapper">
          <table className="deals-table">
            <thead>
              <tr>
                <th>DEAL NAME</th>
                <th>CUSTOMER</th>
                <th>PRODUCT / SERVICE</th>
                <th>VALUE</th>
                <th>STATUS</th>
                <th>ASSIGNED TO</th>
                <th>EXPECTED CLOSE</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7">Loading deals...</td>
                </tr>
              ) : (
                filteredDeals.map((deal) => (
                  <tr
                    key={deal.id}
                    onClick={() => {
                      setSelectedDeal(deal)
                      setSuccessMessage('')
                    }}
                  >
                    <td>
                      <div className="deal-name-cell">
                        <div className="deal-avatar">
                          {deal.name
                            .split(' ')
                            .map((word) => word[0])
                            .join('')
                            .slice(0, 2)}
                        </div>
                        <strong>{deal.name}</strong>
                      </div>
                    </td>

                    <td>{deal.customer}</td>
                    <td>{deal.product}</td>

                    <td className="deal-value">
                      ₹{deal.value.toLocaleString('en-IN')}
                    </td>

                    <td>
                      <span
                        className={`deal-status ${deal.status.toLowerCase()}`}
                      >
                        {deal.status}
                      </span>
                    </td>

                    <td>
                      <div className="assigned-user">
                        <div className="assigned-avatar">
                          {deal.assignedTo.charAt(0)}
                        </div>
                        <span>{deal.assignedTo}</span>
                      </div>
                    </td>

                    <td>{formatDate(deal.expectedClose)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredDeals.length === 0 && (
          <div className="no-deals">
            <h3>No deals found</h3>
            <p>Try changing your search or filters.</p>
          </div>
        )}
      </section>

      {selectedDeal && (
        <div
          className="deal-panel-overlay"
          onClick={() => setSelectedDeal(null)}
        >
          <aside
            className="deal-details-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="deal-panel-header">
              <div>
                <span>Deal Details</span>
                <h2>{selectedDeal.name}</h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDeal(null)}
                aria-label="Close deal details"
              >
                ×
              </button>
            </div>

            <div className="deal-panel-content">
              <div className="deal-detail-item">
                <span>Customer</span>
                <strong>{selectedDeal.customer}</strong>
              </div>

              <div className="deal-detail-item">
                <span>Product / Service</span>
                <strong>{selectedDeal.product}</strong>
              </div>

              <div className="deal-detail-item">
                <span>Deal Value</span>
                <strong>
                  ₹{selectedDeal.value.toLocaleString('en-IN')}
                </strong>
              </div>

              <div className="deal-detail-item">
                <span>Status</span>
                <span
                  className={`deal-status ${selectedDeal.status.toLowerCase()}`}
                >
                  {selectedDeal.status}
                </span>
              </div>

              <div className="deal-detail-item">
                <span>Assigned To</span>
                <strong>{selectedDeal.assignedTo}</strong>
              </div>

              <div className="deal-detail-item">
                <span>Expected Close</span>
                <strong>{formatDate(selectedDeal.expectedClose)}</strong>
              </div>

              <div className="activity-section">
                <h3>Recent Activity</h3>

                {selectedDeal.activities.length > 0 ? (
                  selectedDeal.activities.map((activity, index) => (
                    <div className="activity-item" key={index}>
                      <span className="activity-dot" />
                      <span>
                        {typeof activity === 'string'
                          ? activity
                          : activity.description ||
                            activity.message ||
                            activity.type ||
                            'Activity recorded'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p>No recent activity.</p>
                )}
              </div>

              <button
                type="button"
                className="edit-deal-button"
                onClick={openEditForm}
              >
                Edit Deal
              </button>
            </div>
          </aside>
        </div>
      )}

      {showEditForm && (
        <div
          className="edit-deal-modal-overlay"
          onClick={() => !saving && setShowEditForm(false)}
        >
          <form
            className="edit-deal-modal"
            onSubmit={handleSaveDeal}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="edit-deal-modal-header">
              <div>
                <h2>Edit Deal</h2>
                <p>Update the details of this deal.</p>
              </div>

              <button
                type="button"
                onClick={() => setShowEditForm(false)}
                disabled={saving}
                aria-label="Close edit form"
              >
                ×
              </button>
            </div>

            <label htmlFor="deal-name">Deal Name *</label>
            <input
              id="deal-name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />

            <label htmlFor="deal-customer">Customer *</label>
            <input
              id="deal-customer"
              name="customer"
              value={formData.customer}
              onChange={handleInputChange}
              required
            />

            <label htmlFor="deal-product">Product / Service *</label>
            <input
              id="deal-product"
              name="product"
              value={formData.product}
              onChange={handleInputChange}
              required
            />

            <label htmlFor="deal-value">Deal Value (₹) *</label>
            <input
              id="deal-value"
              name="value"
              type="number"
              min="0"
              step="0.01"
              value={formData.value}
              onChange={handleInputChange}
              required
            />

            <label htmlFor="deal-status">Status *</label>
            <select
              id="deal-status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              required
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <label htmlFor="deal-assigned-to">Assigned To *</label>
            <input
              id="deal-assigned-to"
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleInputChange}
              required
            />

            <label htmlFor="deal-expected-close">Expected Close</label>
            <input
              id="deal-expected-close"
              name="expectedClose"
              type="date"
              value={formData.expectedClose}
              onChange={handleInputChange}
            />

            {formError && (
              <p className="deals-error" role="alert">
                {formError}
              </p>
            )}

            <div className="edit-deal-form-actions">
              <button
                type="button"
                onClick={() => setShowEditForm(false)}
                disabled={saving}
              >
                Cancel
              </button>

              <button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  )
}

export default Deals
