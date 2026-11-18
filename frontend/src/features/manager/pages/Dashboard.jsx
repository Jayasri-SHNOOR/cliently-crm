import { Users, UserX, UserCheck, CalendarClock, Briefcase, TrendingUp } from 'lucide-react'
import KpiCard from '../../../shared/ui/KpiCard'
import PageHeader from '../../../shared/ui/PageHeader'
import Panel from '../../../shared/ui/Panel'
import BarChart from '../../../shared/ui/BarChart'
import StatusBadge from '../../../shared/ui/StatusBadge'
import '../../../shared/ui/ui.css'
import { leads, followups, deals, monthlySales } from '../services/mockData'

export default function Dashboard({ onNavigate }) {
  const unassigned = leads.filter((l) => l.executive === 'Unassigned')
  const pending = followups.filter((f) => f.status !== 'Completed')
  const overdue = followups.filter((f) => f.status === 'Overdue')
  const won = deals.filter((d) => d.stage === 'Won').length
  const lost = deals.filter((d) => d.stage === 'Lost').length
  const active = deals.length - won - lost

  return (
    <main className="ui-page">
      <PageHeader title="Hi, Manager" subtitle="Here's what your team is doing today" />

      <section className="ui-kpis">
        <KpiCard label="Total Leads" value={leads.length} icon={Users} />
        <KpiCard label="Assigned Leads" value={leads.length - unassigned.length} icon={UserCheck} />
        <KpiCard label="Pending Follow-ups" value={pending.length} icon={CalendarClock} />
        <KpiCard label="Active Deals" value={active} icon={Briefcase} />
        <KpiCard label="Won Deals" value={won} icon={TrendingUp} />
        <KpiCard label="Lost Deals" value={lost} icon={UserX} />
      </section>

      <section className="ui-grid-2">
        <Panel title="Sales Performance" subtitle="Monthly sales (₹ lakh)">
          <BarChart items={monthlySales} format={(v) => `${v}L`} />
        </Panel>

        <Panel
          title="Needs Attention"
          subtitle={`${unassigned.length} unassigned leads · ${overdue.length} overdue follow-ups`}
          action={<button className="ui-btn ui-btn--ghost" onClick={() => onNavigate('assignment')}>Assign leads</button>}
        >
          {unassigned.map((l) => (
            <div className="ui-list-item" key={`l${l.id}`}>
              <div><strong>{l.customer}</strong><span>{l.product} · {l.qty} pcs</span></div>
              <StatusBadge status="Unassigned" />
            </div>
          ))}
          {overdue.map((f) => (
            <div className="ui-list-item" key={`f${f.id}`}>
              <div><strong>{f.customer}</strong><span>{f.type} due {f.due} · {f.executive}</span></div>
              <StatusBadge status="Overdue" />
            </div>
          ))}
        </Panel>
      </section>
    </main>
  )
}