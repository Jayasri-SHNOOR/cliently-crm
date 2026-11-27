import { FileText, ClipboardCheck, CalendarClock, IndianRupee } from 'lucide-react'
import TablePage from '../../../shared/ui/TablePage'
import StatusBadge from '../../../shared/ui/StatusBadge'
import PageState from '../../../shared/ui/PageState'
import { inr } from '../../../shared/ui/format'
import { formatDate, getQuotations } from '../services/managerApi'
import useLoad from '../services/useLoad'

const columns = [
  { key: 'number', label: 'Quotation No.' },
  { key: 'customer', label: 'Customer' },
  { key: 'executive', label: 'Executive' },
  { key: 'amount', label: 'Amount', render: (r) => inr(r.amount) },
  { key: 'date', label: 'Date' },
  { key: 'validUntil', label: 'Valid Until' },
  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
]

export default function Quotations() {
  const { data, loading, error, reload } = useLoad(getQuotations)

  if (loading || error) return <PageState loading={loading} error={error} onRetry={reload} />

  const summary = data.summary || {}
  const rows = (data.quotations || []).map((q) => ({
    id: String(q.id),
    number: q.number,
    customer: q.customer || '—',
    executive: q.executive || '—',
    amount: q.amount || 0,
    date: formatDate(q.createdAt),
    validUntil: formatDate(q.validUntil),
    status: q.status,
  }))

  return (
    <TablePage
      title="Quotations" subtitle="Track sent, accepted and expired quotations"
      kpis={[
        { label: 'Total', value: summary.total ?? 0, icon: FileText },
        { label: 'Awaiting Response', value: summary.awaiting ?? 0, icon: CalendarClock },
        { label: 'Accepted', value: summary.accepted ?? 0, icon: ClipboardCheck },
        { label: 'Accepted Value', value: inr(summary.acceptedValue), icon: IndianRupee },
      ]}
      columns={columns} rows={rows}
      filters={[
        { key: 'status', label: 'Status', options: ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'] },
        { key: 'executive', label: 'Executives', options: [...new Set(rows.map((r) => r.executive))] },
      ]}
      searchKeys={['number', 'customer']} searchPlaceholder="Search quotation or customer..."
      panelTitle="All Quotations"
    />
  )
}