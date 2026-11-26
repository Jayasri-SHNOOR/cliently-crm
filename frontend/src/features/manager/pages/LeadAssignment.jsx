
import { useEffect, useState } from 'react'
import PageHeader from '../../../shared/ui/PageHeader'
import Panel from '../../../shared/ui/Panel'
import DataTable from '../../../shared/ui/DataTable'
import '../../../shared/ui/ui.css'
import {
  getLeads,
  getExecutives,
  assignLead
} from '../services/managerApi'

export default function LeadAssignment() {
  const [rows, setRows] = useState([])
  const [executives, setExecutives] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState(null)

  async function loadData() {
    setLoading(true)
    setError('')

    try {
      const [leadData, executiveData] = await Promise.all([
        getLeads({ page: 1, limit: 100 }),
        getExecutives()
      ])

      setRows((leadData.leads || []).map((lead) => ({
        ...lead,
        id: String(lead.id),
        customer: lead.company || lead.name,
        product: lead.product || 'General enquiry',
        executive: lead.executive || 'Unassigned',
        deadline: lead.nextFollowUp
          ? new Date(lead.nextFollowUp).toISOString().slice(0, 10)
          : ''
      })))

      setExecutives(executiveData.executives || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load leads.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const update = (id, patch) => {
    setRows((current) =>
      current.map((lead) =>
        lead.id === id ? { ...lead, ...patch } : lead
      )
    )
  }

  async function saveAssignment(lead) {
    if (lead.executive === 'Unassigned') return

    setSavingId(lead.id)
    setError('')

    try {
      const result = await assignLead(lead.id, {
        executive: lead.executive,
        priority: lead.priority || 'Medium',
        followUpDate: lead.deadline || undefined
      })

      const saved = result.lead

      setRows((current) =>
        current.map((item) =>
          item.id === lead.id
            ? {
                ...item,
                ...saved,
                id: String(saved.id),
                customer: saved.company || saved.name,
                product: saved.product || 'General enquiry',
                executive: saved.executive || 'Unassigned',
                deadline: saved.nextFollowUp
                  ? new Date(saved.nextFollowUp).toISOString().slice(0, 10)
                  : ''
              }
            : item
        )
      )
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save assignment.')
      await loadData()
    } finally {
      setSavingId(null)
    }
  }

  const activeExecutives = executives

  const columns = [
    { key: 'customer', label: 'Customer' },
    { key: 'product', label: 'Product' },
    {
      key: 'priority',
      label: 'Priority',
      render: (row) => (
        <select
          className="ui-select"
          value={row.priority || 'Medium'}
          disabled={savingId === row.id}
          onChange={(event) => {
            const priority = event.target.value
            const updated = { ...row, priority }
            update(row.id, { priority })

            if (row.executive !== 'Unassigned') {
              saveAssignment(updated)
            }
          }}
        >
          {['High', 'Medium', 'Low'].map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>
      )
    },
    {
      key: 'deadline',
      label: 'Follow-up by',
      render: (row) => (
        <input
          type="date"
          className="ui-input"
          value={row.deadline || ''}
          disabled={savingId === row.id}
          onChange={(event) => {
            const deadline = event.target.value
            const updated = { ...row, deadline }
            update(row.id, { deadline })

            if (row.executive !== 'Unassigned') {
              saveAssignment(updated)
            }
          }}
        />
      )
    },
    {
      key: 'executive',
      label: 'Executive',
      render: (row) => (
        <select
          className="ui-select"
          value={row.executive === 'Unassigned' ? '' : row.executive}
          disabled={savingId === row.id}
          onChange={(event) => {
            const executive = event.target.value
            const updated = { ...row, executive }

            update(row.id, { executive })

            if (executive) {
              saveAssignment(updated)
            }
          }}
        >
          <option value="" disabled>
            Assign to...
          </option>
          {activeExecutives.map((executive) => (
            <option key={executive.id} value={executive.name}>
              {executive.name} ({executive.activeLeads} active leads)
            </option>
          ))}
        </select>
      )
    }
  ]

  const unassigned = rows.filter(
    (lead) => lead.executive === 'Unassigned'
  )

  const assigned = rows.filter(
    (lead) => lead.executive !== 'Unassigned'
  )

  if (loading) {
    return <main className="ui-page">Loading leads...</main>
  }

  return (
    <main className="ui-page">
      <PageHeader
        title="Lead Assignment"
        subtitle="Assign leads to suitable Sales Executives"
      />

      {error && <p role="alert">{error}</p>}

      <Panel title={`Unassigned Leads (${unassigned.length})`}>
        <DataTable
          columns={columns}
          rows={unassigned}
          empty="All leads are assigned."
        />
      </Panel>

      <Panel
        title="Assigned Leads"
        subtitle="Change the executive to reassign"
      >
        <DataTable columns={columns} rows={assigned} />
      </Panel>
    </main>
  )
}
