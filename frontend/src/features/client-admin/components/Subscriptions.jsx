import { useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Search,
  Check,
  X,
  Repeat,
  IndianRupee,
  CalendarClock,
  Ban,
  Pencil,
  Power,
  Eye,
  RefreshCw
} from 'lucide-react'
import './Subscriptions.css'

const PRODUCTS = [
  { id: 'p1', name: 'CRM Software', code: 'DH-PRD-001' },
  { id: 'p2', name: 'Invoice & Billing Software', code: 'DH-PRD-002' },
  { id: 'p3', name: 'Website Maintenance', code: 'DH-SER-004' },
  { id: 'p4', name: 'SEO & Digital Marketing', code: 'DH-SER-005' }
]


const CUSTOMERS = [
  { id: 'c1', name: 'Krishnaji S', email: 'krishna@gmail.com' },
  { id: 'c2', name: 'Geethavarshini R', email: 'geethu@gmail.com' },
  { id: 'c3', name: 'Joshua Jenisus R', email: 'jenisusjr07@gmail.com' },
  { id: 'c4', name: 'Mounika M', email: 'mouni@gmail.com' },
  { id: 'c5', name: 'ArunBalaji', email: 'arun@gmail.com' },
  { id: 'c6', name: 'Jeya Kartika G', email: 'jeykagovinda@gmail.com' }
]

const SEED_PLANS = [
  {
    id: 'pl1',
    productId: 'p1',
    name: 'Basic',
    price: 999,
    cycle: 'monthly',
    features: ['1 user', '100 leads', 'Email support'],
    trialDays: 7,
    status: 'active',
    popular: false
  },
  {
    id: 'pl2',
    productId: 'p1',
    name: 'Pro',
    price: 2999,
    cycle: 'monthly',
    features: ['5 users', 'Unlimited leads', 'Reports and export', 'Priority support'],
    trialDays: 7,
    status: 'active',
    popular: true
  },
  {
    id: 'pl3',
    productId: 'p1',
    name: 'Enterprise',
    price: 9999,
    cycle: 'monthly',
    features: ['Unlimited users', 'Dedicated manager', 'Custom integrations'],
    trialDays: 0,
    status: 'active',
    popular: false
  },
  {
    id: 'pl4',
    productId: 'p3',
    name: 'Standard',
    price: 3000,
    cycle: 'monthly',
    features: ['Weekly backups', 'Security updates', 'Bug fixes'],
    trialDays: 0,
    status: 'active',
    popular: false
  },
  {
    id: 'pl5',
    productId: 'p2',
    name: 'Annual Starter',
    price: 49999,
    cycle: 'yearly',
    features: ['Unlimited invoices', 'GST reports', 'Payment tracking'],
    trialDays: 14,
    status: 'active',
    popular: false
  },
  {
    id: 'pl6',
    productId: 'p4',
    name: 'Growth',
    price: 15000,
    cycle: 'monthly',
    features: ['10 keywords', 'Monthly report', 'On-page fixes'],
    trialDays: 0,
    status: 'inactive',
    popular: false
  }
]

const CYCLES = {
  monthly: { label: 'Monthly', suffix: 'monthly', months: 1 },
  quarterly: { label: 'Quarterly', suffix: 'quarterly', months: 3 },
  yearly: { label: 'Yearly', suffix: 'yearly', months: 12 }
}

const STATUS_LABEL = {
  active: 'Active',
  trial: 'Trial',
  expiring: 'Expiring',
  expired: 'Expired',
  cancelled: 'Cancelled',
  inactive: 'Inactive'
}

const EMPTY_PLAN = {
  productId: '',
  name: '',
  price: '',
  cycle: 'monthly',
  features: '',
  trialDays: '',
  status: 'active',
  popular: false
}

const pad = (n) => String(n).padStart(2, '0')

const toISO = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

const parseISO = (iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const today = () => toISO(new Date())

const addDays = (iso, days) => {
  const date = parseISO(iso)
  date.setDate(date.getDate() + days)
  return toISO(date)
}

const addMonths = (iso, months) => {
  const date = parseISO(iso)
  const day = date.getDate()
  date.setMonth(date.getMonth() + months)
  if (date.getDate() !== day) date.setDate(0)
  return toISO(date)
}

const daysBetween = (fromISO, toISOValue) =>
  Math.round((parseISO(toISOValue) - parseISO(fromISO)) / 86400000)

const formatDate = (iso) =>
  parseISO(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })

const formatPrice = (value) => `₹${Number(value).toLocaleString('en-IN')}`

