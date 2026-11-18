import { CalendarClock, Phone, CalendarCheck } from 'lucide-react'
import TablePage from '../../../shared/ui/TablePage'
import StatusBadge from '../../../shared/ui/StatusBadge'
import { followups, executives } from '../services/mockData'

const columns = [
  { key: 'customer', label: 'Customer' },
  { key: 'executive', label: 'Executive' },
  { key: 'type', label: 'Activity' },
  { key: 'due', label: 'Next Follow-up' },
  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  { key: 'note', label: 'Note' },
]

const filters = [
  { key: 'status', label: 'Status', options: ['Overdue', 'Upcoming', 'Completed'] },
  { key: 'type', label: 'Activities', options: ['Call', 'Meeting', 'Email'] },
  { key: 'executive', label: 'Executives', options: executives.map((e) => e.name) },
]

export default function FollowUps() {
  const n = (s) => followups.filter((f) => f.status === s).length
  return (
    <TablePage
      title="Follow-ups & Activities" subtitle="Make sure customers are contacted on time"
      kpis={[
        { label: 'Overdue', value: n('Overdue'), icon: CalendarClock },
        { label: 'Upcoming', value: n('Upcoming'), icon: Phone },
        { label: 'Completed', value: n('Completed'), icon: CalendarCheck },
      ]}
      columns={columns} rows={followups} filters={filters}
      searchKeys={['customer']} searchPlaceholder="Search customer..."
      panelTitle="Activity Log"
    />
  )
}