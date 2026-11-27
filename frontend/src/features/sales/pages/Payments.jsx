import { useState } from "react";
import { Wallet, Receipt, AlertTriangle } from "lucide-react";
import PageHeader from "../../../shared/ui/PageHeader";
import KpiCard from "../../../shared/ui/KpiCard";
import Panel from "../../../shared/ui/Panel";
import DataTable from "../../../shared/ui/DataTable";
import StatusBadge from "../../../shared/ui/StatusBadge";
import PageState from "../../../shared/ui/PageState";
import { inr } from "../../../shared/ui/format";
import "../../../shared/ui/ui.css";
import { formatDate, salesApi } from "../services/salesApi";
import useLoad from "../services/useLoad";

const paymentCols = [
  { key: "ref", label: "Reference" },
  { key: "customer", label: "Customer" },
  { key: "purpose", label: "For" },
  { key: "date", label: "Date", render: (r) => formatDate(r.date) },
  { key: "amount", label: "Amount", render: (r) => inr(r.amount) },
  { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
];

const outstandingCols = [
  { key: "requestNumber", label: "Request" },
  { key: "customer", label: "Customer" },
  { key: "serviceType", label: "Service" },
  { key: "amount", label: "Amount", render: (r) => inr(r.amount) },
  { key: "since", label: "Charged on", render: (r) => formatDate(r.since) },
];

export default function Payments() {
  const [tab, setTab] = useState("payments");
  const { data, loading, error, reload } = useLoad(salesApi.payments);

  if (loading || error) return <PageState loading={loading} error={error} onRetry={reload} />;

  const s = data.summary || {};
  const payments = (data.payments || []).map((p) => ({ ...p, id: String(p.id) }));
  const outstanding = (data.outstanding || []).map((o) => ({ ...o, id: String(o.id) }));

  return (
    <main className="ui-page">
      <PageHeader
        title="Payments" subtitle="Online payments from your customers"
        actions={<button className="ui-btn ui-btn--ghost" onClick={reload}>Refresh</button>}
      />
      <section className="ui-kpis">
        <KpiCard label="Received" value={inr(s.received)} icon={Wallet} />
        <KpiCard label="Payments Received" value={s.receivedCount ?? 0} icon={Receipt} />
        <KpiCard label="Unpaid Charges" value={`${inr(s.outstanding)} (${s.outstandingCount ?? 0})`} icon={AlertTriangle} />
        <KpiCard label="Failed Attempts" value={s.failedCount ?? 0} icon={AlertTriangle} />
      </section>
      <div className="ui-tabs">
        <button className={`ui-tab ${tab === "payments" ? "active" : ""}`} onClick={() => setTab("payments")}>Payments</button>
        <button className={`ui-tab ${tab === "outstanding" ? "active" : ""}`} onClick={() => setTab("outstanding")}>Unpaid service charges</button>
      </div>
      {tab === "payments" ? (
        <Panel title="Payments">
          <DataTable columns={paymentCols} rows={payments} empty="No payments from your customers yet." />
        </Panel>
      ) : (
        <Panel title="Unpaid service charges" subtitle="Customers pay these from the customer portal">
          <DataTable columns={outstandingCols} rows={outstanding} empty="No unpaid charges." />
        </Panel>
      )}
    </main>
  );
}