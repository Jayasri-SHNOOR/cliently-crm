import { useState } from 'react'
import { IndianRupee, Wallet, Receipt, CalendarClock, Users } from 'lucide-react'
import PageHeader from '../../../shared/ui/PageHeader'
import KpiCard from '../../../shared/ui/KpiCard'
import Panel from '../../../shared/ui/Panel'
import DataTable from '../../../shared/ui/DataTable'
import BarChart from '../../../shared/ui/BarChart'
import StatusBadge from '../../../shared/ui/StatusBadge'
import PageState from '../../../shared/ui/PageState'
import { inr } from '../../../shared/ui/format'
import '../../../shared/ui/ui.css'
import { formatDate, getFinance } from '../services/managerApi'
import useLoad from '../services/useLoad'

const TABS = [
  ['overview', 'Finance Overview'],
  ['invoices', 'Invoices'],
  ['payments', 'Payment Tracking'],
  ['outstanding', 'Outstanding Payments'],
  ['reports', 'Financial Reports'],
]

const invoiceCols = [
  { key: 'number', label: 'Invoice' },
  { key: 'customer', label: 'Customer' },
  { key: 'type', label: 'Type' },
  { key: 'date', label: 'Invoice Date', render: (r) => formatDate(r.date) },
  { key: 'due', label: 'Due Date', render: (r) => formatDate(r.due) },
  { key: 'amount', label: 'Amount', render: (r) => inr(r.amount) },
  { key: 'balance', label: 'Balance', render: (r) => inr(r.balance) },
  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
]

const paymentCols = [
  { key: 'ref', label: 'Reference' },
  { key: 'customer', label: 'Customer' },
  { key: 'purpose', label: 'For' },
  { key: 'date', label: 'Date', render: (r) => formatDate(r.date) },
  { key: 'mode', label: 'Mode' },
  { key: 'amount', label: 'Amount', render: (r) => inr(r.amount) },
  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
]

const outstandingCols = [
  { key: 'customer', label: 'Customer' },
  { key: 'reference', label: 'Reference' },
  { key: 'kind', label: 'Type' },
  { key: 'due', label: 'Due Date', render: (r) => formatDate(r.due) },
  { key: 'balance', label: 'Balance', render: (r) => inr(r.balance) },
  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
]

const withIds = (rows) => rows.map((r) => ({ ...r, id: String(r.id) }))

export default function Finance() {
  const [tab, setTab] = useState('overview')
  const { data, loading, error, reload } = useLoad(getFinance)

  if (loading || error) return <PageState loading={loading} error={error} onRetry={reload} />

  const { summary, monthlyCollections } = data
  const invoices = withIds(data.invoices || [])
  const payments = withIds(data.payments || [])
  const outstanding = withIds(data.outstanding || [])

  return (
    <main className="ui-page">
      <PageHeader
        title="Finance Management" subtitle="Payments received, invoices and outstanding amounts"
        actions={<button className="ui-btn ui-btn--ghost" onClick={reload}>Refresh</button>}
      />

      <div className="ui-tabs">
        {TABS.map(([id, label]) => (
          <button key={id} className={`ui-tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <section className="ui-kpis">
            <KpiCard label="Amount Collected" value={inr(summary.collected)} icon={Wallet} />
            <KpiCard label="Total Invoiced" value={inr(summary.invoiced)} icon={IndianRupee} />
            <KpiCard label="Pending Payments" value={inr(summary.pending)} icon={Receipt} />
            <KpiCard label="Overdue" value={inr(summary.overdue)} icon={CalendarClock} />
            <KpiCard label="Customers With Dues" value={summary.customersWithDues} icon={Users} />
          </section>
          <Panel title="Recent Payments">
            <DataTable columns={paymentCols} rows={payments.slice(0, 8)} empty="No payments received yet." />
          </Panel>
        </>
      )}

      {tab === 'invoices' && (
        <Panel title="Invoices">
          <DataTable columns={invoiceCols} rows={invoices} empty="No invoices yet." />
        </Panel>
      )}

      {tab === 'payments' && (
        <Panel title="Payments" subtitle="Online payments from customers (sales and service charges)">
          <DataTable columns={paymentCols} rows={payments} empty="No payments received yet." />
        </Panel>
      )}

      {tab === 'outstanding' && (
        <Panel title="Outstanding Payments" subtitle="Unpaid invoice balances and unpaid service charges">
          <DataTable columns={outstandingCols} rows={outstanding} empty="No outstanding payments." />
        </Panel>
      )}

      {tab === 'reports' && (
        <Panel title="Collections Trend" subtitle="Payments received per month (₹ lakh)">
          <BarChart items={monthlyCollections} format={(v) => `${v}L`} />
        </Panel>
      )}
    </main>
  )
}