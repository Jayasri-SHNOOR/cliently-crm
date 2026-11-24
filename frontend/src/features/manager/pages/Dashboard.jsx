import { useEffect, useState } from 'react'
import {
  Users,
  UserX,
  UserCheck,
  CalendarClock,
  Briefcase,
  TrendingUp
} from 'lucide-react'
import KpiCard from '../../../shared/ui/KpiCard'
import PageHeader from '../../../shared/ui/PageHeader'
import Panel from '../../../shared/ui/Panel'
import BarChart from '../../../shared/ui/BarChart'
import StatusBadge from '../../../shared/ui/StatusBadge'
import '../../../shared/ui/ui.css'
import { getDashboard } from '../services/managerApi'

export default function Dashboard({ onNavigate }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      try {
        setLoading(true)
        setError('')

        const result = await getDashboard()

        if (active) setData(result)
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
            'Failed to load dashboard data.'
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadDashboard()

    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return <main className="ui-page">Loading dashboard...</main>
  }

  if (error || !data) {
    return (
      <main className="ui-page">
        <PageHeader
          title="Hi, Manager"
          subtitle="Here's what your team is doing today"
        />
        <p role="alert">{error || 'Dashboard data unavailable.'}</p>
      </main>
    )
  }

  const stats = data.stats || {}
  const unassigned = data.needsAttention?.unassigned || []
  const overdue = data.needsAttention?.overdue || []
  const monthlySales = data.monthlySales || []

  return (
    <main className="ui-page">
      <PageHeader
        title="Hi, Manager"
        subtitle="Here's what your team is doing today"
      />

      <section className="ui-kpis">
        <KpiCard
          label="Total Leads"
          value={stats.totalLeads ?? 0}
          icon={Users}
        />
        <KpiCard
          label="Assigned Leads"
          value={stats.assignedLeads ?? 0}
          icon={UserCheck}
        />
        <KpiCard
          label="Pending Follow-ups"
          value={stats.pendingFollowups ?? 0}
          icon={CalendarClock}
        />
        <KpiCard
          label="Active Deals"
          value={stats.activeDeals ?? 0}
          icon={Briefcase}
        />
        <KpiCard
          label="Won Deals"
          value={stats.wonDeals ?? 0}
          icon={TrendingUp}
        />
        <KpiCard
          label="Lost Deals"
          value={stats.lostDeals ?? 0}
          icon={UserX}
        />
      </section>

      <section className="ui-grid-2">
        <Panel
          title="Sales Performance"
          subtitle="Monthly sales (₹ lakh)"
        >
          <BarChart
            items={monthlySales}
            format={(value) => `${value}L`}
          />
        </Panel>

        <Panel
          title="Needs Attention"
          subtitle={`${stats.unassignedLeads ?? 0} unassigned leads · ${stats.overdueFollowups ?? 0} overdue follow-ups`}
          action={
            <button
              className="ui-btn ui-btn--ghost"
              onClick={() => onNavigate?.('assignment')}
            >
              Assign leads
            </button>
          }
        >
          {unassigned.map((lead) => (
            <div className="ui-list-item" key={String(lead.id)}>
              <div>
                <strong>{lead.company || lead.name}</strong>
                <span>
                  {lead.product || 'General enquiry'}
                </span>
              </div>
              <StatusBadge status="Unassigned" />
            </div>
          ))}

          {overdue.map((lead) => (
            <div
              className="ui-list-item"
              key={`overdue-${String(lead.id)}`}
            >
              <div>
                <strong>{lead.company || lead.name}</strong>
                <span>
                  Follow-up due:{' '}
                  {lead.nextFollowUp
                    ? new Date(lead.nextFollowUp).toLocaleDateString()
                    : 'Date unavailable'}
                  {' · '}
                  {lead.executive || 'Unassigned'}
                </span>
              </div>
              <StatusBadge status="Overdue" />
            </div>
          ))}

          {unassigned.length === 0 && overdue.length === 0 && (
            <p>No leads need attention right now.</p>
          )}
        </Panel>
      </section>
    </main>
  )
}
