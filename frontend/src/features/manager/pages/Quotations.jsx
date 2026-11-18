import { FileText, ClipboardCheck, CalendarClock } from 'lucide-react'
import TablePage from '../../../shared/ui/TablePage'
import StatusBadge from '../../../shared/ui/StatusBadge'
import { inr } from '../../../shared/ui/format'
import { quotations } from '../services/mockData'

const columns = [
  { key: 'number', label: 'Quotation No.' },
  { key: 'customer', label: 'Customer' },
  { key: 'amount', label: 'Amount', render: (r) => inr(r.amount) },
  { key: 'date', label: 'Date' },
  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
]

export default function Quotations() {
  const n = (s) => quotations.filter((q) => q.status === s).length
  return (
    <TablePage
      title="Quotations" subtitle="Track sent, accepted and pending quotations"
      kpis={[
        { label: 'Total', value: quotations.length, icon: FileText },
        { label: 'Awaiting Response', value: n('Sent') + n('Pending'), icon: CalendarClock },
        { label: 'Accepted', value: n('Accepted'), icon: ClipboardCheck },
      ]}
      columns={columns} rows={quotations}
      filters={[{ key: 'status', label: 'Status', options: ['Pending', 'Sent', 'Accepted', 'Rejected', 'Expired'] }]}
      searchKeys={['number', 'customer']} searchPlaceholder="Search quotation or customer..."
      panelTitle="All Quotations"
    />
  )
}