import { useEffect, useState } from "react";
import { RefreshCw, Send, UserPlus } from "lucide-react";
import { managerCare } from "../../customer-care/careApi";
import { InviteResult, Modal, Notice, StatusBadge } from "../../customer-care/CareParts";
import { errorText, formatDate } from "../../customer-care/careFormat";
import "../../customer-care/care.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function CreateFromEnquiry({ salesExecs, onClose, onCreated }) {
    const [leads, setLeads] = useState({ loading: true, items: [] });
    const [leadId, setLeadId] = useState("");
    const [salesExecId, setSalesExecId] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState(null);

    useEffect(() => {
        let active = true;
        managerCare
            .listLeads()
            .then((response) => {
                const items = (response.leads || []).filter((lead) => lead.status !== "Won" && lead.status !== "Lost");
                if (active) setLeads({ loading: false, items });
            })
            .catch((err) => {
                if (active) {
                    setLeads({ loading: false, items: [] });
                    setError(errorText(err, "Could not load enquiries."));
                }
            });
        return () => {
            active = false;
        };
    }, []);

    const lead = leads.items.find((item) => String(item.id) === leadId);
    const hasEmail = lead && EMAIL_PATTERN.test(String(lead.email || ""));

    const pickLead = (event) => {
        const next = leads.items.find((item) => String(item.id) === event.target.value);
        setLeadId(event.target.value);
        setError("");
        const match = next?.executive && salesExecs.find((exec) => exec.name === next.executive);
        setSalesExecId(match ? String(match.id) : "");
    };

    const submit = async (event) => {
        event.preventDefault();
        if (!lead) return setError("Choose an enquiry");
        if (!hasEmail) return setError("This enquiry has no valid email, so the login cannot be sent");
        if (!salesExecId) return setError("Choose a sales executive");
        setSaving(true);
        setError("");
        try {
            const data = await managerCare.createFromLead(lead.id, salesExecId);
            setResult(data);
            onCreated();
        } catch (err) {
            setError(errorText(err, "Could not create the customer."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal title="Create customer & send login" subtitle="Creates the customer from the enquiry and emails the login ID and activation link." onClose={onClose} wide>
            {result ? (
                <div className="cc-form">
                    <InviteResult result={result} />
                    <div className="cc-actions">
                        <button type="button" className="cc-btn cc-btn--primary" onClick={onClose}>Done</button>
                    </div>
                </div>
            ) : (
                <form className="cc-form" onSubmit={submit}>
                    <label>
                        Enquiry *
                        <select value={leadId} onChange={pickLead} disabled={saving || leads.loading}>
                            <option value="">{leads.loading ? "Loading enquiries..." : "Choose an enquiry"}</option>
                            {leads.items.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}{item.company ? ` · ${item.company}` : ""} · {item.status}
                                </option>
                            ))}
                        </select>
                    </label>

                    {lead && (
                        <div className="cc-info-grid">
                            <div><span>Email (login is sent here)</span><strong>{lead.email || "No email"}</strong></div>
                            <div><span>Phone</span><strong>{lead.phone || "—"}</strong></div>
                            <div><span>Product enquired</span><strong>{lead.product || "—"}</strong></div>
                            <div><span>Lead executive</span><strong>{lead.executive || "Unassigned"}</strong></div>
                        </div>
                    )}
                    {lead && !hasEmail && <Notice notice={{ type: "error", text: "This enquiry has no valid email address. Ask the customer for one first." }} />}

                    <label>
                        Sales executive *
                        <select value={salesExecId} onChange={(e) => setSalesExecId(e.target.value)} disabled={saving}>
                            <option value="">Choose a sales executive</option>
                            {salesExecs.map((exec) => (
                                <option key={exec.id} value={exec.id}>{exec.name} ({exec.email})</option>
                            ))}
                        </select>
                    </label>

                    {error && <Notice notice={{ type: "error", text: error }} />}
                    <div className="cc-actions">
                        <button type="button" className="cc-btn" onClick={onClose} disabled={saving}>Cancel</button>
                        <button type="submit" className="cc-btn cc-btn--primary" disabled={saving || !hasEmail}>
                            {saving ? "Creating..." : "Create & send login"}
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
}

function loadPage(unassigned) {
    return Promise.all([managerCare.listCustomers(unassigned), managerCare.listSalesExecs()]).then(([customers, execs]) => ({
        customers: customers.customers || [],
        salesExecs: execs.salesExecutives || [],
    }));
}

export default function CustomerCare() {
    const [unassigned, setUnassigned] = useState(false);
    const [search, setSearch] = useState("");
    const [reloadKey, setReloadKey] = useState(0);
    const [data, setData] = useState({ loading: true, error: "", customers: [], salesExecs: [] });
    const [creating, setCreating] = useState(false);
    const [busyId, setBusyId] = useState(null);
    const [notice, setNotice] = useState(null);
    const [invite, setInvite] = useState(null);

    useEffect(() => {
        let active = true;
        loadPage(unassigned)
            .then((result) => {
                if (active) setData({ loading: false, error: "", ...result });
            })
            .catch((err) => {
                if (active) setData({ loading: false, error: errorText(err, "Could not load customers."), customers: [], salesExecs: [] });
            });
        return () => {
            active = false;
        };
    }, [unassigned, reloadKey]);

    const reload = () => setReloadKey((key) => key + 1);

    const changeExec = async (customer, salesExecId) => {
        if (!salesExecId) return;
        setBusyId(customer.id);
        setNotice(null);
        try {
            const result = await managerCare.setSalesExec(customer.id, salesExecId);
            setNotice({ type: "success", text: result.message });
            reload();
        } catch (err) {
            setNotice({ type: "error", text: errorText(err, "Could not change the sales executive.") });
        } finally {
            setBusyId(null);
        }
    };

    const sendLogin = async (customer) => {
        setBusyId(customer.id);
        setNotice(null);
        try {
            setInvite(await managerCare.sendLogin(customer.id));
        } catch (err) {
            setNotice({ type: "error", text: errorText(err, "Could not send the login.") });
        } finally {
            setBusyId(null);
        }
    };

    const query = search.toLowerCase();
    const rows = data.customers.filter((c) =>
        [c.customerCode, c.name, c.phone, c.city, c.salesExecName].filter(Boolean).join(" ").toLowerCase().includes(query)
    );

    return (
        <div className="cc-page">
            <header className="cc-head">
                <div>
                    <h1>Customers</h1>
                    <p>Turn enquiries into customers, assign their sales executive and send portal logins.</p>
                </div>
                <div className="cc-head-actions">
                    <button type="button" className="cc-btn" onClick={reload} disabled={data.loading}><RefreshCw size={15} /> Refresh</button>
                    <button type="button" className="cc-btn cc-btn--primary" onClick={() => setCreating(true)} disabled={data.loading}>
                        <UserPlus size={15} /> Create customer & send login
                    </button>
                </div>
            </header>

            <Notice notice={notice} onClose={() => setNotice(null)} />

            <div className="cc-card">
                <div className="cc-toolbar">
                    <input className="cc-search" placeholder="Search code, name, phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    <label className="cc-check">
                        <input type="checkbox" checked={unassigned} onChange={(e) => setUnassigned(e.target.checked)} />
                        Without sales executive only
                    </label>
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
                                    <th>Phone</th>
                                    <th>City</th>
                                    <th>Status</th>
                                    <th>Sales executive</th>
                                    <th>Added</th>
                                    <th>Login</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((customer) => (
                                    <tr key={customer.id}>
                                        <td><strong>{customer.name}</strong><small>{customer.customerCode}</small></td>
                                        <td>{customer.phone || "—"}</td>
                                        <td>{customer.city || "—"}</td>
                                        <td><StatusBadge status={customer.status} /></td>
                                        <td>
                                            <select
                                                className="cc-select-inline"
                                                value={customer.salesExecId ? String(customer.salesExecId) : ""}
                                                onChange={(e) => changeExec(customer, e.target.value)}
                                                disabled={busyId === customer.id}
                                                aria-label={`Sales executive for ${customer.name}`}
                                            >
                                                <option value="" disabled>Assign sales executive</option>
                                                {customer.salesExecId && !data.salesExecs.some((e) => String(e.id) === String(customer.salesExecId)) && (
                                                    <option value={String(customer.salesExecId)}>{customer.salesExecName || "Current"}</option>
                                                )}
                                                {data.salesExecs.map((exec) => (
                                                    <option key={exec.id} value={String(exec.id)}>{exec.name}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>{formatDate(customer.createdAt)}</td>
                                        <td>
                                            <button type="button" className="cc-btn cc-btn--small" onClick={() => sendLogin(customer)} disabled={busyId === customer.id}>
                                                <Send size={13} /> Send login
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {creating && <CreateFromEnquiry salesExecs={data.salesExecs} onClose={() => setCreating(false)} onCreated={reload} />}

            {invite && (
                <Modal title="Login sent" onClose={() => setInvite(null)}>
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
