import { useState } from 'react'
import { IndianRupee, Wallet, Receipt, CalendarClock, Users } from 'lucide-react'
import PageHeader from '../../../shared/ui/PageHeader'
import KpiCard from '../../../shared/ui/KpiCard'
import Panel from '../../../shared/ui/Panel'
import DataTable from '../../../shared/ui/DataTable'
import BarChart from '../../../shared/ui/BarChart'
import StatusBadge from '../../../shared/ui/StatusBadge'
import { inr } from '../../../shared/ui/format'
import '../../../shared/ui/ui.css'
import { invoices, payments, monthlySales } from '../services/mockData'

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
  { key: 'date', label: 'Invoice Date' },
  { key: 'due', label: 'Due Date' },
  { key: 'amount', label: 'Amount', render: (r) => inr(r.amount) },
  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
]

const paymentCols = [
  { key: 'ref', label: 'Reference' },
  { key: 'invoice', label: 'Invoice' },
  { key: 'customer', label: 'Customer' },
  { key: 'date', label: 'Date' },
  { key: 'mode', label: 'Mode' },
  { key: 'amount', label: 'Amount', render: (r) => inr(r.amount) },
  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
]

const outstandingCols = [
  { key: 'customer', label: 'Customer' },
  { key: 'number', label: 'Invoice' },
  { key: 'due', label: 'Due Date' },
  { key: 'balance', label: 'Balance', render: (r) => inr(r.amount - r.paid) },
  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
]

export default function Finance() {
  const [tab, setTab] = useState('overview')

  const total = invoices.reduce((s, i) => s + i.amount, 0)
  const collected = invoices.reduce((s, i) => s + i.paid, 0)
  const unpaid = invoices.filter((i) => i.amount - i.paid > 0)
  const overdue = invoices.filter((i) => i.status === 'Overdue').reduce((s, i) => s + (i.amount - i.paid), 0)

  return (
    <main className="ui-page">
      <PageHeader title="Finance Management" subtitle="Revenue, invoices, payments and outstanding amounts" />

      <div className="ui-tabs">
        {TABS.map(([id, label]) => (
          <button key={id} className={`ui-tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <section className="ui-kpis">
            <KpiCard label="Total Sales" value={inr(total)} icon={IndianRupee} />
            <KpiCard label="Amount Collected" value={inr(collected)} icon={Wallet} />
            <KpiCard label="Pending Payments" value={inr(total - collected)} icon={Receipt} />
            <KpiCard label="Overdue" value={inr(overdue)} icon={CalendarClock} />
            <KpiCard label="Customers With Dues" value={new Set(unpaid.map((i) => i.customer)).size} icon={Users} />
          </section>
          <Panel title="Recent Invoices"><DataTable columns={invoiceCols} rows={invoices} /></Panel>
        </>
      )}

      {tab === 'invoices' && (
        <Panel title="Invoices" subtitle="Generated for confirmed orders"><DataTable columns={invoiceCols} rows={invoices} /></Panel>
      )}

      {tab === 'payments' && (
        <Panel title="Payments Received"><DataTable columns={paymentCols} rows={payments} /></Panel>
      )}

      {tab === 'outstanding' && (
        <Panel title="Outstanding Payments" subtitle="Customers with unpaid invoices — follow up with the sales team">
          <DataTable columns={outstandingCols} rows={unpaid} empty="No outstanding payments." />
        </Panel>
      )}

      {tab === 'reports' && (
        <Panel title="Revenue Trend" subtitle="Monthly sales (₹ lakh)">
          <BarChart items={monthlySales} format={(v) => `${v}L`} />
        </Panel>
      )}
    </main>
  )
}