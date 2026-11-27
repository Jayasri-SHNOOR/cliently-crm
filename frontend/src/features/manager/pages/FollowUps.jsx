import { CalendarClock, Phone, CalendarCheck } from 'lucide-react'
import TablePage from '../../../shared/ui/TablePage'
import StatusBadge from '../../../shared/ui/StatusBadge'
import PageState from '../../../shared/ui/PageState'
import { formatDate, getLeads } from '../services/managerApi'
import useLoad from '../services/useLoad'

const loadLeads = () => getLeads({ page: 1, limit: 100 })

function followUpStatus(lead, now) {
  if (['Won', 'Lost'].includes(lead.status)) return 'Completed'
  return new Date(lead.nextFollowUp) < now ? 'Overdue' : 'Upcoming'
}

const ORDER = { Overdue: 0, Upcoming: 1, Completed: 2 }

const columns = [
  { key: 'customer', label: 'Customer' },
  { key: 'executive', label: 'Executive' },
  { key: 'stage', label: 'Lead Stage', render: (r) => <StatusBadge status={r.stage} /> },
  { key: 'priority', label: 'Priority', render: (r) => (r.priority ? <StatusBadge status={r.priority} /> : '—') },
  { key: 'due', label: 'Next Follow-up' },
  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  { key: 'product', label: 'Product' },
]

export default function FollowUps({ onNavigate }) {
  const { data, loading, error, reload } = useLoad(loadLeads)

  if (loading || error) return <PageState loading={loading} error={error} onRetry={reload} />

  const now = new Date()
  const rows = (data.leads || [])
    .filter((lead) => lead.nextFollowUp)
    .map((lead) => ({
      id: String(lead.id),
      customer: lead.company || lead.name,
      executive: lead.executive || 'Unassigned',
      stage: lead.status,
      priority: lead.priority,
      due: formatDate(lead.nextFollowUp),
      dueAt: new Date(lead.nextFollowUp).getTime(),
      status: followUpStatus(lead, now),
      product: lead.product || 'General enquiry',
    }))
    .sort((a, b) => ORDER[a.status] - ORDER[b.status] || a.dueAt - b.dueAt)

  const n = (s) => rows.filter((r) => r.status === s).length

  return (
    <TablePage
      title="Follow-ups & Activities" subtitle="Follow-up dates set when leads are assigned. Change them on Lead Assignment."
      actions={<button className="ui-btn ui-btn--ghost" onClick={() => onNavigate?.('assignment')}>Set follow-up dates</button>}
      kpis={[
        { label: 'Overdue', value: n('Overdue'), icon: CalendarClock },
        { label: 'Upcoming', value: n('Upcoming'), icon: Phone },
        { label: 'Completed', value: n('Completed'), icon: CalendarCheck },
      ]}
      columns={columns} rows={rows}
      filters={[
        { key: 'status', label: 'Status', options: ['Overdue', 'Upcoming', 'Completed'] },
        { key: 'executive', label: 'Executives', options: [...new Set(rows.map((r) => r.executive))] },
      ]}
      searchKeys={['customer', 'product']} searchPlaceholder="Search customer..."
      panelTitle="Follow-up Schedule"
    />
  )
}