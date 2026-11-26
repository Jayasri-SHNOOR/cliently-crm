import { Briefcase, TrendingUp, UserX } from 'lucide-react'
import TablePage from '../../../shared/ui/TablePage'
import StatusBadge from '../../../shared/ui/StatusBadge'
import { inr } from '../../../shared/ui/format'
import { deals, executives } from '../services/mockData'

const columns = [
  { key: 'customer', label: 'Customer' },
  { key: 'value', label: 'Deal Value', render: (r) => inr(r.value) },
  { key: 'executive', label: 'Executive' },
  { key: 'stage', label: 'Stage', render: (r) => <StatusBadge status={r.stage} /> },
  { key: 'closing', label: 'Expected Closing' },
]

const filters = [
  { key: 'stage', label: 'Stages', options: ['Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'] },
  { key: 'executive', label: 'Executives', options: executives.map((e) => e.name) },
]

export default function Deals() {
  const open = deals.filter((d) => !['Won', 'Lost'].includes(d.stage))
  const wonValue = deals.filter((d) => d.stage === 'Won').reduce((s, d) => s + d.value, 0)
  return (
    <TablePage
      title="Deals Management" subtitle="Monitor negotiations and deal closures"
      kpis={[
        { label: 'Open Deals', value: open.length, icon: Briefcase },
        { label: 'Open Deal Value', value: inr(open.reduce((s, d) => s + d.value, 0)), icon: Briefcase },
        { label: 'Won Value', value: inr(wonValue), icon: TrendingUp },
        { label: 'Lost Deals', value: deals.filter((d) => d.stage === 'Lost').length, icon: UserX },
      ]}
      columns={columns} rows={deals} filters={filters}
      searchKeys={['customer']} searchPlaceholder="Search customer..."
      panelTitle="Deal Pipeline"
    />
  )
}