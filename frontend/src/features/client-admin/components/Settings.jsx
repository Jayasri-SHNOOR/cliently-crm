import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import './Settings.css'

const EMPTY_COMPANY = {
  companyName: '',
  email: '',
  phone: '',
  website: '',
  industry: '',
  address: ''
}

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || fallback

const getUserId = (user) => user._id || user.id

const getUserStatus = (user) => {
  if (typeof user.isActive === 'boolean') {
    return user.isActive ? 'Active' : 'Inactive'
  }
  return String(user.status || 'Inactive').toLowerCase() === 'active'
    ? 'Active'
    : 'Inactive'
}

const formatDate = (value) => {
  if (!value) return 'Not available'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not available'
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const formatMoney = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(Number(amount || 0))

function Settings({ initialSection = 'company' }) {
  const [activeSection, setActiveSection] = useState(initialSection)

  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: ''
  })
  const [shownSection, setShownSection] = useState(initialSection)
  if (shownSection !== initialSection) {
    setShownSection(initialSection)
    setActiveSection(initialSection)
  }
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')

  const [companyForm, setCompanyForm] = useState(EMPTY_COMPANY)
  const [companyLoading, setCompanyLoading] = useState(false)
  const [companySaving, setCompanySaving] = useState(false)
  const [companyError, setCompanyError] = useState('')
  const [companySuccess, setCompanySuccess] = useState('')

  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState('')
  const [updatingUserId, setUpdatingUserId] = useState(null)
  const [userSummary, setUserSummary] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0
  })

  const [billing, setBilling] = useState(null)
  const [billingLoading, setBillingLoading] = useState(false)
  const [billingError, setBillingError] = useState('')
  const [billingSuccess, setBillingSuccess] = useState('')

  const [plans, setPlans] = useState([])
  const [showPlans, setShowPlans] = useState(false)

  const [editingPayment, setEditingPayment] = useState(false)
  const [upiId, setUpiId] = useState('')
  const [savingPayment, setSavingPayment] = useState(false)

  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [invoiceLoading, setInvoiceLoading] = useState(false)
  const [invoiceError, setInvoiceError] = useState('')

  const fetchProfile = useCallback(async () => {
    try {
      setProfileLoading(true)
      setProfileError('')

      const response = await api.get('/me')
      const user = response.data.user ?? response.data

      setProfileForm({
        name: user.name ?? user.adminName ?? '',
        email: user.email ?? user.adminEmail ?? '',
        phone: user.phone ?? user.contactPhone ?? '',
        role: user.role ?? 'Client Admin'
      })
    } catch (error) {
      setProfileError(
        getErrorMessage(error, 'Failed to load profile details.')
      )
    } finally {
      setProfileLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeSection !== 'profile') return undefined
    const timer = setTimeout(fetchProfile, 0)
    return () => clearTimeout(timer)
  }, [activeSection, fetchProfile])

  const handleProfileChange = (event) => {
    const { name, value } = event.target

    setProfileForm((previous) => ({
      ...previous,
      [name]: value
    }))

    setProfileError('')
    setProfileSuccess('')
  }

  const handleSaveProfile = async () => {
    try {
      setProfileSaving(true)
      setProfileError('')
      setProfileSuccess('')

      const response = await api.patch('/me', {
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone
      })

      const user = response.data.user ?? response.data

      setProfileForm((previous) => ({
        ...previous,
        name: user.name ?? previous.name,
        email: user.email ?? previous.email,
        phone: user.phone ?? previous.phone,
        role: user.role ?? previous.role
      }))

      setProfileSuccess('Profile updated successfully.')
    } catch (error) {
      setProfileError(
        getErrorMessage(error, 'Failed to save profile details.')
      )
    } finally {
      setProfileSaving(false)
    }
  }

  const fetchCompany = useCallback(async () => {
    try {
      setCompanyLoading(true)
      setCompanyError('')

      const response = await api.get('/settings/company')
      const company = response.data.company ?? response.data

      setCompanyForm({
        companyName: company.companyName ?? '',
        email: company.email ?? '',
        phone: company.phone ?? '',
        website: company.website ?? '',
        industry: company.industry ?? '',
        address: company.address ?? ''
      })
    } catch (error) {
      setCompanyError(
        getErrorMessage(error, 'Failed to load company details.')
      )
    } finally {
      setCompanyLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(fetchCompany, 0)
    return () => clearTimeout(timer)
  }, [fetchCompany])

  const handleCompanyChange = (event) => {
    const { name, value } = event.target

    setCompanyForm((previous) => ({
      ...previous,
      [name]: value
    }))

    setCompanyError('')
    setCompanySuccess('')
  }

  const handleSaveCompany = async () => {
    try {
      setCompanySaving(true)
      setCompanyError('')
      setCompanySuccess('')

      const response = await api.patch(
        '/settings/company',
        companyForm
      )

      const company = response.data.company ?? response.data

      setCompanyForm({
        companyName: company.companyName ?? '',
        email: company.email ?? '',
        phone: company.phone ?? '',
        website: company.website ?? '',
        industry: company.industry ?? '',
        address: company.address ?? ''
      })

      setCompanySuccess('Company details saved successfully.')
    } catch (error) {
      setCompanyError(
        getErrorMessage(error, 'Failed to save company details.')
      )
    } finally {
      setCompanySaving(false)
    }
  }

  const fetchUsers = useCallback(async () => {
    try {
      setUsersLoading(true)
      setUsersError('')

      const [usersResponse, rolesResponse] = await Promise.all([
        api.get('/settings/users'),
        api.get('/settings/roles')
      ])

      const fetchedUsers = Array.isArray(usersResponse.data)
        ? usersResponse.data
        : usersResponse.data.users || []

      const fetchedRoles = Array.isArray(rolesResponse.data)
        ? rolesResponse.data
        : rolesResponse.data.roles || []

      setUsers(fetchedUsers)

      setRoles(
        fetchedRoles
          .map((role) =>
            typeof role === 'string'
              ? role
              : role.name || role.role
          )
          .filter(Boolean)
      )

      const activeCount = fetchedUsers.filter(
        (user) => getUserStatus(user) === 'Active'
      ).length

      setUserSummary({
        totalUsers:
          usersResponse.data.summary?.totalUsers ??
          fetchedUsers.length,
        activeUsers:
          usersResponse.data.summary?.activeUsers ??
          activeCount,
        inactiveUsers:
          usersResponse.data.summary?.inactiveUsers ??
          fetchedUsers.length - activeCount
      })
    } catch (error) {
      setUsersError(
        getErrorMessage(error, 'Failed to load users and roles.')
      )
    } finally {
      setUsersLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeSection !== 'users') return undefined
    const timer = setTimeout(fetchUsers, 0)
    return () => clearTimeout(timer)
  }, [activeSection, fetchUsers])

  const handleToggleUserStatus = async (user) => {
    const userId = getUserId(user)
    const currentStatus = getUserStatus(user)

    try {
      setUpdatingUserId(userId)
      setUsersError('')

      if (currentStatus === 'Active') {
        await api.post(`/settings/users/${userId}/deactivate`)
      } else {
        await api.post(`/settings/users/${userId}/activate`)
      }

      await fetchUsers()
    } catch (error) {
      setUsersError(
        getErrorMessage(error, 'Failed to update user status.')
      )
    } finally {
      setUpdatingUserId(null)
    }
  }

  const handleRoleChange = async (user, newRole) => {
    const userId = getUserId(user)

    if (!newRole || newRole === user.role) return

    try {
      setUpdatingUserId(userId)
      setUsersError('')

      await api.patch(`/settings/users/${userId}/role`, {
        role: newRole
      })

      await fetchUsers()
    } catch (error) {
      setUsersError(
        getErrorMessage(error, 'Failed to update user role.')
      )
    } finally {
      setUpdatingUserId(null)
    }
  }

  const fetchBilling = useCallback(async () => {
    try {
      setBillingLoading(true)
      setBillingError('')
      setBillingSuccess('')

      const response = await api.get('/settings/billing')
      const data = response.data

      setBilling(data)
      setUpiId(data.paymentMethod?.upiId || '')
    } catch (error) {
      setBillingError(
        getErrorMessage(error, 'Failed to load billing information.')
      )
    } finally {
      setBillingLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeSection !== 'billing') return undefined
    const timer = setTimeout(fetchBilling, 0)
    return () => clearTimeout(timer)
  }, [activeSection, fetchBilling])

  const fetchPlans = async () => {
    try {
      setBillingError('')

      const response = await api.get('/settings/billing/plans')
      const data = response.data

      setPlans(Array.isArray(data) ? data : data.plans || [])
      setShowPlans(true)
    } catch (error) {
      setBillingError(
        getErrorMessage(error, 'Failed to load available plans.')
      )
    }
  }

  const handleSavePayment = async () => {
    try {
      setSavingPayment(true)
      setBillingError('')
      setBillingSuccess('')

      const response = await api.patch(
        '/settings/billing/payment-method',
        { upiId }
      )

      const paymentMethod = response.data.paymentMethod

      setBilling((previous) => ({
        ...previous,
        paymentMethod
      }))

      setUpiId(paymentMethod?.upiId || '')
      setEditingPayment(false)
      setBillingSuccess('Payment method updated successfully.')
    } catch (error) {
      setBillingError(
        getErrorMessage(error, 'Failed to update payment method.')
      )
    } finally {
      setSavingPayment(false)
    }
  }

  const handleViewInvoice = async (invoice) => {
    try {
      setInvoiceLoading(true)
      setInvoiceError('')
      setSelectedInvoice(null)

      const response = await api.get(
        `/settings/billing/invoices/${invoice.id}`
      )

      setSelectedInvoice(response.data)
    } catch (error) {
      setInvoiceError(
        getErrorMessage(error, 'Failed to load invoice details.')
      )
    } finally {
      setInvoiceLoading(false)
    }
  }

  return (
    <main className="settings-page">
      <section className="settings-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your company, CRM and account settings</p>
        </div>
      </section>

      <section className="settings-layout">
        <div className="settings-menu">
          <button
            type="button"
            className={`settings-menu-item ${
              activeSection === 'profile' ? 'active' : ''
            }`}
            onClick={() => setActiveSection('profile')}
          >
            <div>
              <strong>My Profile</strong>
              <span>Manage your personal information</span>
            </div>
          </button>

          <button
            type="button"
            className={`settings-menu-item ${
              activeSection === 'company' ? 'active' : ''
            }`}
            onClick={() => setActiveSection('company')}
          >
            <div>
              <strong>Company Profile</strong>
              <span>Company information</span>
            </div>
          </button>

          <button
            type="button"
            className={`settings-menu-item ${
              activeSection === 'users' ? 'active' : ''
            }`}
            onClick={() => setActiveSection('users')}
          >
            <div>
              <strong>Users & Permissions</strong>
              <span>Manage users and access</span>
            </div>
          </button>

          <button
            type="button"
            className={`settings-menu-item ${
              activeSection === 'billing' ? 'active' : ''
            }`}
            onClick={() => setActiveSection('billing')}
          >
            <div>
              <strong>Subscription & Billing</strong>
              <span>Manage your plan and billing</span>
            </div>
          </button>
        </div>

        <div className="settings-content">
          {activeSection === 'profile' && (
            <div className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h2>My Profile</h2>
                  <p>View and manage your personal information</p>
                </div>

                <button
                  type="button"
                  className="settings-save-button"
                  onClick={handleSaveProfile}
                  disabled={profileSaving || profileLoading}
                >
                  {profileSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

              {profileLoading && <p>Loading profile...</p>}
              {profileError && (
                <p role="alert">{profileError}</p>
              )}
              {profileSuccess && (
                <p role="status">{profileSuccess}</p>
              )}

              <div className="company-logo-section">
                <div className="company-logo">
                  {profileForm.name
                    ? profileForm.name.charAt(0).toUpperCase()
                    : 'U'}
                </div>
                <div>
                  <strong>{profileForm.name || 'Your Profile'}</strong>
                  <p>{profileForm.role || 'User'}</p>
                </div>
              </div>

              <div className="settings-form">
                <div className="settings-form-group">
                  <label htmlFor="profileName">Full Name</label>
                  <input
                    id="profileName"
                    name="name"
                    value={profileForm.name}
                    onChange={handleProfileChange}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="settings-form-row">
                  <div className="settings-form-group">
                    <label htmlFor="profileEmail">Email Address</label>
                    <input
                      id="profileEmail"
                      type="email"
                      name="email"
                      value={profileForm.email}
                      onChange={handleProfileChange}
                      placeholder="Enter your email"
                    />
                  </div>

                  <div className="settings-form-group">
                    <label htmlFor="profilePhone">Phone Number</label>
                    <input
                      id="profilePhone"
                      name="phone"
                      value={profileForm.phone}
                      onChange={handleProfileChange}
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                <div className="settings-form-group">
                  <label htmlFor="profileRole">Role</label>
                  <input
                    id="profileRole"
                    name="role"
                    value={profileForm.role}
                    readOnly
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'company' && (
            <div className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h2>Company Profile</h2>
                  <p>Manage your company information</p>
                </div>

                <button
                  type="button"
                  className="settings-save-button"
                  onClick={handleSaveCompany}
                  disabled={companySaving || companyLoading}
                >
                  {companySaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

              {companyLoading && <p>Loading company details...</p>}
              {companyError && (
                <p role="alert">{companyError}</p>
              )}
              {companySuccess && (
                <p role="status">{companySuccess}</p>
              )}

              <div className="company-logo-section">
                <div className="company-logo">
                  {companyForm.companyName
                    ? companyForm.companyName.charAt(0).toUpperCase()
                    : 'C'}
                </div>
                <div>
                  <strong>Company Logo</strong>
                </div>
              </div>

              <div className="settings-form">
                <div className="settings-form-group">
                  <label htmlFor="companyName">Company Name</label>
                  <input
                    id="companyName"
                    name="companyName"
                    value={companyForm.companyName}
                    onChange={handleCompanyChange}
                    placeholder="Enter company name"
                  />
                </div>

                <div className="settings-form-row">
                  <div className="settings-form-group">
                    <label htmlFor="companyEmail">Email</label>
                    <input
                      id="companyEmail"
                      type="email"
                      name="email"
                      value={companyForm.email}
                      onChange={handleCompanyChange}
                      placeholder="company@example.com"
                    />
                  </div>

                  <div className="settings-form-group">
                    <label htmlFor="companyPhone">Phone</label>
                    <input
                      id="companyPhone"
                      name="phone"
                      value={companyForm.phone}
                      onChange={handleCompanyChange}
                      placeholder="+91 9876543210"
                    />
                  </div>
                </div>

                <div className="settings-form-group">
                  <label htmlFor="companyWebsite">Website</label>
                  <input
                    id="companyWebsite"
                    name="website"
                    value={companyForm.website}
                    onChange={handleCompanyChange}
                    placeholder="https://www.example.com"
                  />
                </div>

                <div className="settings-form-group">
                  <label htmlFor="companyIndustry">Industry</label>
                  <select
                    id="companyIndustry"
                    name="industry"
                    value={companyForm.industry}
                    onChange={handleCompanyChange}
                  >
                    <option value="">Select industry</option>
                    <option value="software">Software & Technology</option>
                    <option value="consulting">Consulting</option>
                    <option value="finance">Finance</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="education">Education</option>
                    <option value="retail">Retail</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="settings-form-group">
                  <label htmlFor="companyAddress">Address</label>
                  <textarea
                    id="companyAddress"
                    name="address"
                    value={companyForm.address}
                    onChange={handleCompanyChange}
                    placeholder="Enter company address"
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'users' && (
            <div className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h2>Users & Permissions</h2>
                  <p>View employees and manage their access</p>
                </div>

                <button
                  type="button"
                  className="billing-action-button"
                  onClick={fetchUsers}
                  disabled={usersLoading}
                >
                  {usersLoading ? 'Loading...' : 'Reload Users'}
                </button>
              </div>

              {usersError && <p role="alert">{usersError}</p>}

              <div className="users-summary">
                <div>
                  <span>Total Users</span>
                  <strong>{userSummary.totalUsers}</strong>
                </div>
                <div>
                  <span>Active Users</span>
                  <strong>{userSummary.activeUsers}</strong>
                </div>
                <div>
                  <span>Inactive Users</span>
                  <strong>{userSummary.inactiveUsers}</strong>
                </div>
              </div>

              {usersLoading ? (
                <p>Loading users...</p>
              ) : users.length === 0 ? (
                <p>No users found.</p>
              ) : (
                <div className="users-table-wrapper">
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>USER</th>
                        <th>ROLE</th>
                        <th>STATUS</th>
                        <th>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => {
                        const userId = getUserId(user)
                        const status = getUserStatus(user)

                        return (
                          <tr key={userId}>
                            <td>
                              <div className="settings-user">
                                <div className="settings-user-avatar">
                                  {(user.name || 'U')
                                    .split(' ')
                                    .map((word) => word[0] || '')
                                    .join('')
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </div>
                                <div>
                                  <strong>
                                    {user.name || 'Unnamed user'}
                                  </strong>
                                  <span>
                                    {user.email || 'No email'}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td>
                              {roles.length > 0 ? (
                                <select
                                  className="user-role"
                                  value={user.role || ''}
                                  disabled={updatingUserId === userId}
                                  onChange={(event) =>
                                    handleRoleChange(
                                      user,
                                      event.target.value
                                    )
                                  }
                                  aria-label={`Role for ${user.name || 'user'}`}
                                >
                                  {!roles.includes(user.role) &&
                                    user.role && (
                                      <option value={user.role}>
                                        {user.role}
                                      </option>
                                    )}

                                  {roles.map((role) => (
                                    <option key={role} value={role}>
                                      {role}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="user-role">
                                  {user.role || 'Not assigned'}
                                </span>
                              )}
                            </td>

                            <td>
                              <span
                                className={`user-status ${status.toLowerCase()}`}
                              >
                                {status}
                              </span>
                            </td>

                            <td>
                              <button
                                type="button"
                                className="user-action-button"
                                disabled={updatingUserId === userId}
                                onClick={() =>
                                  handleToggleUserStatus(user)
                                }
                              >
                                {updatingUserId === userId
                                  ? 'Updating...'
                                  : status === 'Active'
                                    ? 'Deactivate'
                                    : 'Activate'}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeSection === 'billing' && (
            <div className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h2>Subscription & Billing</h2>
                  <p>Manage your plan, payment and billing history</p>
                </div>

                <button
                  type="button"
                  className="settings-save-button"
                  onClick={fetchPlans}
                  disabled={billingLoading}
                >
                  View Plans
                </button>
              </div>

              {billingLoading && <p>Loading billing details...</p>}
              {billingError && <p role="alert">{billingError}</p>}
              {billingSuccess && (
                <p role="status">{billingSuccess}</p>
              )}

              {!billingLoading && billing && (
                <div className="billing-content">
                  <div className="current-plan">
                    <div>
                      <span className="billing-label">
                        CURRENT PLAN
                      </span>
                      <h3>{billing.plan?.name || 'Not available'}</h3>
                      <p>
                        {billing.plan?.description ||
                          'Current subscription'}
                      </p>
                    </div>

                    <div className="plan-price">
                      <strong>{formatMoney(billing.plan?.price)}</strong>
                      <span>
                        / {billing.plan?.billingCycle || 'billing cycle'}
                      </span>
                    </div>
                  </div>

                  <div className="billing-summary">
                    <div className="billing-summary-card">
                      <span>Seats Used</span>
                      <strong>
                        {billing.seats?.used ?? '—'} /{' '}
                        {billing.seats?.limit ?? '—'}
                      </strong>
                    </div>

                    <div className="billing-summary-card">
                      <span>Available Seats</span>
                      <strong>{billing.seats?.available ?? '—'}</strong>
                    </div>

                    <div className="billing-summary-card">
                      <span>Next Billing Date</span>
                      <strong>
                        {formatDate(billing.nextBillingDate)}
                      </strong>
                    </div>
                  </div>

                  <div className="billing-section">
                    <div className="billing-section-header">
                      <div>
                        <h3>Payment Method</h3>
                        <p>
                          Payment method used for your subscription
                        </p>
                      </div>

                      <button
                        type="button"
                        className="billing-action-button"
                        onClick={() => {
                          setUpiId(billing.paymentMethod?.upiId || '')
                          setEditingPayment((previous) => !previous)
                          setBillingError('')
                          setBillingSuccess('')
                        }}
                      >
                        {editingPayment ? 'Cancel' : 'Change'}
                      </button>
                    </div>

                    {!editingPayment ? (
                      <div className="payment-method">
                        <div className="payment-icon">₹</div>
                        <div>
                          <strong>
                            {billing.paymentMethod?.type ||
                              'No payment method'}
                          </strong>
                          <span>
                            {billing.paymentMethod?.upiId ||
                              'Add a UPI ID to get started'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="settings-form">
                        <div className="settings-form-group">
                          <label htmlFor="paymentUpiId">UPI ID</label>
                          <input
                            id="paymentUpiId"
                            value={upiId}
                            onChange={(event) =>
                              setUpiId(event.target.value)
                            }
                            placeholder="name@bank"
                          />
                        </div>

                        <button
                          type="button"
                          className="settings-save-button"
                          onClick={handleSavePayment}
                          disabled={savingPayment}
                        >
                          {savingPayment
                            ? 'Saving...'
                            : 'Save Payment Method'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="billing-section">
                    <div className="billing-section-header">
                      <div>
                        <h3>Billing History</h3>
                        <p>View your previous subscription payments</p>
                      </div>
                    </div>

                    {(billing.invoices || []).length === 0 ? (
                      <p>No invoices available yet.</p>
                    ) : (
                      <div className="billing-table-wrapper">
                        <table className="billing-table">
                          <thead>
                            <tr>
                              <th>INVOICE</th>
                              <th>DATE</th>
                              <th>AMOUNT</th>
                              <th>STATUS</th>
                              <th>ACTION</th>
                            </tr>
                          </thead>
                          <tbody>
                            {billing.invoices.map((invoice) => (
                              <tr key={invoice.id}>
                                <td>
                                  {invoice.invoiceNumber || invoice.id}
                                </td>
                                <td>{formatDate(invoice.date)}</td>
                                <td className="billing-amount">
                                  {formatMoney(invoice.amount)}
                                </td>
                                <td>
                                  <span className="billing-paid">
                                    {invoice.status || 'Unknown'}
                                  </span>
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="billing-invoice-button"
                                    onClick={() =>
                                      handleViewInvoice(invoice)
                                    }
                                  >
                                    View Invoice
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {showPlans && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="plans-dialog-title"
          className="settings-card"
          style={{ marginTop: 20 }}
        >
          <div className="settings-card-header">
            <div>
              <h2 id="plans-dialog-title">Available Plans</h2>
              <p>Compare the plans configured in your backend.</p>
            </div>

            <button
              type="button"
              className="billing-action-button"
              onClick={() => setShowPlans(false)}
            >
              Close
            </button>
          </div>

          {plans.length === 0 ? (
            <p>No plans were returned by the backend.</p>
          ) : (
            <div className="billing-table-wrapper">
              <table className="billing-table">
                <thead>
                  <tr>
                    <th>PLAN</th>
                    <th>PRICE</th>
                    <th>BILLING CYCLE</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => (
                    <tr key={plan.name}>
                      <td>
                        <strong>{plan.name}</strong>
                        {plan.description && <p>{plan.description}</p>}
                      </td>
                      <td>{formatMoney(plan.price)}</td>
                      <td>{plan.billingCycle || '—'}</td>
                      <td>
                        {plan.current ? 'Current plan' : 'Available'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {(invoiceLoading || invoiceError || selectedInvoice) && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="invoice-dialog-title"
          className="settings-card"
          style={{ marginTop: 20 }}
        >
          <div className="settings-card-header">
            <div>
              <h2 id="invoice-dialog-title">Invoice Details</h2>
              <p>Details returned by the billing API</p>
            </div>

            <button
              type="button"
              className="billing-action-button"
              onClick={() => {
                setSelectedInvoice(null)
                setInvoiceError('')
              }}
            >
              Close
            </button>
          </div>

          {invoiceLoading && <p>Loading invoice...</p>}
          {invoiceError && <p role="alert">{invoiceError}</p>}

          {selectedInvoice && (
            <div className="settings-form">
              <p>
                <strong>Invoice:</strong>{' '}
                {selectedInvoice.invoiceNumber || selectedInvoice.id}
              </p>
              <p>
                <strong>Plan:</strong> {selectedInvoice.plan || '—'}
              </p>
              <p>
                <strong>Amount:</strong>{' '}
                {formatMoney(selectedInvoice.amount)}
              </p>
              <p>
                <strong>Status:</strong>{' '}
                {selectedInvoice.status || '—'}
              </p>
              <p>
                <strong>Issued:</strong>{' '}
                {formatDate(selectedInvoice.date)}
              </p>
              <p>
                <strong>Period:</strong>{' '}
                {formatDate(selectedInvoice.periodStart)} –{' '}
                {formatDate(selectedInvoice.periodEnd)}
              </p>
              <p>
                <strong>Payment method:</strong>{' '}
                {typeof selectedInvoice.paymentMethod === 'string'
                  ? selectedInvoice.paymentMethod
                  : selectedInvoice.paymentMethod?.upiId ||
                    selectedInvoice.paymentMethod?.type ||
                    '—'}
              </p>
              <p>
                <strong>Billed to:</strong>{' '}
                {selectedInvoice.billedTo?.companyName || '—'}
              </p>
              <p>
                <strong>Email:</strong>{' '}
                {selectedInvoice.billedTo?.email || '—'}
              </p>
              <p>
                <strong>Address:</strong>{' '}
                {selectedInvoice.billedTo?.address || '—'}
              </p>
            </div>
          )}
        </div>
      )}
    </main>
  )
}

export default Settings