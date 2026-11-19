import { Users, UserX, UserCheck, CircleSlash } from 'lucide-react'
import TablePage from '../../../shared/ui/TablePage'
import StatusBadge from '../../../shared/ui/StatusBadge'
import { leads, executives } from '../services/mockData'

const columns = [
  { key: 'customer', label: 'Customer' },
  { key: 'product', label: 'Product' },
  { key: 'qty', label: 'Qty' },
  { key: 'source', label: 'Source' },
  { key: 'priority', label: 'Priority', render: (r) => <StatusBadge status={r.priority} /> },
  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  { key: 'executive', label: 'Executive', render: (r) => (r.executive === 'Unassigned' ? <StatusBadge status="Unassigned" /> : r.executive) },
]

const filters = [
  { key: 'status', label: 'Status', options: ['New', 'Contacted', 'Qualified', 'Unqualified'] },
  { key: 'priority', label: 'Priority', options: ['High', 'Medium', 'Low'] },
  { key: 'executive', label: 'Executives', options: ['Unassigned', ...executives.map((e) => e.name)] },
]

export default function LeadManagement() {
  const count = (s) => leads.filter((l) => l.status === s).length
  return (
    <TablePage
      title="Lead Management" subtitle="View and monitor customer enquiries"
      kpis={[
        { label: 'Total Leads', value: leads.length, icon: Users },
        { label: 'New', value: count('New'), icon: UserX },
        { label: 'Qualified', value: count('Qualified'), icon: UserCheck },
        { label: 'Unqualified', value: count('Unqualified'), icon: CircleSlash },
      ]}
      columns={columns} rows={leads} filters={filters}
      searchKeys={['customer', 'product']} searchPlaceholder="Search customer or product..."
      panelTitle="All Enquiries"
    />
  )
}