import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Plus, Search, Send } from "lucide-react";
import { salesCare } from "../../customer-care/careApi";
import { InviteResult, Modal, Notice, PortalBadge } from "../../customer-care/CareParts";
import { errorText, formatDate } from "../../customer-care/careFormat";

const EMPTY_FORM = { leadId: "", name: "", email: "", phone: "", company: "", address: "", city: "" };

function AddCustomerDialog({ onClose, onCreated }) {
    const [leads, setLeads] = useState([]);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState(null);

    useEffect(() => {
        let active = true;
        salesCare
            .listLeads()
            .then((response) => {
                const list = Array.isArray(response?.data) ? response.data : [];
                if (active) setLeads(list.filter((lead) => lead.status !== "Won" && lead.status !== "Lost"));
            })
            .catch(() => {
                if (active) setLeads([]);
            });
        return () => {
            active = false;
        };
    }, []);

    const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

    const pickLead = (event) => {
        const lead = leads.find((item) => item._id === event.target.value);
        setForm(
            lead
                ? { ...EMPTY_FORM, leadId: lead._id, name: lead.name || "", email: lead.email || "", phone: lead.phone || "", company: lead.company || "" }
                : EMPTY_FORM
        );
    };

    const submit = async (event) => {
        event.preventDefault();
        if (!form.name.trim()) {
            setError("Customer name is required");
            return;
        }
        setSaving(true);
        setError("");
        const body = Object.fromEntries(
            Object.entries(form)
                .map(([key, value]) => [key, value.trim()])
                .filter(([, value]) => value)
        );
        try {
            const data = await salesCare.createCustomer(body);
            setResult(data);
            onCreated();
        } catch (err) {
            setError(errorText(err, "Could not create the customer."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal title="Add customer" subtitle="The login ID and activation link are emailed to the customer." onClose={onClose} wide>
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
                        From one of my leads
                        <select value={form.leadId} onChange={pickLead} disabled={saving}>
                            <option value="">No lead, enter details below</option>
                            {leads.map((lead) => (
                                <option key={lead._id} value={lead._id}>
                                    {lead.name}{lead.company ? ` · ${lead.company}` : ""}{lead.email ? ` · ${lead.email}` : ""}
                                </option>
                            ))}
                        </select>
                    </label>
                    <div className="cc-form-grid">
                        <label>Name *<input name="name" value={form.name} onChange={change} maxLength={120} disabled={saving} /></label>
                        <label>Email<input name="email" type="email" value={form.email} onChange={change} maxLength={120} placeholder="Login details are sent here" disabled={saving} /></label>
                        <label>Phone<input name="phone" value={form.phone} onChange={change} maxLength={20} disabled={saving} /></label>
                        <label>Company<input name="company" value={form.company} onChange={change} maxLength={120} disabled={saving} /></label>
                        <label className="cc-full">Address<textarea name="address" rows={2} value={form.address} onChange={change} maxLength={300} disabled={saving} /></label>
                        <label>City<input name="city" value={form.city} onChange={change} maxLength={80} disabled={saving} /></label>
                    </div>
                    {error && <Notice notice={{ type: "error", text: error }} />}
                    <div className="cc-actions">
                        <button type="button" className="cc-btn" onClick={onClose} disabled={saving}>Cancel</button>
                        <button type="submit" className="cc-btn cc-btn--primary" disabled={saving}>{saving ? "Creating..." : "Create customer"}</button>
                    </div>
                </form>
            )}
        </Modal>
    );
}

function Customers() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [reloadKey, setReloadKey] = useState(0);
    const [data, setData] = useState({ loading: true, error: "", customers: [] });
    const [adding, setAdding] = useState(false);
    const [sendingId, setSendingId] = useState(null);
    const [invite, setInvite] = useState(null);
    const [notice, setNotice] = useState(null);

    useEffect(() => {
        let active = true;
        salesCare
            .listCustomers()
            .then((response) => {
                if (active) setData({ loading: false, error: "", customers: response.customers || [] });
            })
            .catch((err) => {
                if (active) setData({ loading: false, error: errorText(err, "Unable to load customers. Please try again."), customers: [] });
            });
        return () => {
            active = false;
        };
    }, [reloadKey]);

    const sendLogin = async (customer) => {
        setSendingId(customer.id);
        setNotice(null);
        try {
            setInvite(await salesCare.sendLogin(customer.id));
            setReloadKey((key) => key + 1);
        } catch (err) {
            setNotice({ type: "error", text: errorText(err, "Could not send the login.") });
        } finally {
            setSendingId(null);
        }
    };

    const query = searchTerm.toLowerCase();
    const filtered = data.customers.filter((customer) =>
        [customer.customerCode, customer.name, customer.company, customer.email, customer.phone, customer.city]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query)
    );

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>Customers</h1>
                    <p>Your customers, their products and portal logins.</p>
                </div>
                <button type="button" className="primary-button" onClick={() => setAdding(true)}>
                    <Plus size={16} style={{ verticalAlign: "-3px", marginRight: 6 }} />
                    Add Customer
                </button>
            </div>

            <Notice notice={notice} onClose={() => setNotice(null)} />

            <div className="leads-card">
                <div className="leads-card-header">
                    <div>
                        <h2>Your Customers</h2>
                        <p className="section-description">Customers assigned to you</p>
                    </div>
                    <div className="lead-count">{filtered.length} Customers</div>
                </div>

                <div className="lead-toolbar">
                    <div className="lead-search">
                        <Search size={17} />
                        <input type="text" placeholder="Search customers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>

                <div className="table-container">
                    <table className="leads-table">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Code</th>
                                <th>Phone</th>
                                <th>City</th>
                                <th>Portal login</th>
                                <th>Open requests</th>
                                <th>Added</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.loading ? (
                                <tr><td colSpan="8">Loading customers...</td></tr>
                            ) : data.error ? (
                                <tr><td colSpan="8" role="alert">{data.error}</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="8">No customers found.</td></tr>
                            ) : (
                                filtered.map((customer) => (
                                    <tr key={customer.id}>
                                        <td>
                                            <div className="lead-name">
                                                <div className="lead-avatar">{(customer.name || "?").charAt(0).toUpperCase()}</div>
                                                <div>
                                                    <strong>{customer.name}</strong>
                                                    <div style={{ fontSize: 12, color: "var(--muted-text)" }}>{customer.email || "No email"}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{customer.customerCode}</td>
                                        <td>{customer.phone || "—"}</td>
                                        <td>{customer.city || "—"}</td>
                                        <td><PortalBadge portal={customer.portal} /></td>
                                        <td>{customer.openRequests || 0}</td>
                                        <td>{formatDate(customer.createdAt)}</td>
                                        <td>
                                            <div className="cc-row-actions">
                                                <button type="button" className="cc-icon-btn" title="View" onClick={() => navigate(`/salesExecutive/customers/${customer.id}`)}>
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="cc-icon-btn"
                                                    title={customer.portal?.status === "Active" ? "Send password reset link" : "Send login"}
                                                    onClick={() => sendLogin(customer)}
                                                    disabled={sendingId === customer.id || customer.portal?.status === "Disabled"}
                                                >
                                                    <Send size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {adding && (
                <AddCustomerDialog
                    onClose={() => setAdding(false)}
                    onCreated={() => setReloadKey((key) => key + 1)}
                />
            )}

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

export default Customers;
