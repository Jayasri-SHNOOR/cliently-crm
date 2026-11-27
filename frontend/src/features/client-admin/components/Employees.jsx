import { useState, useEffect, useCallback } from 'react'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../../login/config/firebase'
import api from '../services/api'
import './Employees.css'

const ROLES = ['Sales Executive', 'Operational Staff', 'Manager']
const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Intern']

const ROLE_DEPARTMENT = {
  'Sales Executive': 'Sales',
  'Operational Staff': 'Operations',
  Manager: 'Management'
}

const emptyForm = {
  name: '',
  email: '',
  role: 'Sales Executive',
  department: 'Sales',
  phone: '',
  employeeCode: '',
  designation: '',
  employmentType: 'Full-time',
  dateOfJoining: '',
  managerId: ''
}

const formatMoney = (amount = 0) =>
  amount >= 100000
    ? `₹${(amount / 100000).toFixed(1)}L`
    : `₹${Math.round(amount).toLocaleString('en-IN')}`

const formatDate = (value) => {
  if (!value) return '—'
  const [year, month, day] = value.split('-')
  return `${day}-${month}-${year}`
}

const normalizeEmployee = (employee) => ({
  ...employee,
  id: employee._id || employee.id,
  name: employee.name || '',
  email: employee.email || '',
  role: employee.role || 'Sales Executive',
  employeeCode: employee.employeeCode || '',
  designation: employee.designation || '',
  employmentType: employee.employmentType || 'Full-time',
  managerId: employee.managerId || '',
  dateOfJoining: employee.dateOfJoining
    ? String(employee.dateOfJoining).slice(0, 10)
    : '',
  deals: employee.deals ?? 0,
  won: employee.won ?? 0,
  lost: employee.lost ?? 0,
  inProgress: employee.inProgress ?? 0,
  activeDeals: employee.activeDeals ?? 0,
  revenue: employee.revenue ?? 0,
  revenueMonth: employee.revenueMonth ?? 0,
  revenueQuarter: employee.revenueQuarter ?? 0,
  leadsAssigned: employee.leadsAssigned ?? 0,
  qualified: employee.qualified ?? 0,
  calls: employee.calls ?? 0,
  meetings: employee.meetings ?? 0,
  demos: employee.demos ?? 0,
  followUps: employee.followUps ?? 0,
  status: employee.status || 'Active'
})

