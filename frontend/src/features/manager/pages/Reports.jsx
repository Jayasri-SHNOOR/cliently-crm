import { useState } from 'react'
import { IndianRupee, TrendingUp, Briefcase, Users } from 'lucide-react'
import PageHeader from '../../../shared/ui/PageHeader'
import KpiCard from '../../../shared/ui/KpiCard'
import Panel from '../../../shared/ui/Panel'
import BarChart from '../../../shared/ui/BarChart'
import DataTable from '../../../shared/ui/DataTable'
import PageState from '../../../shared/ui/PageState'
import { inr } from '../../../shared/ui/format'
import '../../../shared/ui/ui.css'
import useFetch from '../../../lib/useFetch'
import { getReports } from '../services/managerApi'

const execColumns = [
  { key: 'name', label: 'Executive' },
  { key: 'won', label: 'Won' },
  { key: 'lost', label: 'Lost' },
  { key: 'open', label: 'Open' },
  { key: 'wonValue', label: 'Sales Value', render: (r) => inr(r.wonValue) },
]

export default function Reports() {
  const [months, setMonths] = useState(6)
  const { data, loading, error, reload } = useFetch(() => getReports({ months }), [months])

  if (loading || error) return <PageState loading={loading} error={error} onRetry={reload} />

  const { totals, monthlySales, dealsByExecutive, leadFunnel, leadSources } = data

  return (
    <main className="ui-page">
      <PageHeader
        title="Sales & Financial Reports"
        subtitle="Analyze sales results and team productivity"
        actions={
          <select className="ui-select" value={months} onChange={(e) => setMonths(Number(e.target.value))}>
            <option value={3}>Last 3 months</option>
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
          </select>
        }
      />

      <section className="ui-kpis">
        <KpiCard label="Won Value" value={inr(totals.wonValue)} icon={IndianRupee} />
        <KpiCard label="Deals Won" value={totals.wonDeals} icon={Briefcase} />
        <KpiCard label="Win Rate" value={`${totals.winRate}%`} icon={TrendingUp} />
        <KpiCard label="Avg Deal Value" value={inr(totals.avgDealValue)} icon={IndianRupee} />
        <KpiCard label="Total Leads" value={totals.totalLeads} icon={Users} />
      </section>

      <section className="ui-grid-2">
        <Panel title="Monthly Sales" subtitle="Won deal value (₹ lakh)">
          <BarChart items={monthlySales} format={(v) => `${v}L`} />
        </Panel>
        <Panel title="Lead Funnel" subtitle="Leads by stage">
          <BarChart items={leadFunnel.map((f) => ({ label: f.status.slice(0, 5), value: f.count }))} />
        </Panel>
      </section>

      <section className="ui-grid-2">
        <Panel title="Deals by Executive">
          <DataTable columns={execColumns} rows={dealsByExecutive.map((e) => ({ ...e, id: e.name }))} empty="No assigned deals yet." />
        </Panel>
        <Panel title="Lead Sources">
          <BarChart items={leadSources.map((s) => ({ label: s.source, value: s.count }))} />
        </Panel>
      </section>
    </main>
  )
}