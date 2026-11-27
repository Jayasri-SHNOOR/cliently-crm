import { UserRound, UserCheck, Users } from 'lucide-react'
import TablePage from '../../../shared/ui/TablePage'
import StatusBadge from '../../../shared/ui/StatusBadge'
import PageState from '../../../shared/ui/PageState'
import { getTeam } from '../services/managerApi'
import useLoad from '../services/useLoad'

export default function TeamMembers() {
  const { data, loading, error, reload } = useLoad(getTeam)

  if (loading || error) return <PageState loading={loading} error={error} onRetry={reload} />

  const rows = (data.team || []).map((m) => ({
    id: String(m.id),
    name: m.name,
    email: m.email || '—',
    phone: m.phone || '—',
    status: m.status || 'Active',
    leads: m.activeLeads || 0,
    assigned: m.assignedLeads || 0,
    deals: m.openDeals || 0,
  }))
  const maxLeads = Math.max(1, ...rows.map((r) => r.leads))

  const columns = [
    { key: 'name', label: 'Executive' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'leads', label: 'Active Leads' },
    { key: 'assigned', label: 'Total Leads' },
    { key: 'deals', label: 'Open Deals' },
    {
      key: 'load', label: 'Workload',
      render: (r) => (
        <div className="ui-progress"><div className="ui-progress__fill" style={{ width: `${(r.leads / maxLeads) * 100}%` }} /></div>
      ),
    },
  ]

  return (
    <TablePage
      title="Team Members" subtitle="Monitor team workload and activity"
      kpis={[
        { label: 'Team Size', value: rows.length, icon: UserRound },
        { label: 'Active', value: rows.filter((r) => r.status === 'Active').length, icon: UserCheck },
        { label: 'Total Active Leads', value: rows.reduce((s, r) => s + r.leads, 0), icon: Users },
      ]}
      columns={columns} rows={rows}
      filters={[{ key: 'status', label: 'Status', options: ['Active', 'Inactive'] }]}
      searchKeys={['name', 'email']} searchPlaceholder="Search executive..."
      panelTitle="Sales Executives"
    />
  )
}