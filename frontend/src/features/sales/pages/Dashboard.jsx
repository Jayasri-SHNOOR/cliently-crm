import { Users, UserPlus, ContactRound, Wrench, CheckSquare, IndianRupee } from "lucide-react";
import KpiCard from "../../../shared/ui/KpiCard";
import PageHeader from "../../../shared/ui/PageHeader";
import Panel from "../../../shared/ui/Panel";
import StatusBadge from "../../../shared/ui/StatusBadge";
import PageState from "../../../shared/ui/PageState";
import { inr } from "../../../shared/ui/format";
import { useCurrentUser } from "../../../lib/useSession";
import { formatDate, formatDateTime, salesApi } from "../services/salesApi";
import useLoad from "../services/useLoad";

export default function Dashboard({ onNavigate }) {
  const user = useCurrentUser();
  const { data, loading, error, reload } = useLoad(salesApi.dashboard);

  if (loading || error) return <PageState loading={loading} error={error} onRetry={reload} />;

  const s = data.stats || {};
  const firstName = String(user?.name || "").split(" ")[0] || "there";

  return (
    <main className="ui-page">
      <PageHeader
        title={`Hi, ${firstName}`}
        subtitle="Your leads, customers and work for today"
        actions={<button className="ui-btn ui-btn--ghost" onClick={reload}>Refresh</button>}
      />

      {!data.linkedToEmployee && (
        <p className="ui-empty" role="alert">Your login is not linked to an employee record, so leads cannot be shown. Ask your Client Admin to link it.</p>
      )}

      <section className="ui-kpis">
        <KpiCard label="Open Leads" value={s.openLeads ?? 0} icon={Users} />
        <KpiCard label="New Leads (7 days)" value={s.newLeadsThisWeek ?? 0} icon={UserPlus} />
        <KpiCard label="My Customers" value={s.myCustomers ?? 0} icon={ContactRound} />
        <KpiCard label="Open Service Requests" value={s.openRequests ?? 0} icon={Wrench} />
        <KpiCard label="Pending Tasks" value={`${s.pendingTasks ?? 0}${s.overdueTasks ? ` (${s.overdueTasks} overdue)` : ""}`} icon={CheckSquare} />
        <KpiCard label="Unpaid Charges" value={inr(s.unpaidCharges)} icon={IndianRupee} />
      </section>

      <section className="ui-grid-2">
        <Panel
          title="Today's Tasks" subtitle="Due today, overdue or without a date"
          action={<button className="ui-btn ui-btn--ghost" onClick={() => onNavigate("tasks")}>All tasks</button>}
        >
          {data.todaysTasks.length === 0 && <p className="ui-empty">No tasks due. Nice work.</p>}
          {data.todaysTasks.map((t) => (
            <div className="ui-list-item" key={t.id}>
              <div><strong>{t.title}</strong><span>{t.dueDate ? `Due ${formatDate(t.dueDate)}` : "No due date"}</span></div>
              <StatusBadge status={t.overdue ? "Overdue" : t.priority} />
            </div>
          ))}
        </Panel>

        <Panel
          title="Upcoming Meetings" subtitle="Your next scheduled meetings"
          action={<button className="ui-btn ui-btn--ghost" onClick={() => onNavigate("calendar")}>Calendar</button>}
        >
          {data.upcomingMeetings.length === 0 && <p className="ui-empty">No upcoming meetings.</p>}
          {data.upcomingMeetings.map((m) => (
            <div className="ui-list-item" key={m.id}>
              <div><strong>{m.description}</strong><span>{m.customer || "No customer linked"}</span></div>
              <span>{formatDateTime(m.activityDate)}</span>
            </div>
          ))}
        </Panel>
      </section>

      <section className="ui-grid-2">
        <Panel
          title="Recent Leads" subtitle="Latest leads assigned to you"
          action={<button className="ui-btn ui-btn--ghost" onClick={() => onNavigate("leads")}>All leads</button>}
        >
          {data.recentLeads.length === 0 && <p className="ui-empty">No leads assigned yet.</p>}
          {data.recentLeads.map((l) => (
            <div className="ui-list-item" key={l.id}>
              <div><strong>{l.company || l.name}</strong><span>{l.product || "General enquiry"} · {formatDate(l.assignedAt)}</span></div>
              <StatusBadge status={l.status} />
            </div>
          ))}
        </Panel>

        <Panel
          title="Service Requests Waiting" subtitle={`${s.waitingRequests ?? 0} waiting for a staff assignment`}
          action={<button className="ui-btn ui-btn--ghost" onClick={() => onNavigate("service-requests")}>Assign staff</button>}
        >
          {data.waitingRequests.length === 0 && <p className="ui-empty">No requests waiting.</p>}
          {data.waitingRequests.map((r) => (
            <div className="ui-list-item" key={r.id}>
              <div><strong>{r.requestNumber} · {r.serviceType}</strong><span>{r.customer}{r.productName ? ` · ${r.productName}` : ""}</span></div>
              <span>{formatDate(r.createdAt)}</span>
            </div>
          ))}
        </Panel>
      </section>
    </main>
  );
}