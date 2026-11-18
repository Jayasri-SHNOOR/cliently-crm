import { useState } from 'react'
import PageHeader from '../../../shared/ui/PageHeader'
import Panel from '../../../shared/ui/Panel'
import DataTable from '../../../shared/ui/DataTable'
import '../../../shared/ui/ui.css'
import { leads as seed, executives } from '../services/mockData'

const active = executives.filter((e) => e.status === 'Active')

export default function LeadAssignment() {
  const [rows, setRows] = useState(seed)
  const update = (id, patch) => setRows((cur) => cur.map((l) => (l.id === id ? { ...l, ...patch } : l)))

  const columns = [
    { key: 'customer', label: 'Customer' },
    { key: 'product', label: 'Product', render: (r) => `${r.product} (${r.qty})` },
    {
      key: 'priority', label: 'Priority',
      render: (r) => (
        <select className="ui-select" value={r.priority} onChange={(e) => update(r.id, { priority: e.target.value })}>
          {['High', 'Medium', 'Low'].map((p) => <option key={p}>{p}</option>)}
        </select>
      ),
    },
    {
      key: 'deadline', label: 'Follow-up by',
      render: (r) => <input type="date" className="ui-input" value={r.deadline} onChange={(e) => update(r.id, { deadline: e.target.value })} />,
    },
    {
      key: 'executive', label: 'Executive',
      render: (r) => (
        <select className="ui-select" value={r.executive === 'Unassigned' ? '' : r.executive} onChange={(e) => update(r.id, { executive: e.target.value })}>
          {r.executive === 'Unassigned' && <option value="" disabled>Assign to...</option>}
          {active.map((e) => <option key={e.id} value={e.name}>{e.name} ({e.leads} leads)</option>)}
        </select>
      ),
    },
  ]

  const unassigned = rows.filter((l) => l.executive === 'Unassigned')
  const assigned = rows.filter((l) => l.executive !== 'Unassigned')

  return (
    <main className="ui-page">
      <PageHeader title="Lead Assignment" subtitle="Assign leads to suitable Sales Executives" />
      <Panel title={`Unassigned Leads (${unassigned.length})`}>
        <DataTable columns={columns} rows={unassigned} empty="All leads are assigned." />
      </Panel>
      <Panel title="Assigned Leads" subtitle="Change the executive to reassign">
        <DataTable columns={columns} rows={assigned} />
      </Panel>
    </main>
  )
}