
import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import './Employees.css'

const emptyForm = {
  name: '',
  email: '',
  role: 'Sales Executive',
  department: 'Sales',
  phone: '',
  status: 'Active'
}

const normalizeEmployee = (employee) => ({
  ...employee,
  id: employee._id || employee.id,
  deals: employee.deals ?? 0,
  won: employee.won ?? 0,
  revenue: employee.revenue ?? 0,
  tasks: employee.tasks ?? 0,
  activeDeals: employee.activeDeals ?? 0,
  leadsAssigned: employee.leadsAssigned ?? 0,
  qualified: employee.qualified ?? 0,
  calls: employee.calls ?? 0,
  meetings: employee.meetings ?? 0,
  demos: employee.demos ?? 0,
  followUps: employee.followUps ?? 0,
  lost: employee.lost ?? 0,
  inProgress: employee.inProgress ?? 0,
  status: employee.status || 'Active'
})

function Employees() {
  const [employees, setEmployees] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [pageError, setPageError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [seats, setSeats] = useState(null)
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true)
        setPageError('')

        const response = await api.get('/employees')
        const employeeList = Array.isArray(response.data)
          ? response.data
          : response.data.employees || []

        setEmployees(employeeList.map(normalizeEmployee))
      } catch (error) {
        setPageError(
          error.response?.data?.message ||
          'Unable to load employees. Please try again.'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchEmployees()
  }, [])

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

    return matchesSearch && matchesStatus
  })

  const activeUsers = employees.filter(
    (employee) => employee.status === 'Active'
  ).length

  const openAddForm = () => {
    setFormData(emptyForm)
    setFormError('')
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

  const handleAddEmployee = async (event) => {
    event.preventDefault()
    setFormError('')

    const normalizedEmail = formData.email.trim().toLowerCase()

    const emailExists = employees.some(
      (employee) => employee.email.toLowerCase() === normalizedEmail
    )

    if (emailExists) {
      setFormError('An employee with this email already exists.')
      return
    }

    const payload = {
      name: formData.name.trim(),
      email: normalizedEmail,
      role: formData.role,
      department: formData.department.trim() || 'Sales',
      phone: formData.phone.trim(),
      status: formData.status
    }

    try {
      setSaving(true)

      const response = await api.post('/employees', payload)

      const createdEmployee = normalizeEmployee(
        response.data.employee || response.data
      )

      setEmployees((previous) => [...previous, createdEmployee])
      setSelectedEmployee(createdEmployee)
      setSearchTerm('')
      setStatusFilter('All')
      setFormData(emptyForm)
      setShowForm(false)
      loadSeats()
    } catch (error) {
      setFormError(
        error.response?.data?.message ||
        'Unable to add employee. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }
  const handleDeactivate = async (employee) => {
    const newStatus =
      employee.status === 'Active' ? 'Inactive' : 'Active'

    try {
      setUpdatingStatus(true)
      setPageError('')

      const action = newStatus === 'Inactive' ? 'deactivate' : 'activate'

      const response = await api.post(
        `/settings/users/${employee.id}/${action}`
      )

      const updatedEmployee = normalizeEmployee({
        ...employee,
        ...response.data,
        id: employee.id,
        status: response.data?.status || newStatus
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

  const formatRevenue = (revenue) =>
    `₹${(revenue / 100000).toFixed(1)}L`

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

  return (
    <main className="employees-page">
      <section className="employees-header">
        <div>
          <h1>Employees</h1>
          <p>Manage sales executives and monitor their performance.</p>
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
            {seats?.used ?? activeUsers} / {seats?.limit ?? '—'}
          </strong>
        </div>
      </section>

      <section className="employees-table-card">
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
                <th>TASKS</th>
                <th>STATUS</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7">Loading employees...</td>
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
                      <span className="employee-role">
                        {employee.role}
                      </span>
                    </td>

                    <td>{employee.deals}</td>
                    <td>{employee.won}</td>

                    <td className="employee-revenue">
                      {formatRevenue(employee.revenue)}
                    </td>

                    <td>{employee.tasks}</td>

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
            onSubmit={handleAddEmployee}
          >
            <div className="employee-form-header">
              <div>
                <h2>Add Employee</h2>
                <p>Enter the new employee's details.</p>
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

            <label htmlFor="employee-role">Role *</label>
            <select
              id="employee-role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              required
            >
              <option value="Sales Executive">Sales Executive</option>
              <option value="Sales Manager">Sales Manager</option>
              <option value="Admin">Admin</option>
            </select>

            <label htmlFor="employee-department">Department</label>
            <input
              id="employee-department"
              name="department"
              type="text"
              placeholder="Enter department"
              value={formData.department}
              onChange={handleInputChange}
            />

            <label htmlFor="employee-phone">Phone Number</label>
            <input
              id="employee-phone"
              name="phone"
              type="tel"
              placeholder="Enter phone number"
              value={formData.phone}
              onChange={handleInputChange}
            />

            <label htmlFor="employee-status">Status</label>
            <select
              id="employee-status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

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
                {saving ? 'Adding...' : 'Add Employee'}
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
                  <strong>{formatRevenue(selectedEmployee.revenue)}</strong>
                </div>
                <div>
                  <span>Win Rate</span>
                  <strong>{getWinRate(selectedEmployee)}%</strong>
                </div>
                <div>
                  <span>Active Deals</span>
                  <strong>{selectedEmployee.activeDeals}</strong>
                </div>
                <div>
                  <span>Tasks Done</span>
                  <strong>{selectedEmployee.tasks}</strong>
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
                    width: `${
                      selectedEmployee.deals
                        ? (selectedEmployee.won / selectedEmployee.deals) * 100
                        : 0
                    }%`
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
                    width: `${
                      selectedEmployee.deals
                        ? (selectedEmployee.lost / selectedEmployee.deals) * 100
                        : 0
                    }%`
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
                    width: `${
                      selectedEmployee.deals
                        ? (selectedEmployee.inProgress / selectedEmployee.deals) * 100
                        : 0
                    }%`
                  }}
                />
              </div>
            </section>

            <section className="employee-detail-section">
              <h3>Revenue Performance</h3>
              <div className="revenue-row">
                <span>This Month</span>
                <strong>{formatRevenue(selectedEmployee.revenue)}</strong>
              </div>
              <div className="revenue-row">
                <span>This Quarter</span>
                <strong>{formatRevenue(selectedEmployee.revenue)}</strong>
              </div>
              <div className="revenue-row">
                <span>Total</span>
                <strong>{formatRevenue(selectedEmployee.revenue)}</strong>
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
                <div>
                  <span>Tasks Completed</span>
                  <strong>{selectedEmployee.tasks}</strong>
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
