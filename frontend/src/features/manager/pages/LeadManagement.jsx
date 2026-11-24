
import { useEffect, useState } from 'react'
import { Users, UserX, UserCheck, CircleSlash } from 'lucide-react'
import TablePage from '../../../shared/ui/TablePage'
import StatusBadge from '../../../shared/ui/StatusBadge'
import {
  getLeads,
  getExecutives,
  updateLeadPriority
} from '../services/managerApi'

export default function LeadManagement() {
  const [leads, setLeads] = useState([])
  const [executives, setExecutives] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingPriority, setSavingPriority] = useState({})

  useEffect(() => {
    let active = true

    async function loadData() {
      try {
        setLoading(true)
        setError('')

        const [leadData, executiveData] = await Promise.all([
          getLeads({ page: 1, limit: 100 }),
          getExecutives()
        ])

        if (!active) return

        const items = leadData.leads || []

        setLeads(
          items.map(lead => ({
            ...lead,
            id: String(lead.id),
            customer: lead.company || lead.name,
            product: lead.product || 'General enquiry',
            priority: lead.priority || '',
            executive: lead.executive || 'Unassigned'
          }))
        )

        setExecutives(executiveData.executives || [])
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message || 'Failed to load leads.'
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadData()

    return () => {
      active = false
    }
  }, [])

  const count = status =>
    leads.filter(lead => lead.status === status).length

  const handlePriorityChange = async (id, priority) => {
    const previousPriority = leads.find(lead => lead.id === id)?.priority || ''

    setError('')
    setSavingPriority(current => ({ ...current, [id]: true }))

    setLeads(current =>
      current.map(lead =>
        lead.id === id
          ? { ...lead, priority }
          : lead
      )
    )

    try {
      await updateLeadPriority(id, priority || null)
    } catch (err) {
      setLeads(current =>
        current.map(lead =>
          lead.id === id
            ? { ...lead, priority: previousPriority }
            : lead
        )
      )

      setError(
        err.response?.data?.message || 'Failed to update priority.'
      )
    } finally {
      setSavingPriority(current => {
        const updated = { ...current }
        delete updated[id]
        return updated
      })
    }
  }

  const columns = [
    {
      key: 'customer',
      label: 'Customer'
    },
    {
      key: 'product',
      label: 'Product'
    },
    {
      key: 'source',
      label: 'Source'
    },
    {
      key: 'priority',
      label: 'Priority',
      render: row => (
        <select
          value={row.priority || ''}
          disabled={Boolean(savingPriority[row.id])}
          onChange={e =>
            handlePriorityChange(row.id, e.target.value)
          }
          aria-label={`Set priority for ${row.customer}`}
        >
          <option value="">Set priority</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: row => <StatusBadge status={row.status} />
    },
    {
      key: 'executive',
      label: 'Executive',
      render: row =>
        row.executive === 'Unassigned'
          ? <StatusBadge status="Unassigned" />
          : row.executive
    }
  ]

  const filters = [
    {
      key: 'status',
      label: 'Status',
      options: [
        'New',
        'Contacted',
        'Qualified',
        'Demo',
        'Proposal',
        'Negotiation',
        'Won',
        'Lost'
      ]
    },
    {
      key: 'priority',
      label: 'Priority',
      options: ['High', 'Medium', 'Low']
    },
    {
      key: 'executive',
      label: 'Executives',
      options: [
        'Unassigned',
        ...executives.map(executive => executive.name)
      ]
    }
  ]

  if (loading) {
    return <main className="ui-page">Loading leads...</main>
  }

  if (error && leads.length === 0) {
    return <main className="ui-page">{error}</main>
  }

  return (
    <main>
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}

      <TablePage
        title="Lead Management"
        subtitle="View and monitor customer enquiries"
        kpis={[
          {
            label: 'Total Leads',
            value: leads.length,
            icon: Users
          },
          {
            label: 'New',
            value: count('New'),
            icon: UserX
          },
          {
            label: 'Qualified',
            value: count('Qualified'),
            icon: UserCheck
          },
          {
            label: 'Lost',
            value: count('Lost'),
            icon: CircleSlash
          }
        ]}
        columns={columns}
        rows={leads}
        filters={filters}
        searchKeys={['customer', 'product', 'email', 'phone']}
        searchPlaceholder="Search customer or product..."
        panelTitle="All Enquiries"
      />
    </main>
  )
}
