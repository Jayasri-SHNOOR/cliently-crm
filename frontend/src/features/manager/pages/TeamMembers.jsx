import { UserRound, UserCheck, Users } from 'lucide-react'
import TablePage from '../../../shared/ui/TablePage'
import StatusBadge from '../../../shared/ui/StatusBadge'
import { executives } from '../services/mockData'

const columns = [
  { key: 'name', label: 'Executive' },
  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  { key: 'leads', label: 'Active Leads' },
  { key: 'deals', label: 'Open Deals' },
  { key: 'followups', label: 'Follow-ups' },
  {
    key: 'load', label: 'Workload',
    render: (r) => (
      <div className="ui-progress"><div className="ui-progress__fill" style={{ width: `${Math.min(r.leads / 30, 1) * 100}%` }} /></div>
    ),
  },
]

export default function TeamMembers() {
  const activeCount = executives.filter((e) => e.status === 'Active').length
  return (
    <TablePage
      title="Team Members" subtitle="Monitor team workload and activity"
      kpis={[
        { label: 'Team Size', value: executives.length, icon: UserRound },
        { label: 'Active', value: activeCount, icon: UserCheck },
        { label: 'Total Active Leads', value: executives.reduce((s, e) => s + e.leads, 0), icon: Users },
      ]}
      columns={columns} rows={executives}
      filters={[{ key: 'status', label: 'Status', options: ['Active', 'Inactive'] }]}
      searchKeys={['name']} searchPlaceholder="Search executive..."
      panelTitle="Sales Executives"
    />
  )
}