const getInitials = (name) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

const computeRenewal = (startISO, plan, status) => {
  if (status === 'trial') return addDays(startISO, plan.trialDays || 7)
  return addMonths(startISO, CYCLES[plan.cycle].months)
}

const getStatus = (sub) => {
  if (sub.status === 'cancelled') return 'cancelled'
  const daysLeft = daysBetween(today(), sub.nextRenewal)
  if (daysLeft < 0) return 'expired'
  if (sub.status === 'trial') return 'trial'
  if (daysLeft <= 7) return 'expiring'
  return 'active'
}

const monthlyValue = (sub) => sub.amount / CYCLES[sub.cycle].months

const buildSeedSubs = () => {
  const from = (days) => addDays(today(), days)

  return [
    { id: 's1', customerId: 'c1', planId: 'pl2', amount: 2999, cycle: 'monthly', startDate: from(-25), nextRenewal: from(5), status: 'active' },
    { id: 's2', customerId: 'c2', planId: 'pl3', amount: 9999, cycle: 'monthly', startDate: from(-10), nextRenewal: from(20), status: 'active' },
    { id: 's3', customerId: 'c3', planId: 'pl1', amount: 999, cycle: 'monthly', startDate: from(-4), nextRenewal: from(3), status: 'trial' },
    { id: 's4', customerId: 'c4', planId: 'pl1', amount: 999, cycle: 'monthly', startDate: from(-18), nextRenewal: from(12), status: 'active' },
    { id: 's5', customerId: 'c5', planId: 'pl4', amount: 3000, cycle: 'monthly', startDate: from(-12), nextRenewal: from(18), status: 'active' },
    { id: 's6', customerId: 'c6', planId: 'pl2', amount: 2999, cycle: 'monthly', startDate: from(-40), nextRenewal: from(-10), status: 'cancelled' },
    { id: 's7', customerId: 'c2', planId: 'pl5', amount: 49999, cycle: 'yearly', startDate: from(-368), nextRenewal: from(-3), status: 'active' }
  ]
}

function StatusPill({ status }) {
  return <span className={`sp-pill ${status}`}>{STATUS_LABEL[status]}</span>
}

function Modal({ title, onClose, children, footer }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="sp-overlay" onMouseDown={onClose}>
      <div
        className="sp-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sp-modal-header">
          <h2>{title}</h2>
          <button
            type="button"
            className="sp-icon-btn"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="sp-modal-body">{children}</div>

        {footer && <div className="sp-modal-footer">{footer}</div>}
      </div>
    </div>
  )
}
function PlanModal({ initial, isEdit, onSave, onClose }) {
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState({})

  const setField = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }))

  const handleSubmit = (event) => {
    event.preventDefault()

    const nextErrors = {}
    if (!form.productId) nextErrors.productId = 'Choose a product.'
    if (!form.name.trim()) nextErrors.name = 'Enter a plan name.'
    if (!(Number(form.price) > 0)) nextErrors.price = 'Enter a price above 0.'
    if (form.trialDays !== '' && Number(form.trialDays) < 0) {
      nextErrors.trialDays = 'Trial days cannot be negative.'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    onSave({
      ...form,
      name: form.name.trim(),
      price: Number(form.price),
      trialDays: Number(form.trialDays) || 0,
      features: form.features
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
    })
  }

  return (
    <Modal
      title={isEdit ? 'Edit plan' : 'Add plan'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="sp-btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="sp-plan-form" className="sp-btn primary">
            {isEdit ? 'Save changes' : 'Add plan'}
          </button>
        </>
      }
    >
      <form id="sp-plan-form" className="sp-form" onSubmit={handleSubmit} noValidate>
        <label className="sp-field full">
          <span>Product *</span>
          <select
            value={form.productId}
            onChange={(e) => setField('productId', e.target.value)}
          >
            <option value="">Select a product</option>
            {PRODUCTS.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.code})
              </option>
            ))}
          </select>
          {errors.productId && <small className="sp-error">{errors.productId}</small>}
        </label>

        <label className="sp-field full">
          <span>Plan name *</span>
          <input
            type="text"
            placeholder="Example: Pro"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
          />
          {errors.name && <small className="sp-error">{errors.name}</small>}
        </label>

        <label className="sp-field">
          <span>Price (₹) *</span>
          <input
            type="number"
            min="0"
            placeholder="2999"
            value={form.price}
            onChange={(e) => setField('price', e.target.value)}
          />
          {errors.price && <small className="sp-error">{errors.price}</small>}
        </label>

        <label className="sp-field">
          <span>Billing cycle</span>
          <select
            value={form.cycle}
            onChange={(e) => setField('cycle', e.target.value)}
          >
            {Object.entries(CYCLES).map(([key, cycle]) => (
              <option key={key} value={key}>
                {cycle.label}
              </option>
            ))}
          </select>
        </label>

        <label className="sp-field full">
          <span>Features (one per line)</span>
          <textarea
            rows="4"
            placeholder={'5 users\nUnlimited leads\nPriority support'}
            value={form.features}
            onChange={(e) => setField('features', e.target.value)}
          />
        </label>

        <label className="sp-field">
          <span>Trial days (optional)</span>
          <input
            type="number"
            min="0"
            placeholder="0"
            value={form.trialDays}
            onChange={(e) => setField('trialDays', e.target.value)}
          />
          {errors.trialDays && <small className="sp-error">{errors.trialDays}</small>}
        </label>

        <label className="sp-field">
          <span>Status</span>
          <select
            value={form.status}
            onChange={(e) => setField('status', e.target.value)}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>

        <label className="sp-check full">
          <input
            type="checkbox"
            checked={form.popular}
            onChange={(e) => setField('popular', e.target.checked)}
          />
          <span>Show a "Most popular" badge on this plan</span>
        </label>
      </form>
    </Modal>
  )
}

