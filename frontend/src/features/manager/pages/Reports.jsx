import PageHeader from '../../../shared/ui/PageHeader'
import Panel from '../../../shared/ui/Panel'
import BarChart from '../../../shared/ui/BarChart'
import KpiCard from '../../../shared/ui/KpiCard'
import { inr } from '../../../shared/ui/format'
import { IndianRupee, Wallet, Receipt } from 'lucide-react'
import '../../../shared/ui/ui.css'
import { monthlySales, executives, invoices } from '../services/mockData'

export default function Reports() {
  const total = invoices.reduce((s, i) => s + i.amount, 0)
  const collected = invoices.reduce((s, i) => s + i.paid, 0)
  return (
    <main className="ui-page">
      <PageHeader title="Sales & Financial Reports" subtitle="Analyze sales results and financial summaries" />

      <section className="ui-kpis">
        <KpiCard label="Total Sales" value={inr(total)} icon={IndianRupee} />
        <KpiCard label="Collected" value={inr(collected)} icon={Wallet} />
        <KpiCard label="Outstanding" value={inr(total - collected)} icon={Receipt} />
      </section>

      <section className="ui-grid-2">
        <Panel title="Monthly Sales" subtitle="₹ lakh">
          <BarChart items={monthlySales} format={(v) => `${v}L`} />
        </Panel>
        <Panel title="Deals Won by Executive">
          <BarChart items={executives.map((e) => ({ label: e.name, value: e.won }))} />
        </Panel>
      </section>
    </main>
  )
}