import { TrendingUp, Briefcase, FileText } from 'lucide-react'
import TablePage from '../../../shared/ui/TablePage'
import PageState from '../../../shared/ui/PageState'
import { inr } from '../../../shared/ui/format'
import { getQuotations, getTeam } from '../services/managerApi'
import useLoad from '../services/useLoad'

const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '0%')

function loadPerformance() {
  return Promise.all([getTeam(), getQuotations()]).then(([team, quotes]) => ({
    team: team.team || [],
    quotations: quotes.quotations || [],
  }))
}

const columns = [
  { key: 'name', label: 'Executive' },
  { key: 'leads', label: 'Leads Assigned' },
  { key: 'wonLeads', label: 'Leads Won' },
  { key: 'conv', label: 'Conversion', render: (r) => `${r.conversionRate}%` },
  { key: 'wonDeals', label: 'Deals Won' },
  { key: 'quote', label: 'Quotation Success', render: (r) => `${pct(r.accepted, r.quotes)} (${r.accepted}/${r.quotes})` },
  { key: 'salesValue', label: 'Sales Value', render: (r) => inr(r.salesValue) },
]

export default function TeamPerformance() {
  const { data, loading, error, reload } = useLoad(loadPerformance)

  if (loading || error) return <PageState loading={loading} error={error} onRetry={reload} />

  const quotesBy = {}
  for (const q of data.quotations) {
    const slot = (quotesBy[q.executive] ||= { quotes: 0, accepted: 0 })
    slot.quotes += 1
    if (q.status === 'Accepted') slot.accepted += 1
  }

  const rows = data.team.map((m) => ({
    id: String(m.id),
    name: m.name,
    leads: m.assignedLeads || 0,
    wonLeads: m.wonLeads || 0,
    conversionRate: m.conversionRate || 0,
    wonDeals: m.wonDeals || 0,
    salesValue: m.wonValue || 0,
    quotes: quotesBy[m.name]?.quotes || 0,
    accepted: quotesBy[m.name]?.accepted || 0,
  }))

  const totalLeads = rows.reduce((s, r) => s + r.leads, 0)
  const totalWon = rows.reduce((s, r) => s + r.wonLeads, 0)

  return (
    <TablePage
      title="Team Performance" subtitle="Evaluate sales executive performance"
      kpis={[
        { label: 'Team Conversion', value: pct(totalWon, totalLeads), icon: TrendingUp },
        { label: 'Team Sales Value', value: inr(rows.reduce((s, r) => s + r.salesValue, 0)), icon: Briefcase },
        { label: 'Quotations Accepted', value: rows.reduce((s, r) => s + r.accepted, 0), icon: FileText },
      ]}
      columns={columns} rows={rows}
      filters={[{ key: 'name', label: 'Executives', options: rows.map((r) => r.name) }]}
      panelTitle="Executive Comparison"
    />
  )
}