import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle, ArrowRight, BookOpen, Boxes, CheckCircle2,
  ClipboardList, Clock3, LifeBuoy, RefreshCw, ShieldAlert,
} from "lucide-react";
import { opsApi } from "../services/opsApi";
import "./Dashboard.css";

const MOCK_MODE = import.meta.env.VITE_OPS_MOCK === "true";
const ACTIVE_TICKET_STATUSES = ["Open", "In Progress", "Waiting on Customer"];
const ACTIVE_ORDER_STATUSES = ["Planned", "Draft", "Scheduled", "In Progress", "On Hold"];

function extractRows(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.data?.data)) return result.data.data;
  return [];
}

function extractTotal(result, rows) {
  return result?.pagination?.total ?? result?.data?.pagination?.total ?? rows.length;
}

function dateText(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function ticketLabel(ticket) {
  const number = ticket.number;
  return number == null ? "Ticket" : `TCK-${String(number).padStart(4, "0")}`;
}

function orderLabel(order) {
  const number = order.number;
  return number == null ? "Work order" : `WO-${String(number).padStart(4, "0")}`;
}

function statusClass(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function sum(...values) {
  return values.reduce((total, value) => total + (Number(value) || 0), 0);
}

function hoursText(value) {
  return value == null ? "—" : `${value} h`;
}

function fromApi(summary) {
  const tickets = summary.tickets || {};
  const workOrders = summary.workOrders || {};
  const assets = summary.assets || {};
  const knowledgeBase = summary.knowledgeBase || {};

  return {
    openTickets: sum(tickets.open, tickets.inProgress, tickets.waitingOnCustomer),
    urgentTickets: tickets.urgentOpen ?? null,
    resolvedLast7Days: tickets.resolvedLast7Days ?? null,
    avgResolutionHours: tickets.avgResolutionHours ?? null,
    activeWorkOrders: sum(workOrders.planned, workOrders.inProgress, workOrders.onHold),
    overdueWorkOrders: workOrders.overdue ?? null,
    completedWorkOrders: workOrders.completedLast30Days ?? null,
    totalAssets: assets.total ?? null,
    lowStockAssets: assets.lowStock ?? null,
    publishedArticles: knowledgeBase.published ?? null,
    draftArticles: knowledgeBase.drafts ?? null,
    recentTickets: Array.isArray(summary.recentTickets) ? summary.recentTickets : [],
    upcomingWorkOrders: Array.isArray(summary.upcomingWorkOrders) ? summary.upcomingWorkOrders : [],
    lowStockItems: Array.isArray(summary.lowStockAssets) ? summary.lowStockAssets : [],
  };
}

async function fromMock() {
  const [ticketsResponse, ordersResponse, articlesResponse, assetsResponse] = await Promise.all([
    opsApi.listTickets({ page: 1, limit: 100, sort: "newest" }),
    opsApi.listWorkOrders({ page: 1, limit: 100, sort: "newest" }),
    opsApi.listArticles({ page: 1, limit: 100 }),
    opsApi.listAssets({ page: 1, limit: 100 }),
  ]);
  const tickets = extractRows(ticketsResponse);
  const orders = extractRows(ordersResponse);
  const articles = extractRows(articlesResponse);
  const assets = extractRows(assetsResponse);
  const isLow = (a) => a.lowStock ?? (a.status !== "Retired" && Number(a.quantity) <= Number(a.reorderLevel));
  const isActive = (o) => ACTIVE_ORDER_STATUSES.includes(o.status);
  const due = (o) => o.dueDate || o.scheduledEnd;

  return {
    openTickets: tickets.filter((t) => ACTIVE_TICKET_STATUSES.includes(t.status)).length,
    urgentTickets: tickets.filter((t) => ACTIVE_TICKET_STATUSES.includes(t.status) && t.priority === "Urgent").length,
    resolvedLast7Days: tickets.filter((t) => t.status === "Resolved").length,
    avgResolutionHours: null,
    activeWorkOrders: orders.filter(isActive).length,
    overdueWorkOrders: orders.filter((o) => isActive(o) && due(o) && new Date(due(o)) < new Date()).length,
    completedWorkOrders: orders.filter((o) => o.status === "Completed").length,
    totalAssets: extractTotal(assetsResponse, assets),
    lowStockAssets: assets.filter(isLow).length,
    publishedArticles: articles.filter((a) => a.status === "Published").length,
    draftArticles: articles.filter((a) => a.status === "Draft").length,
    recentTickets: tickets.slice(0, 5),
    upcomingWorkOrders: orders.filter((o) => isActive(o) && due(o)).sort((a, b) => new Date(due(a)) - new Date(due(b))).slice(0, 5),
    lowStockItems: assets.filter(isLow).slice(0, 5),
  };
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      if (MOCK_MODE) {
        setData(await fromMock());
      } else {
        const response = await opsApi.getDashboard();
        const summary = response?.data?.data ?? response?.data ?? {};
        setData(fromApi(summary));
      }
    } catch (err) {
      setError(err?.message || "Could not load the operations dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const stats = [
    { label: "Active Tickets", value: data?.openTickets, detail: "Open, in progress or waiting", icon: LifeBuoy, to: "/operations/tickets" },
    { label: "Urgent Tickets", value: data?.urgentTickets, detail: "Urgent tickets not yet resolved", icon: ShieldAlert, to: "/operations/tickets?sort=priority" },
    { label: "Active Work Orders", value: data?.activeWorkOrders, detail: "Not yet completed or cancelled", icon: ClipboardList, to: "/operations/work-orders" },
    { label: "Low Stock Assets", value: data?.lowStockAssets, detail: "At or below reorder level", icon: Boxes, to: "/operations/assets?lowStock=true" },
  ];

  const summaryItems = [
    { label: "Resolved (last 7 days)", value: data?.resolvedLast7Days },
    { label: "Avg Resolution (30 days)", value: hoursText(data?.avgResolutionHours) },
    { label: "Overdue Work Orders", value: data?.overdueWorkOrders },
    { label: "Completed Orders (30 days)", value: data?.completedWorkOrders },
    { label: "Published Articles", value: data?.publishedArticles },
    { label: "Total Assets", value: data?.totalAssets },
  ];

  return (
    <div className="ops-dashboard">
      <header className="ops-dashboard-heading">
        <div>
          <span className="ops-dashboard-eyebrow">OPERATIONS CENTER</span>
          <h1>Operations Overview</h1>
          <p>Manage customer support, work orders, knowledge and inventory from one place.</p>
        </div>
        <button type="button" className="ops-dashboard-refresh" onClick={() => loadDashboard(true)} disabled={loading || refreshing}>
          <RefreshCw size={16} className={refreshing ? "ops-spin" : ""} /> {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      {error && <div className="ops-dashboard-alert" role="alert"><AlertCircle size={18} /> <span>{error}</span><button type="button" onClick={() => loadDashboard()}>Try again</button></div>}

      {loading ? (
        <div className="ops-dashboard-loading" role="status">Loading operations dashboard…</div>
      ) : data && (
        <>
          <div className="ops-stats-grid">
            {stats.map(({ label, value, detail, icon: Icon, to }) => (
              <Link key={label} className="ops-stat-card" to={to}>
                <div className="ops-stat-card-top"><span>{label}</span><Icon size={21} /></div>
                <strong>{value == null ? "—" : value}</strong>
                <small>{detail}</small>
                <ArrowRight size={16} className="ops-stat-arrow" />
              </Link>
            ))}
          </div>

          <div className="ops-dashboard-quicklinks" aria-label="Quick navigation">
            <Link to="/operations/tickets"><LifeBuoy size={17} /> Support Tickets <ArrowRight size={15} /></Link>
            <Link to="/operations/work-orders"><ClipboardList size={17} /> Work Orders <ArrowRight size={15} /></Link>
            <Link to="/operations/knowledge-base"><BookOpen size={17} /> Knowledge Base <ArrowRight size={15} /></Link>
            <Link to="/operations/assets"><Boxes size={17} /> Inventory & Assets <ArrowRight size={15} /></Link>
          </div>

          <div className="ops-dashboard-sections">
            <section className="ops-dashboard-panel">
              <div className="ops-panel-heading"><div><h2>Recent Support Tickets</h2><p>Latest customer support requests</p></div><Link to="/operations/tickets">View all <ArrowRight size={15} /></Link></div>
              {data.recentTickets.length ? (
                <div className="ops-dashboard-table-wrap"><table className="ops-dashboard-table"><thead><tr><th>Ticket</th><th>Customer</th><th>Status</th><th>Priority</th></tr></thead><tbody>
                  {data.recentTickets.map((ticket, index) => <tr key={ticket._id ?? index}>
                    <td><Link to={`/operations/tickets/${ticket._id}`}><b>{ticketLabel(ticket)}</b><span>{ticket.subject || "Untitled ticket"}</span></Link></td>
                    <td>{ticket.customer?.name || "—"}</td>
                    <td><span className={`ops-dashboard-tag status-${statusClass(ticket.status)}`}>{ticket.status || "—"}</span></td>
                    <td><span className={`ops-dashboard-tag priority-${statusClass(ticket.priority)}`}>{ticket.priority || "—"}</span></td>
                  </tr>)}
                </tbody></table></div>
              ) : <div className="ops-dashboard-empty"><CheckCircle2 size={20} /> No recent tickets to display.</div>}
            </section>

            <section className="ops-dashboard-panel">
              <div className="ops-panel-heading"><div><h2>Upcoming Work Orders</h2><p>Active work orders by due date</p></div><Link to="/operations/work-orders">View all <ArrowRight size={15} /></Link></div>
              {data.upcomingWorkOrders.length ? <div className="ops-dashboard-item-list">{data.upcomingWorkOrders.map((order, index) => (
                <Link key={order._id ?? index} to={`/operations/work-orders/${order._id}`} className="ops-dashboard-item">
                  <span className="ops-dashboard-item-icon"><Clock3 size={18} /></span>
                  <span className="ops-dashboard-item-body">
                    <b>{orderLabel(order)} · {order.title || "Work order"}</b>
                    <small>Due {dateText(order.dueDate || order.scheduledEnd)} · {order.status === "Planned" ? "Scheduled" : order.status || "—"}{order.progress != null ? ` · ${order.progress}%` : ""}{order.overdue ? " · Overdue" : ""}</small>
                  </span>
                  <ArrowRight size={16} />
                </Link>
              ))}</div> : <div className="ops-dashboard-empty"><ClipboardList size={20} /> No upcoming work orders to display.</div>}
            </section>

            <section className="ops-dashboard-panel">
              <div className="ops-panel-heading"><div><h2>Low Stock Assets</h2><p>Inventory items requiring attention</p></div><Link to="/operations/assets?lowStock=true">View all <ArrowRight size={15} /></Link></div>
              {data.lowStockItems.length ? <div className="ops-dashboard-item-list">{data.lowStockItems.map((asset, index) => (
                <Link key={asset._id ?? index} to={`/operations/assets/${asset._id}`} className="ops-dashboard-item">
                  <span className="ops-dashboard-item-icon"><Boxes size={18} /></span>
                  <span className="ops-dashboard-item-body">
                    <b>{asset.name || "Asset"}</b>
                    <small>{asset.quantity ?? "—"} {asset.unit || "units"} remaining · Reorder level {asset.reorderLevel ?? "—"}</small>
                  </span>
                  <ArrowRight size={16} />
                </Link>
              ))}</div> : <div className="ops-dashboard-empty"><CheckCircle2 size={20} /> No low-stock items to display.</div>}
            </section>

            <section className="ops-dashboard-panel">
              <div className="ops-panel-heading"><div><h2>Operations Summary</h2><p>Support and delivery performance</p></div></div>
              <div className="ops-dashboard-summary">
                {summaryItems.map(({ label, value }) => (
                  <div key={label}><span>{label}</span><strong>{value == null ? "—" : value}</strong></div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}