import { TrendingUp, Briefcase } from 'lucide-react'
import TablePage from '../../../shared/ui/TablePage'
import { inr } from '../../../shared/ui/format'
import { executives } from '../services/mockData'

const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '0%')

const columns = [
  { key: 'name', label: 'Executive' },
  { key: 'leads', label: 'Leads Assigned' },
  { key: 'won', label: 'Deals Won' },
  { key: 'conv', label: 'Conversion', render: (r) => pct(r.won, r.leads) },
  { key: 'quote', label: 'Quotation Success', render: (r) => pct(r.accepted, r.quotes) },
  { key: 'salesValue', label: 'Sales Value', render: (r) => inr(r.salesValue) },
  {
    key: 'target', label: 'Target',
    render: (r) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="ui-progress" style={{ flex: 1 }}><div className="ui-progress__fill" style={{ width: `${r.target}%` }} /></div>
        <span>{r.target}%</span>
      </div>
    ),
  },
]

export default function TeamPerformance() {
  const totalWon = executives.reduce((s, e) => s + e.won, 0)
  const totalLeads = executives.reduce((s, e) => s + e.leads, 0)
  return (
    <TablePage
      title="Team Performance" subtitle="Evaluate sales executive performance"
      kpis={[
        { label: 'Team Conversion', value: pct(totalWon, totalLeads), icon: TrendingUp },
        { label: 'Team Sales Value', value: inr(executives.reduce((s, e) => s + e.salesValue, 0)), icon: Briefcase },
      ]}
      columns={columns} rows={executives}
      filters={[{ key: 'name', label: 'Executives', options: executives.map((e) => e.name) }]}
      panelTitle="Executive Comparison"
    />
  )
}