function SubscriptionModal({ plans, onSave, onClose }) {
  const [form, setForm] = useState({
    customerId: '',
    planId: '',
    startDate: today(),
    status: 'active'
  })
  const [errors, setErrors] = useState({})

  const setField = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }))

  const selectedPlan = plans.find((plan) => plan.id === form.planId)
  const productName = (id) => PRODUCTS.find((p) => p.id === id)?.name || ''

  const renewalPreview =
    selectedPlan && form.startDate
      ? computeRenewal(form.startDate, selectedPlan, form.status)
      : ''

  const handleSubmit = (event) => {
    event.preventDefault()

    const nextErrors = {}
    if (!form.customerId) nextErrors.customerId = 'Choose a customer.'
    if (!form.planId) nextErrors.planId = 'Choose a plan.'
    if (!form.startDate) nextErrors.startDate = 'Pick a start date.'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    onSave({
      customerId: form.customerId,
      planId: selectedPlan.id,
      amount: selectedPlan.price,
      cycle: selectedPlan.cycle,
      startDate: form.startDate,
      nextRenewal: renewalPreview,
      status: form.status
    })
  }

  return (
    <Modal
      title="Add subscription"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="sp-btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="sp-sub-form" className="sp-btn primary">
            Add subscription
          </button>
        </>
      }
    >
      <form id="sp-sub-form" className="sp-form" onSubmit={handleSubmit} noValidate>
        <label className="sp-field full">
          <span>Customer *</span>
          <select
            value={form.customerId}
            onChange={(e) => setField('customerId', e.target.value)}
          >
            <option value="">Select a customer</option>
            {CUSTOMERS.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
          {errors.customerId && <small className="sp-error">{errors.customerId}</small>}
        </label>

        <label className="sp-field full">
          <span>Plan *</span>
          <select
            value={form.planId}
            onChange={(e) => setField('planId', e.target.value)}
          >
            <option value="">Select a plan</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {productName(plan.productId)} - {plan.name} ({formatPrice(plan.price)} /{' '}
                {CYCLES[plan.cycle].suffix})
              </option>
            ))}
          </select>
          {errors.planId && <small className="sp-error">{errors.planId}</small>}
        </label>

        <label className="sp-field">
          <span>Start date *</span>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => setField('startDate', e.target.value)}
          />
          {errors.startDate && <small className="sp-error">{errors.startDate}</small>}
        </label>

        <label className="sp-field">
          <span>Status</span>
          <select
            value={form.status}
            onChange={(e) => setField('status', e.target.value)}
          >
            <option value="active">Active</option>
            <option value="trial">Trial</option>
          </select>
        </label>

        <div className="sp-summary-box full">
          <div>
            <span>Amount</span>
            <strong>{selectedPlan ? formatPrice(selectedPlan.price) : '-'}</strong>
          </div>
          <div>
            <span>Next renewal</span>
            <strong>{renewalPreview ? formatDate(renewalPreview) : '-'}</strong>
          </div>
        </div>
      </form>
    </Modal>
  )
}