function Employees() {
  const [employees, setEmployees] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [activeRole, setActiveRole] = useState('Sales Executive')
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [pageError, setPageError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [sendingInvite, setSendingInvite] = useState(false)
  const [seats, setSeats] = useState(null)
  const [editingId, setEditingId] = useState(null)

  const loadEmployees = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)

      const response = await api.get('/employees')
      const employeeList = Array.isArray(response.data)
        ? response.data
        : response.data.employees || []

      setEmployees(employeeList.map(normalizeEmployee))
      setPageError('')
    } catch (error) {
      if (!silent) {
        setPageError(
          error.response?.data?.message ||
          'Unable to load employees. Please try again.'
        )
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEmployees()

    const timer = setInterval(() => {
      if (!document.hidden) loadEmployees(true)
    }, 30000)

    return () => clearInterval(timer)
  }, [loadEmployees])

  useEffect(() => {
    setSelectedEmployee((current) =>
      current
        ? employees.find((employee) => employee.id === current.id) || null
        : null
    )
  }, [employees])

  const loadSeats = useCallback(async () => {
    try {
      const response = await api.get('/settings/users')
      setSeats(response.data.summary?.seats || null)
    } catch {
      setSeats(null)
    }
  }, [])

  useEffect(() => {
    loadSeats()
  }, [loadSeats])

  const filteredEmployees = employees.filter((employee) => {
    const search = searchTerm.toLowerCase()

    const matchesSearch =
      employee.name.toLowerCase().includes(search) ||
      employee.email.toLowerCase().includes(search)

    const matchesStatus =
      statusFilter === 'All' || employee.status === statusFilter

    const matchesRole = employee.role === activeRole

    return matchesSearch && matchesStatus && matchesRole
  })

  const managerOptions = employees.filter(
    (employee) =>
      employee.role === 'Manager' &&
      employee.status === 'Active' &&
      employee.id !== editingId
  )

  const managerName = (id) =>
    employees.find((employee) => employee.id === id)?.name || '—'

  const roleCount = (role) =>
    employees.filter((employee) => employee.role === role).length

  const activeUsers = employees.filter(
    (employee) => employee.status === 'Active'
  ).length

  const openAddForm = () => {
    setEditingId(null)
    setFormData({
      ...emptyForm,
      role: activeRole,
      department: ROLE_DEPARTMENT[activeRole]
    })
    setFormError('')
    setShowForm(true)
  }

  const openEditForm = (employee) => {
    setEditingId(employee.id)
    setFormData({
      name: employee.name,
      email: employee.email,
      role: employee.role || 'Sales Executive',
      department:
        ROLE_DEPARTMENT[employee.role] || employee.department || 'Sales',
      phone: employee.phone || '',
      employeeCode: employee.employeeCode,
      designation: employee.designation,
      employmentType: employee.employmentType,
      dateOfJoining: employee.dateOfJoining,
      managerId: employee.managerId
    })
    setFormError('')
    setSelectedEmployee(null)
    setShowForm(true)
  }

  const closeForm = () => {
    if (saving) return
    setShowForm(false)
    setFormError('')
  }

  const handleInputChange = (event) => {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }))
  }

  // Firebase emails the employee a "set your password" link.
  // The Client Admin never sees the link or the password.
  const sendInvite = (email) => sendPasswordResetEmail(auth, email)

  const handleSaveEmployee = async (event) => {
    event.preventDefault()
    setFormError('')
    setNotice('')

    const normalizedEmail = formData.email.trim().toLowerCase()

    const emailExists = employees.some(
      (employee) =>
        employee.id !== editingId &&
        employee.email.toLowerCase() === normalizedEmail
    )

    if (emailExists) {
      setFormError('An employee with this email already exists.')
      return
    }

    const payload = {
      name: formData.name.trim(),
      email: normalizedEmail,
      role: formData.role,
      department: ROLE_DEPARTMENT[formData.role],
      phone: formData.phone.trim(),
      employeeCode: formData.employeeCode.trim(),
      designation: formData.designation.trim(),
      employmentType: formData.employmentType,
      dateOfJoining: formData.dateOfJoining || null,
      managerId:
        formData.role === 'Manager' ? null : formData.managerId || null
    }

    try {
      setSaving(true)

      if (editingId) {
        const response = await api.put(`/employees/${editingId}`, payload)

        const existing = employees.find((item) => item.id === editingId) || {}
        const updatedEmployee = normalizeEmployee({
          ...existing,
          ...(response.data.employee || response.data),
          id: editingId
        })

        setEmployees((previous) =>
          previous.map((item) =>
            item.id === editingId ? updatedEmployee : item
          )
        )
        setSelectedEmployee(updatedEmployee)
        setActiveRole(updatedEmployee.role)
        setEditingId(null)
        setFormData(emptyForm)
        setShowForm(false)
        loadEmployees(true)
      } else {
        const response = await api.post('/employees', payload)

        const createdEmployee = normalizeEmployee(
          response.data.employee || response.data
        )

        setEmployees((previous) => [...previous, createdEmployee])
        setSelectedEmployee(createdEmployee)
        setActiveRole(createdEmployee.role)
        setSearchTerm('')
        setStatusFilter('All')
        setFormData(emptyForm)
        setShowForm(false)
        loadSeats()

        try {
          await sendInvite(createdEmployee.email)
          setNotice(`Invite email sent to ${createdEmployee.email}.`)
        } catch {
          setPageError(
            'Employee added, but the invite email could not be sent. Use "Resend Invite" from the employee details.'
          )
        }
      }
    } catch (error) {
      setFormError(
        error.response?.data?.message ||
        (editingId
          ? 'Unable to update employee. Please try again.'
          : 'Unable to add employee. Please try again.')
      )
    } finally {
      setSaving(false)
    }
  }

  const handleResendInvite = async (employee) => {
    try {
      setSendingInvite(true)
      setPageError('')
      setNotice('')
      await sendInvite(employee.email)
      setNotice(`Invite email sent to ${employee.email}.`)
    } catch {
      setPageError('Unable to send the invite email. Please try again.')
    } finally {
      setSendingInvite(false)
    }
  }

  const handleDeactivate = async (employee) => {
    const newStatus = employee.status === 'Active' ? 'Inactive' : 'Active'

    try {
      setUpdatingStatus(true)
      setPageError('')
      setNotice('')

      const response = await api.put(`/employees/${employee.id}`, {
        status: newStatus
      })

      const updatedEmployee = normalizeEmployee({
        ...employee,
        ...(response.data.employee || response.data),
        id: employee.id,
        status: response.data?.employee?.status || newStatus
      })

      setEmployees((previous) =>
        previous.map((item) =>
          item.id === employee.id ? updatedEmployee : item
        )
      )

      setSelectedEmployee(updatedEmployee)
      loadSeats()
    } catch (error) {
      setPageError(
        error.response?.data?.message ||
        'Unable to update employee status. Please try again.'
      )
    } finally {
      setUpdatingStatus(false)
    }
  }

  const getInitials = (name = '') =>
    name
      .split(' ')
      .filter(Boolean)
      .map((word) => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()

  const getWinRate = (employee) =>
    employee.deals
      ? ((employee.won / employee.deals) * 100).toFixed(1)
      : '0.0'

  const getPercent = (part, total) => (total ? (part / total) * 100 : 0)

  return (
    <main className="employees-page">
      <section className="employees-header">
        <div>
          <h1>Employees</h1>
          <p>Manage your team and monitor their performance.</p>
        </div>

        <button
          type="button"
          className="add-employee-button"
          onClick={openAddForm}
        >
          + Add Employee
        </button>
      </section>

      {pageError && (
        <p className="employee-form-error" role="alert">
          {pageError}
        </p>
      )}

      {notice && (
        <p className="employee-notice" role="status">
          {notice}
        </p>
      )}

      <section className="employees-summary">
        <div className="employee-summary-card">
          <span>Total Users</span>
          <strong>{employees.length}</strong>
        </div>

        <div className="employee-summary-card">
          <span>Active Users</span>
          <strong>{activeUsers}</strong>
        </div>

        <div className="employee-summary-card">
          <span>Seats Used</span>
          <strong>
            {seats?.used ?? activeUsers} / {seats?.total ?? '—'}
          </strong>
        </div>
      </section>

      <section className="employees-table-card">
        <div className="employee-tabs">
          {ROLES.map((role) => (
            <button
              key={role}
              type="button"
              className={`employee-tab ${activeRole === role ? 'active' : ''}`}
              onClick={() => setActiveRole(role)}
            >
              {role} ({roleCount(role)})
            </button>
          ))}
        </div>

        <div className="employees-toolbar">
          <div className="employee-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Search employee..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <div className="employee-filters">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="employees-table-wrapper">
          <table className="employees-table">
            <thead>
              <tr>
                <th>EMPLOYEE</th>
                <th>ROLE</th>
                <th>DEALS</th>
                <th>WON</th>
                <th>REVENUE</th>
                <th>STATUS</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6">Loading employees...</td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => (
                  <tr
                    key={employee.id}
                    onClick={() => setSelectedEmployee(employee)}
                  >
                    <td>
                      <div className="employee-name-cell">
                        <div className="employee-avatar">
                          {getInitials(employee.name)}
                        </div>

                        <div>
                          <strong>{employee.name}</strong>
                          <span>{employee.email}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="employee-role">{employee.role}</span>
                    </td>

                    <td>{employee.deals}</td>
                    <td>{employee.won}</td>

                    <td className="employee-revenue">
                      {formatMoney(employee.revenue)}
                    </td>

                    <td>
                      <span
                        className={`employee-status ${employee.status.toLowerCase()}`}
                      >
                        {employee.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredEmployees.length === 0 && (
          <div className="no-employees">
            <h3>No employees found</h3>
            <p>Try changing your search or filter.</p>
          </div>
        )}
      </section>

      {showForm && (
        <div className="employee-modal-overlay" onClick={closeForm}>
          <form
            className="employee-modal"
            onClick={(event) => event.stopPropagation()}
            onSubmit={handleSaveEmployee}
          >
            <div className="employee-form-header">
              <div>
                <h2>{editingId ? 'Edit Employee' : 'Add Employee'}</h2>
                <p>
                  {editingId
                    ? 'Update the employee details.'
                    : "Enter the new employee's details. An email will be sent so they can set their own password."}
                </p>
              </div>

              <button
                type="button"
                className="employee-close-button"
                onClick={closeForm}
                aria-label="Close form"
                disabled={saving}
              >
                ×
              </button>
            </div>

            <label htmlFor="employee-name">Full Name *</label>
            <input
              id="employee-name"
              name="name"
              type="text"
              placeholder="Enter employee name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />

            <label htmlFor="employee-email">Email Address *</label>
            <input
              id="employee-email"
              name="email"
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={handleInputChange}
              required
            />

            <label htmlFor="employee-role">Role / Department *</label>
            <select
              id="employee-role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>

            {formData.role !== 'Manager' && (
              <>
                <label htmlFor="employee-manager">Reporting Manager</label>
                <select
                  id="employee-manager"
                  name="managerId"
                  value={formData.managerId}
                  onChange={handleInputChange}
                >
                  <option value="">No manager assigned</option>
                  {managerOptions.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name}
                    </option>
                  ))}
                </select>
              </>
            )}

            <label htmlFor="employee-phone">Phone Number</label>
            <input
              id="employee-phone"
              name="phone"
              type="tel"
              placeholder="Enter phone number"
              value={formData.phone}
              onChange={handleInputChange}
            />

            <label htmlFor="employee-code">Employee ID</label>
            <input
              id="employee-code"
              name="employeeCode"
              type="text"
              placeholder="Enter employee ID"
              value={formData.employeeCode}
              onChange={handleInputChange}
            />

            <label htmlFor="employee-designation">Designation</label>
            <input
              id="employee-designation"
              name="designation"
              type="text"
              placeholder="Enter designation"
              value={formData.designation}
              onChange={handleInputChange}
            />

            <label htmlFor="employee-type">Employment Type</label>
            <select
              id="employee-type"
              name="employmentType"
              value={formData.employmentType}
              onChange={handleInputChange}
            >
              {EMPLOYMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <label htmlFor="employee-joining">Date of Joining</label>
            <input
              id="employee-joining"
              name="dateOfJoining"
              type="date"
              value={formData.dateOfJoining}
              onChange={handleInputChange}
            />

            {formError && (
              <p className="employee-form-error" role="alert">
                {formError}
              </p>
            )}

            <div className="employee-form-actions">
              <button
                type="button"
                className="employee-cancel-button"
                onClick={closeForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="employee-submit-button"
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : editingId
                    ? 'Save Changes'
                    : 'Add Employee'}
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedEmployee && (
        <div
          className="employee-panel-overlay"
          onClick={() => setSelectedEmployee(null)}
        >
          <aside
            className="employee-details-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="employee-panel-header">
              <div className="employee-profile">
                <div className="large-employee-avatar">
                  {getInitials(selectedEmployee.name)}
                </div>

                <div>
                  <h2>{selectedEmployee.name}</h2>
                  <p>{selectedEmployee.role}</p>
                  <span>● {selectedEmployee.status}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedEmployee(null)}
                aria-label="Close employee details"
              >
                ×
              </button>
            </div>

            <div className="employee-panel-email">
              <p>{selectedEmployee.email}</p>
              {selectedEmployee.phone && <p>{selectedEmployee.phone}</p>}
              <p>{selectedEmployee.department}</p>
            </div>

            <div className="employee-panel-actions">
              <button
                type="button"
                onClick={() => openEditForm(selectedEmployee)}
              >
                Edit
              </button>

              {selectedEmployee.status === 'Active' && (
                <button
                  type="button"
                  onClick={() => handleResendInvite(selectedEmployee)}
                  disabled={sendingInvite}
                >
                  {sendingInvite ? 'Sending...' : 'Resend Invite'}
                </button>
              )}

              <button
                type="button"
                onClick={() => handleDeactivate(selectedEmployee)}
                disabled={updatingStatus}
              >
                {updatingStatus
                  ? 'Updating...'
                  : selectedEmployee.status === 'Active'
                    ? 'Deactivate'
                    : 'Activate'}
              </button>
            </div>

            <section className="employee-detail-section">
              <h3>Employment Information</h3>
              <div className="sales-metric-row">
                <span>Employee ID</span>
                <strong>{selectedEmployee.employeeCode || '—'}</strong>
              </div>
              <div className="sales-metric-row">
                <span>Designation</span>
                <strong>{selectedEmployee.designation || '—'}</strong>
              </div>
              <div className="sales-metric-row">
                <span>Department</span>
                <strong>{selectedEmployee.department || '—'}</strong>
              </div>
              {selectedEmployee.role !== 'Manager' && (
                <div className="sales-metric-row">
                  <span>Reporting Manager</span>
                  <strong>{managerName(selectedEmployee.managerId)}</strong>
                </div>
              )}
              <div className="sales-metric-row">
                <span>Employment Type</span>
                <strong>{selectedEmployee.employmentType}</strong>
              </div>
              <div className="sales-metric-row">
                <span>Date of Joining</span>
                <strong>{formatDate(selectedEmployee.dateOfJoining)}</strong>
              </div>
            </section>

            <section className="performance-section">
              <h3>Performance Overview</h3>

              <div className="performance-grid">
                <div>
                  <span>Total Deals</span>
                  <strong>{selectedEmployee.deals}</strong>
                </div>
                <div>
                  <span>Deals Won</span>
                  <strong>{selectedEmployee.won}</strong>
                </div>
                <div>
                  <span>Revenue</span>
                  <strong>{formatMoney(selectedEmployee.revenue)}</strong>
                </div>
                <div>
                  <span>Win Rate</span>
                  <strong>{getWinRate(selectedEmployee)}%</strong>
                </div>
                <div>
                  <span>Active Deals</span>
                  <strong>{selectedEmployee.activeDeals}</strong>
                </div>
              </div>
            </section>

            <section className="employee-detail-section">
              <h3>Deal Performance</h3>

              <div className="deal-performance-row">
                <span>Won</span>
                <strong>{selectedEmployee.won}</strong>
              </div>
              <div className="performance-bar">
                <span
                  style={{
                    width: `${getPercent(selectedEmployee.won, selectedEmployee.deals)}%`
                  }}
                />
              </div>

              <div className="deal-performance-row">
                <span>Lost</span>
                <strong>{selectedEmployee.lost}</strong>
              </div>
              <div className="performance-bar lost-bar">
                <span
                  style={{
                    width: `${getPercent(selectedEmployee.lost, selectedEmployee.deals)}%`
                  }}
                />
              </div>

              <div className="deal-performance-row">
                <span>In Progress</span>
                <strong>{selectedEmployee.inProgress}</strong>
              </div>
              <div className="performance-bar progress-bar">
                <span
                  style={{
                    width: `${getPercent(selectedEmployee.inProgress, selectedEmployee.deals)}%`
                  }}
                />
              </div>
            </section>

            <section className="employee-detail-section">
              <h3>Revenue Performance</h3>
              <div className="revenue-row">
                <span>This Month</span>
                <strong>{formatMoney(selectedEmployee.revenueMonth)}</strong>
              </div>
              <div className="revenue-row">
                <span>This Quarter</span>
                <strong>{formatMoney(selectedEmployee.revenueQuarter)}</strong>
              </div>
              <div className="revenue-row">
                <span>Total</span>
                <strong>{formatMoney(selectedEmployee.revenue)}</strong>
              </div>
            </section>

            <section className="employee-detail-section">
              <h3>Sales Performance</h3>
              <div className="sales-metric-row">
                <span>Leads Assigned</span>
                <strong>{selectedEmployee.leadsAssigned}</strong>
              </div>
              <div className="sales-metric-row">
                <span>Qualified</span>
                <strong>{selectedEmployee.qualified}</strong>
              </div>
              <div className="sales-metric-row">
                <span>Deals Created</span>
                <strong>{selectedEmployee.deals}</strong>
              </div>
              <div className="sales-metric-row">
                <span>Deals Won</span>
                <strong>{selectedEmployee.won}</strong>
              </div>
              <div className="sales-metric-row">
                <span>Win Rate</span>
                <strong>{getWinRate(selectedEmployee)}%</strong>
              </div>
            </section>

            <section className="employee-detail-section">
              <h3>Activities</h3>

              <div className="activity-grid">
                <div>
                  <span>Calls</span>
                  <strong>{selectedEmployee.calls}</strong>
                </div>
                <div>
                  <span>Meetings</span>
                  <strong>{selectedEmployee.meetings}</strong>
                </div>
                <div>
                  <span>Demos</span>
                  <strong>{selectedEmployee.demos}</strong>
                </div>
                <div>
                  <span>Follow-ups</span>
                  <strong>{selectedEmployee.followUps}</strong>
                </div>
              </div>
            </section>
          </aside>
        </div>
      )}
    </main>
  )
}

export default Employees