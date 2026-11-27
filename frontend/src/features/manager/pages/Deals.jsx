import { Briefcase, TrendingUp, UserX } from 'lucide-react'
import TablePage from '../../../shared/ui/TablePage'
import StatusBadge from '../../../shared/ui/StatusBadge'
import PageState from '../../../shared/ui/PageState'
import { inr } from '../../../shared/ui/format'
import { formatDate, getDeals } from '../services/managerApi'
import useLoad from '../services/useLoad'

const columns = [
  { key: 'name', label: 'Deal' },
  { key: 'customer', label: 'Customer' },
  { key: 'product', label: 'Product' },
  { key: 'value', label: 'Deal Value', render: (r) => inr(r.value) },
  { key: 'executive', label: 'Executive' },
  {
    key: 'stage', label: 'Stage',
    render: (r) => (
      <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
        <StatusBadge status={r.stage} />
        {r.stalled && <StatusBadge status="Stalled" />}
      </span>
    ),
  },
  { key: 'closing', label: 'Expected Closing' },
]

export default function Deals() {
  const { data, loading, error, reload } = useLoad(getDeals)

  if (loading || error) return <PageState loading={loading} error={error} onRetry={reload} />

  const summary = data.summary || {}
  const rows = (data.deals || []).map((d) => ({
    id: String(d.id),
    name: d.name || '—',
    customer: d.customer || '—',
    product: d.product || '—',
    value: d.value || 0,
    executive: d.assignedTo || 'Unassigned',
    stage: d.status,
    stalled: d.stalled,
    closing: formatDate(d.expectedClose),
  }))
  const unique = (key) => [...new Set(rows.map((r) => r[key]).filter(Boolean))]

  return (
    <TablePage
      title="Deals Management" subtitle="Monitor negotiations and deal closures"
      kpis={[
        { label: 'Open Deals', value: summary.open ?? 0, icon: Briefcase },
        { label: 'Open Deal Value', value: inr(summary.openValue), icon: Briefcase },
        { label: 'Won Value', value: inr(summary.wonValue), icon: TrendingUp },
        { label: 'Lost Deals', value: summary.lost ?? 0, icon: UserX },
      ]}
      columns={columns} rows={rows}
      filters={[
        { key: 'stage', label: 'Stages', options: unique('stage') },
        { key: 'executive', label: 'Executives', options: unique('executive') },
      ]}
      searchKeys={['name', 'customer', 'product']} searchPlaceholder="Search deal, customer or product..."
      panelTitle="Deal Pipeline"
    />
  )
}