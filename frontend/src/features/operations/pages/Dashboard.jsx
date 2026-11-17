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
const ACTIVE_ORDER_STATUSES = ["Draft", "Scheduled", "In Progress", "On Hold"];

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

function statusClass(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
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
      const dashboardResponse = await opsApi.getDashboard();
      const summary = dashboardResponse?.data?.data ?? dashboardResponse?.data ?? {};

      // Mock summary can be a static fixture. Derive accurate counts from
      // the same stores used by the list pages when mock mode is enabled.
      if (MOCK_MODE) {
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
        setData({
          totalTickets: extractTotal(ticketsResponse, tickets),
          openTickets: tickets.filter(t => ACTIVE_TICKET_STATUSES.includes(t.status)).length,
          urgentTickets: tickets.filter(t => ACTIVE_TICKET_STATUSES.includes(t.status) && ["High", "Urgent"].includes(t.priority)).length,
          unassignedTickets: tickets.filter(t => ACTIVE_TICKET_STATUSES.includes(t.status) && !t.assignedTo).length,
          resolvedTickets: tickets.filter(t => t.status === "Resolved").length,
          totalWorkOrders: extractTotal(ordersResponse, orders),
          activeWorkOrders: orders.filter(o => ACTIVE_ORDER_STATUSES.includes(o.status)).length,
          overdueWorkOrders: orders.filter(o => ACTIVE_ORDER_STATUSES.includes(o.status) && o.scheduledEnd && new Date(o.scheduledEnd) < new Date()).length,
          totalArticles: extractTotal(articlesResponse, articles),
          totalAssets: extractTotal(assetsResponse, assets),
          lowStockAssets: assets.filter(a => a.lowStock ?? (a.status !== "Retired" && Number(a.quantity) <= Number(a.reorderLevel))).length,
          recentTickets: tickets.slice(0, 5),
          upcomingWorkOrders: orders.filter(o => ACTIVE_ORDER_STATUSES.includes(o.status) && o.scheduledStart).sort((a,b) => new Date(a.scheduledStart) - new Date(b.scheduledStart)).slice(0, 5),
          lowStockItems: assets.filter(a => a.lowStock ?? (a.status !== "Retired" && Number(a.quantity) <= Number(a.reorderLevel))).slice(0, 5),
        });
      } else {
        // Use only fields the backend actually supplies; never invent metrics.
        setData({
          ...summary,
          urgentTickets: summary.urgentTickets ?? null,
          unassignedTickets: summary.unassignedTickets ?? null,
          overdueWorkOrders: summary.overdueWorkOrders ?? null,
          recentTickets: summary.recentTickets ?? [],
          upcomingWorkOrders: summary.upcomingWorkOrders ?? summary.recentWorkOrders ?? [],
          lowStockItems: summary.lowStockItems ?? [],
        });
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
    { label: "High Priority", value: data?.urgentTickets, detail: "High and urgent active tickets", icon: ShieldAlert, to: "/operations/tickets?sort=priority" },
    { label: "Active Work Orders", value: data?.activeWorkOrders, detail: "Not yet completed or cancelled", icon: ClipboardList, to: "/operations/work-orders" },
    { label: "Low Stock Assets", value: data?.lowStockAssets, detail: "Items needing attention", icon: Boxes, to: "/operations/assets?lowStock=true" },
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
              {(data.recentTickets || []).length ? (
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
              <div className="ops-panel-heading"><div><h2>Upcoming Work Orders</h2><p>Scheduled operational activities</p></div><Link to="/operations/work-orders">View all <ArrowRight size={15} /></Link></div>
              {(data.upcomingWorkOrders || []).length ? <div className="ops-dashboard-item-list">{data.upcomingWorkOrders.map((order, index) => <Link key={order._id ?? index} to={`/operations/work-orders/${order._id}`} className="ops-dashboard-item"><span className="ops-dashboard-item-icon"><Clock3 size={18} /></span><span className="ops-dashboard-item-body"><b>{order.title || "Work order"}</b><small>{dateText(order.scheduledStart)} · {order.status || "—"}</small></span><ArrowRight size={16} /></Link>)}</div> : <div className="ops-dashboard-empty"><ClipboardList size={20} /> No upcoming work orders to display.</div>}
            </section>

            <section className="ops-dashboard-panel">
              <div className="ops-panel-heading"><div><h2>Low Stock Assets</h2><p>Inventory items requiring attention</p></div><Link to="/operations/assets?lowStock=true">View all <ArrowRight size={15} /></Link></div>
              {(data.lowStockItems || []).length ? <div className="ops-dashboard-item-list">{data.lowStockItems.map((asset, index) => <Link key={asset._id ?? index} to={`/operations/assets/${asset._id}`} className="ops-dashboard-item"><span className="ops-dashboard-item-icon"><Boxes size={18} /></span><span className="ops-dashboard-item-body"><b>{asset.name || "Asset"}</b><small>{asset.quantity ?? "—"} {asset.unit || "units"} remaining · Reorder level {asset.reorderLevel ?? "—"}</small></span><ArrowRight size={16} /></Link>)}</div> : <div className="ops-dashboard-empty"><CheckCircle2 size={20} /> No low-stock items to display.</div>}
            </section>

            <section className="ops-dashboard-panel">
              <div className="ops-panel-heading"><div><h2>Operations Summary</h2><p>Overview of available records</p></div></div>
              <div className="ops-dashboard-summary">
                <div><span>Total Tickets</span><strong>{data.totalTickets ?? "—"}</strong></div>
                <div><span>Resolved Tickets</span><strong>{data.resolvedTickets ?? "—"}</strong></div>
                <div><span>Total Work Orders</span><strong>{data.totalWorkOrders ?? "—"}</strong></div>
                <div><span>Knowledge Articles</span><strong>{data.totalArticles ?? "—"}</strong></div>
                <div><span>Total Assets</span><strong>{data.totalAssets ?? "—"}</strong></div>
                <div><span>Unassigned Tickets</span><strong>{data.unassignedTickets ?? "—"}</strong></div>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