function ViewSubscriptionModal({ sub, onClose }) {
  const customer = CUSTOMERS.find((c) => c.id === sub.customerId)
  const product = PRODUCTS.find((p) => p.id === sub.plan?.productId)

  return (
    <Modal
      title="Subscription details"
      onClose={onClose}
      footer={
        <button type="button" className="sp-btn primary" onClick={onClose}>
          Close
        </button>
      }
    >
      <dl className="sp-details">
        <div>
          <dt>Customer</dt>
          <dd>{customer?.name}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{customer?.email}</dd>
        </div>
        <div>
          <dt>Product</dt>
          <dd>{product?.name}</dd>
        </div>
        <div>
          <dt>Plan</dt>
          <dd>{sub.plan?.name}</dd>
        </div>
        <div>
          <dt>Amount</dt>
          <dd>
            {formatPrice(sub.amount)} / {CYCLES[sub.cycle].suffix}
          </dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            <StatusPill status={sub.displayStatus} />
          </dd>
        </div>
        <div>
          <dt>Start date</dt>
          <dd>{formatDate(sub.startDate)}</dd>
        </div>
        <div>
          <dt>Next renewal</dt>
          <dd>{formatDate(sub.nextRenewal)}</dd>
        </div>
      </dl>

      {sub.plan?.features?.length > 0 && (
        <>
          <h3 className="sp-details-title">Included in this plan</h3>
          <ul className="sp-features">
            {sub.plan.features.map((feature) => (
              <li key={feature}>
                <Check size={14} />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Modal>
  )
}


function Subscriptions() {
  const [tab, setTab] = useState('plans')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [plans, setPlans] = useState(SEED_PLANS)
  const [subs, setSubs] = useState(buildSeedSubs)
  const [planModal, setPlanModal] = useState(null) // { id, form }
  const [subModalOpen, setSubModalOpen] = useState(false)
  const [viewSub, setViewSub] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(''), 2500)
    return () => clearTimeout(timer)
  }, [toast])

  const productName = (id) => PRODUCTS.find((p) => p.id === id)?.name || 'Unknown product'

  const subRows = useMemo(
    () =>
      subs.map((sub) => ({
        ...sub,
        plan: plans.find((plan) => plan.id === sub.planId),
        displayStatus: getStatus(sub)
      })),
    [subs, plans]
  )

  const stats = useMemo(() => {
    const live = subRows.filter((s) => ['active', 'expiring'].includes(s.displayStatus))

    return {
      active: live.length,
      mrr: Math.round(live.reduce((total, s) => total + monthlyValue(s), 0)),
      expiring: subRows.filter((s) => s.displayStatus === 'expiring').length,
      cancelled: subRows.filter((s) => s.displayStatus === 'cancelled').length
    }
  }, [subRows])

  const query = search.trim().toLowerCase()

  const visiblePlans = plans.filter((plan) => {
    const matchesStatus = statusFilter === 'all' || plan.status === statusFilter
    const matchesSearch =
      !query || `${plan.name} ${productName(plan.productId)}`.toLowerCase().includes(query)
    return matchesStatus && matchesSearch
  })

  const visibleSubs = subRows.filter((sub) => {
    const customer = CUSTOMERS.find((c) => c.id === sub.customerId)
    const matchesStatus = statusFilter === 'all' || sub.displayStatus === statusFilter
    const matchesSearch =
      !query ||
      `${customer?.name} ${sub.plan?.name} ${productName(sub.plan?.productId)}`
        .toLowerCase()
        .includes(query)
    return matchesStatus && matchesSearch
  })

  const switchTab = (next) => {
    setTab(next)
    setStatusFilter('all')
    setSearch('')
  }


  const openAddPlan = () => setPlanModal({ id: null, form: EMPTY_PLAN })

  const openEditPlan = (plan) =>
    setPlanModal({
      id: plan.id,
      form: {
        productId: plan.productId,
        name: plan.name,
        price: String(plan.price),
        cycle: plan.cycle,
        features: plan.features.join('\n'),
        trialDays: plan.trialDays ? String(plan.trialDays) : '',
        status: plan.status,
        popular: plan.popular
      }
    })

  const savePlan = (data) => {
    const editingId = planModal.id

    setPlans((current) => {
      // Only one "Most popular" plan per product.
      const cleared = data.popular
        ? current.map((p) =>
            p.productId === data.productId ? { ...p, popular: false } : p
          )
        : current

      if (editingId) {
        return cleared.map((p) => (p.id === editingId ? { ...p, ...data } : p))
      }

      return [...cleared, { ...data, id: `pl${Date.now()}` }]
    })

    setPlanModal(null)
    setToast(editingId ? 'Plan updated' : 'Plan added')
  }

  const togglePlan = (plan) => {
    const next = plan.status === 'active' ? 'inactive' : 'active'
    setPlans((current) =>
      current.map((p) => (p.id === plan.id ? { ...p, status: next } : p))
    )
    setToast(next === 'active' ? 'Plan activated' : 'Plan deactivated')
  }



  const saveSubscription = (data) => {
    setSubs((current) => [{ ...data, id: `s${Date.now()}` }, ...current])
    setSubModalOpen(false)
    setTab('subscriptions')
    setStatusFilter('all')
    setSearch('')
    setToast('Subscription added')
  }

  const renewSubscription = (sub) => {
    const base = daysBetween(today(), sub.nextRenewal) > 0 ? sub.nextRenewal : today()

    setSubs((current) =>
      current.map((s) =>
        s.id === sub.id
          ? { ...s, status: 'active', nextRenewal: addMonths(base, CYCLES[s.cycle].months) }
          : s
      )
    )
    setToast('Subscription renewed')
  }

  const cancelSubscription = (sub) => {
    const customer = CUSTOMERS.find((c) => c.id === sub.customerId)
    if (!window.confirm(`Cancel ${customer?.name}'s subscription?`)) return

    setSubs((current) =>
      current.map((s) => (s.id === sub.id ? { ...s, status: 'cancelled' } : s))
    )
    setToast('Subscription cancelled')
  }

  const subscriberCount = (planId) =>
    subRows.filter(
      (s) => s.planId === planId && ['active', 'expiring', 'trial'].includes(s.displayStatus)
    ).length

  const statusOptions =
    tab === 'plans'
      ? ['all', 'active', 'inactive']
      : ['all', 'active', 'trial', 'expiring', 'expired', 'cancelled']

  return (
    <div className="sp-page">
      <div className="sp-header">
        <div>
          <h1>Subscriptions &amp; Plans</h1>
          <p>Set up recurring plans and track what your customers pay for.</p>
        </div>

        <div className="sp-header-actions">
          <button type="button" className="sp-btn light" onClick={openAddPlan}>
            <Plus size={16} />
            Add plan
          </button>
          <button
            type="button"
            className="sp-btn primary"
            onClick={() => setSubModalOpen(true)}
          >
            <Plus size={16} />
            Add subscription
          </button>
        </div>
      </div>

      <div className="sp-stats">
        <div className="sp-stat dark">
          <div className="sp-stat-icon">
            <IndianRupee size={16} />
          </div>
          <p>Monthly recurring revenue</p>
          <strong>{formatPrice(stats.mrr)}</strong>
        </div>

        <div className="sp-stat">
          <div className="sp-stat-icon">
            <Repeat size={16} />
          </div>
          <p>Active subscriptions</p>
          <strong>{stats.active}</strong>
        </div>

        <div className="sp-stat">
          <div className="sp-stat-icon">
            <CalendarClock size={16} />
          </div>
          <p>Renewing in 7 days</p>
          <strong>{stats.expiring}</strong>
        </div>

        <div className="sp-stat">
          <div className="sp-stat-icon">
            <Ban size={16} />
          </div>
          <p>Cancelled</p>
          <strong>{stats.cancelled}</strong>
        </div>
      </div>

      <div className="sp-panel">
        <div className="sp-toolbar">
          <div className="sp-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'plans'}
              className={tab === 'plans' ? 'active' : ''}
              onClick={() => switchTab('plans')}
            >
              Plans
              <span>{plans.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'subscriptions'}
              className={tab === 'subscriptions' ? 'active' : ''}
              onClick={() => switchTab('subscriptions')}
            >
              Subscriptions
              <span>{subs.length}</span>
            </button>
          </div>

          <div className="sp-filters">
            <div className="sp-search">
              <Search size={16} />
              <input
                type="text"
                placeholder={
                  tab === 'plans' ? 'Search plans or products...' : 'Search customers or plans...'
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search"
              />
            </div>

            <select
              className="sp-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'all' ? 'All statuses' : STATUS_LABEL[option]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="sp-content">
          {tab === 'plans' && (
            <>
              {visiblePlans.length === 0 ? (
                <div className="sp-empty">
                  <p>No plans match your search.</p>
                  <button type="button" className="sp-btn primary" onClick={openAddPlan}>
                    <Plus size={16} />
                    Add plan
                  </button>
                </div>
              ) : (
                <div className="sp-plan-grid">
                  {visiblePlans.map((plan) => (
                    <article
                      key={plan.id}
                      className={`sp-plan-card ${plan.status === 'inactive' ? 'is-inactive' : ''}`}
                    >
                      <div className="sp-plan-top">
                        <span className="sp-product-tag">{productName(plan.productId)}</span>
                        <StatusPill status={plan.status} />
                      </div>

                      <div className="sp-plan-title">
                        <h3>{plan.name}</h3>
                        {plan.popular && <span className="sp-popular">Most popular</span>}
                      </div>

                      <p className="sp-price">
                        <strong>{formatPrice(plan.price)}</strong>
                        <span>/ {CYCLES[plan.cycle].suffix}</span>
                      </p>

                      <ul className="sp-features">
                        {plan.features.map((feature) => (
                          <li key={feature}>
                            <Check size={14} />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="sp-plan-foot">
                        <span className="sp-subscribers">
                          {subscriberCount(plan.id)} subscribers
                          {plan.trialDays > 0 ? `, ${plan.trialDays}-day trial` : ''}
                        </span>

                        <div className="sp-row-actions">
                          <button
                            type="button"
                            className="sp-btn small"
                            onClick={() => openEditPlan(plan)}
                          >
                            <Pencil size={13} />
                            Edit
                          </button>
                          <button
                            type="button"
                            className="sp-btn small"
                            onClick={() => togglePlan(plan)}
                          >
                            <Power size={13} />
                            {plan.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'subscriptions' && (
            <>
              {visibleSubs.length === 0 ? (
                <div className="sp-empty">
                  <p>No subscriptions match your search.</p>
                  <button
                    type="button"
                    className="sp-btn primary"
                    onClick={() => setSubModalOpen(true)}
                  >
                    <Plus size={16} />
                    Add subscription
                  </button>
                </div>
              ) : (
                <div className="sp-table-wrap">
                  <table className="sp-table">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Plan</th>
                        <th>Product</th>
                        <th>Amount</th>
                        <th>Next renewal</th>
                        <th>Status</th>
                        <th className="right">Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {visibleSubs.map((sub) => {
                        const customer = CUSTOMERS.find((c) => c.id === sub.customerId)
                        const canRenew = ['expiring', 'expired', 'cancelled'].includes(
                          sub.displayStatus
                        )
                        const canCancel = sub.displayStatus !== 'cancelled'

                        return (
                          <tr key={sub.id}>
                            <td>
                              <div className="sp-customer">
                                <span className="sp-avatar">{getInitials(customer?.name || '?')}</span>
                                <div>
                                  <strong>{customer?.name}</strong>
                                  <small>{customer?.email}</small>
                                </div>
                              </div>
                            </td>
                            <td>{sub.plan?.name}</td>
                            <td>{productName(sub.plan?.productId)}</td>
                            <td>
                              <strong>{formatPrice(sub.amount)}</strong>
                              <small className="sp-cycle"> / {CYCLES[sub.cycle].suffix}</small>
                            </td>
                            <td>{formatDate(sub.nextRenewal)}</td>
                            <td>
                              <StatusPill status={sub.displayStatus} />
                            </td>
                            <td>
                              <div className="sp-row-actions right">
                                <button
                                  type="button"
                                  className="sp-btn small"
                                  onClick={() => setViewSub(sub)}
                                >
                                  <Eye size={13} />
                                  View
                                </button>
                                {canRenew && (
                                  <button
                                    type="button"
                                    className="sp-btn small"
                                    onClick={() => renewSubscription(sub)}
                                  >
                                    <RefreshCw size={13} />
                                    Renew
                                  </button>
                                )}
                                {canCancel && (
                                  <button
                                    type="button"
                                    className="sp-btn small danger"
                                    onClick={() => cancelSubscription(sub)}
                                  >
                                    <Ban size={13} />
                                    Cancel
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {planModal && (
        <PlanModal
          initial={planModal.form}
          isEdit={Boolean(planModal.id)}
          onSave={savePlan}
          onClose={() => setPlanModal(null)}
        />
      )}

      {subModalOpen && (
        <SubscriptionModal
          plans={plans.filter((plan) => plan.status === 'active')}
          onSave={saveSubscription}
          onClose={() => setSubModalOpen(false)}
        />
      )}

      {viewSub && (
        <ViewSubscriptionModal sub={viewSub} onClose={() => setViewSub(null)} />
      )}

      {toast && (
        <div className="sp-toast" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}

export default Subscriptions
