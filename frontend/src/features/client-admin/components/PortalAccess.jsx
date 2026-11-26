import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { adminCare } from "../../customer-care/careApi";
import { InviteResult, Modal, Notice, PortalBadge } from "../../customer-care/CareParts";
import { errorText, formatDateTime } from "../../customer-care/careFormat";
import "../../customer-care/care.css";

const FILTERS = ["All", "Active", "Pending", "Disabled", "No login"];

function portalState(customer) {
    return customer.portal?.status || "No login";
}

export default function PortalAccess() {
    const [filter, setFilter] = useState("All");
    const [search, setSearch] = useState("");
    const [reloadKey, setReloadKey] = useState(0);
    const [data, setData] = useState({ loading: true, error: "", customers: [] });
    const [busyId, setBusyId] = useState(null);
    const [notice, setNotice] = useState(null);
    const [invite, setInvite] = useState(null);
    const [confirm, setConfirm] = useState(null);

    useEffect(() => {
        let active = true;
        adminCare
            .listCustomers()
            .then((result) => {
                if (active) setData({ loading: false, error: "", customers: result.customers || [] });
            })
            .catch((err) => {
                if (active) setData({ loading: false, error: errorText(err, "Could not load customers."), customers: [] });
            });
        return () => {
            active = false;
        };
    }, [reloadKey]);

    const reload = () => setReloadKey((key) => key + 1);

    const setAccess = async (customer, enabled) => {
        setConfirm(null);
        setBusyId(customer.id);
        setNotice(null);
        try {
            const result = await adminCare.setPortalAccess(customer.id, enabled);
            setNotice({ type: "success", text: result.message });
            reload();
        } catch (err) {
            setNotice({ type: "error", text: errorText(err, "Could not change portal access.") });
        } finally {
            setBusyId(null);
        }
    };

    const sendLink = async (customer) => {
        setBusyId(customer.id);
        setNotice(null);
        try {
            setInvite(await adminCare.sendLogin(customer.id));
            reload();
        } catch (err) {
            setNotice({ type: "error", text: errorText(err, "Could not send a new link.") });
        } finally {
            setBusyId(null);
        }
    };

    const query = search.toLowerCase();
    const rows = data.customers.filter(
        (c) =>
            (filter === "All" || portalState(c) === filter) &&
            [c.customerCode, c.name, c.phone, c.city, c.salesExecName, c.portal?.loginId].filter(Boolean).join(" ").toLowerCase().includes(query)
    );
    const count = (state) => data.customers.filter((c) => portalState(c) === state).length;

    return (
        <div className="cc-page">
            <header className="cc-head">
                <div>
                    <h1>Customer Portal Access</h1>
                    <p>See who can sign in to the customer portal. Disable access or send a new login link.</p>
                </div>
                <button type="button" className="cc-btn" onClick={reload} disabled={data.loading}><RefreshCw size={15} /> Refresh</button>
            </header>

            <Notice notice={notice} onClose={() => setNotice(null)} />

            <div className="cc-card">
                <div className="cc-toolbar">
                    <div className="cc-tabs">
                        {FILTERS.map((value) => (
                            <button key={value} type="button" className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>
                                {value}{value !== "All" ? ` (${count(value)})` : ""}
                            </button>
                        ))}
                    </div>
                    <input className="cc-search" placeholder="Search name, code, login ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                {data.loading ? (
                    <p className="cc-empty">Loading customers...</p>
                ) : data.error ? (
                    <div className="cc-empty">
                        <p role="alert">{data.error}</p>
                        <button type="button" className="cc-btn" onClick={reload}>Try again</button>
                    </div>
                ) : rows.length === 0 ? (
                    <p className="cc-empty">No customers found.</p>
                ) : (
                    <div className="cc-table-wrap">
                        <table className="cc-table">
                            <thead>
                                <tr>
                                    <th>Customer</th>
                                    <th>Sales executive</th>
                                    <th>Login ID</th>
                                    <th>Portal</th>
                                    <th>Last sign-in</th>
                                    <th>Open requests</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((customer) => {
                                    const status = customer.portal?.status;
                                    const busy = busyId === customer.id;
                                    return (
                                        <tr key={customer.id}>
                                            <td><strong>{customer.name}</strong><small>{customer.customerCode}{customer.city ? ` · ${customer.city}` : ""}</small></td>
                                            <td>{customer.salesExecName || <span className="cc-muted">Unassigned</span>}</td>
                                            <td>{customer.portal?.loginId || "—"}</td>
                                            <td><PortalBadge portal={customer.portal} /></td>
                                            <td>{customer.portal?.lastLoginAt ? formatDateTime(customer.portal.lastLoginAt) : "Never"}</td>
                                            <td>{customer.openRequests || 0}</td>
                                            <td>
                                                <div className="cc-row-actions">
                                                    {status && status !== "Disabled" && (
                                                        <button type="button" className="cc-btn cc-btn--small cc-btn--danger" onClick={() => setConfirm(customer)} disabled={busy}>
                                                            Disable
                                                        </button>
                                                    )}
                                                    {status === "Disabled" && (
                                                        <button type="button" className="cc-btn cc-btn--small cc-btn--primary" onClick={() => setAccess(customer, true)} disabled={busy}>
                                                            Enable
                                                        </button>
                                                    )}
                                                    {status !== "Disabled" && (
                                                        <button type="button" className="cc-btn cc-btn--small" onClick={() => sendLink(customer)} disabled={busy}>
                                                            {status === "Active" ? "Reset link" : "Send link"}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
                {!data.loading && !data.error && (
                    <p className="cc-muted" style={{ padding: "12px 18px" }}>
                        Showing {rows.length} of {data.customers.length} customers
                    </p>
                )}
            </div>

            {confirm && (
                <Modal title="Disable portal access?" subtitle={`${confirm.name} · ${confirm.portal?.loginId}`} onClose={() => setConfirm(null)}>
                    <div className="cc-form">
                        <p className="cc-muted">The customer is signed out everywhere and cannot sign in until you enable access again. Their products and requests are kept.</p>
                        <div className="cc-actions">
                            <button type="button" className="cc-btn" onClick={() => setConfirm(null)}>Cancel</button>
                            <button type="button" className="cc-btn cc-btn--primary" onClick={() => setAccess(confirm, false)}>Disable access</button>
                        </div>
                    </div>
                </Modal>
            )}

            {invite && (
                <Modal title="Login link sent" onClose={() => setInvite(null)}>
                    <div className="cc-form">
                        <InviteResult result={invite} />
                        <div className="cc-actions">
                            <button type="button" className="cc-btn cc-btn--primary" onClick={() => setInvite(null)}>Done</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
