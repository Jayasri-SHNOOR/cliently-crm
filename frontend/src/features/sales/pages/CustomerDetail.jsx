import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Send, Trash2 } from "lucide-react";
import { salesCare } from "../../customer-care/careApi";
import { InviteResult, Notice, PaymentBadge, PortalBadge, StatusBadge } from "../../customer-care/CareParts";
import { errorText, formatDate, todayInput } from "../../customer-care/careFormat";

function loadCustomer(id) {
    return Promise.all([salesCare.getCustomer(id), salesCare.listCatalogue().catch(() => ({ products: [] }))]).then(([detail, catalogue]) => ({
        ...detail,
        catalogue: (catalogue.products || []).filter((item) => item.status === "Active"),
    }));
}

const EMPTY_PRODUCT = { productId: "", serialNumber: "", purchaseDate: "", warrantyMonths: "12" };

function CustomerDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [reloadKey, setReloadKey] = useState(0);
    const [data, setData] = useState({ id: null, error: "", detail: null });
    const [notice, setNotice] = useState(null);
    const [editing, setEditing] = useState(null);
    const [busy, setBusy] = useState("");
    const [invite, setInvite] = useState(null);
    const [productForm, setProductForm] = useState(EMPTY_PRODUCT);

    useEffect(() => {
        let active = true;
        loadCustomer(id)
            .then((detail) => {
                if (active) setData({ id, error: "", detail });
            })
            .catch((err) => {
                if (active) setData({ id, error: errorText(err, "Unable to load this customer."), detail: null });
            });
        return () => {
            active = false;
        };
    }, [id, reloadKey]);

    const reload = () => setReloadKey((key) => key + 1);
    const detail = data.id === id ? data.detail : null;

    const run = async (key, action) => {
        setBusy(key);
        setNotice(null);
        try {
            await action();
        } catch (err) {
            setNotice({ type: "error", text: errorText(err, "Something went wrong.") });
        } finally {
            setBusy("");
        }
    };

    const saveDetails = (event) => {
        event.preventDefault();
        run("save", async () => {
            const result = await salesCare.updateCustomer(id, editing);
            setEditing(null);
            setNotice({ type: "success", text: result.message });
            reload();
        });
    };

    const sendLogin = () =>
        run("invite", async () => {
            setInvite(await salesCare.sendLogin(id));
            reload();
        });

    const addProduct = (event) => {
        event.preventDefault();
        if (!productForm.productId) {
            setNotice({ type: "error", text: "Choose a product to add" });
            return;
        }
        run("product", async () => {
            const result = await salesCare.addProduct(id, {
                productId: productForm.productId,
                serialNumber: productForm.serialNumber.trim() || undefined,
                purchaseDate: productForm.purchaseDate || undefined,
                warrantyMonths: Number(productForm.warrantyMonths || 0),
            });
            setProductForm(EMPTY_PRODUCT);
            setNotice({ type: "success", text: result.message });
            reload();
        });
    };

    const removeProduct = (item) => {
        if (!window.confirm(`Remove ${item.productName} from this customer?`)) return;
        run(`remove-${item.id}`, async () => {
            const result = await salesCare.removeProduct(id, item.id);
            setNotice({ type: "success", text: result.message });
            reload();
        });
    };

    if (data.id !== id) return <div className="page-container">Loading customer...</div>;

    if (!detail) {
        return (
            <div className="page-container">
                <button type="button" className="cc-back" onClick={() => navigate("/salesExecutive/customers")}><ArrowLeft size={16} /> Customers</button>
                <p role="alert">{data.error || "Customer not found."}</p>
            </div>
        );
    }

    const { customer, products, serviceRequests, catalogue } = detail;
    const changeEdit = (event) => setEditing((current) => ({ ...current, [event.target.name]: event.target.value }));
    const changeProduct = (event) => setProductForm((current) => ({ ...current, [event.target.name]: event.target.value }));

    return (
        <div className="page-container">
            <button type="button" className="cc-back" onClick={() => navigate("/salesExecutive/customers")}><ArrowLeft size={16} /> Customers</button>

            <div className="page-header">
                <div>
                    <h1>{customer.name}</h1>
                    <p>{customer.customerCode}{customer.company ? ` · ${customer.company}` : ""}</p>
                </div>
            </div>

            <Notice notice={notice} onClose={() => setNotice(null)} />

            <div className="cc-two-col">
                <section className="cc-card">
                    <div className="cc-card-head">
                        <div>
                            <h2>Contact details</h2>
                            <p>Used for service visits and the login email.</p>
                        </div>
                        {!editing && (
                            <button
                                type="button"
                                className="cc-btn cc-btn--small"
                                onClick={() => setEditing({ name: customer.name || "", email: customer.email || "", phone: customer.phone || "", company: customer.company || "", address: customer.address || "", city: customer.city || "" })}
                            >
                                <Pencil size={14} /> Edit
                            </button>
                        )}
                    </div>
                    <div className="cc-card-body">
                        {editing ? (
                            <form className="cc-form" onSubmit={saveDetails}>
                                <div className="cc-form-grid">
                                    <label>Name *<input name="name" value={editing.name} onChange={changeEdit} maxLength={120} required /></label>
                                    <label>Email<input name="email" type="email" value={editing.email} onChange={changeEdit} maxLength={120} /></label>
                                    <label>Phone<input name="phone" value={editing.phone} onChange={changeEdit} maxLength={20} /></label>
                                    <label>Company<input name="company" value={editing.company} onChange={changeEdit} maxLength={120} /></label>
                                    <label className="cc-full">Address<textarea name="address" rows={2} value={editing.address} onChange={changeEdit} maxLength={300} /></label>
                                    <label>City<input name="city" value={editing.city} onChange={changeEdit} maxLength={80} /></label>
                                </div>
                                <div className="cc-actions">
                                    <button type="button" className="cc-btn" onClick={() => setEditing(null)} disabled={busy === "save"}>Cancel</button>
                                    <button type="submit" className="cc-btn cc-btn--primary" disabled={busy === "save"}>{busy === "save" ? "Saving..." : "Save"}</button>
                                </div>
                            </form>
                        ) : (
                            <div className="cc-info-grid">
                                <div><span>Email</span><strong>{customer.email || "—"}</strong></div>
                                <div><span>Phone</span><strong>{customer.phone || "—"}</strong></div>
                                <div><span>Company</span><strong>{customer.company || "—"}</strong></div>
                                <div><span>City</span><strong>{customer.city || "—"}</strong></div>
                                <div className="cc-full" style={{ gridColumn: "1 / -1" }}><span>Address</span><strong>{customer.address || "—"}</strong></div>
                            </div>
                        )}
                    </div>
                </section>

                <section className="cc-card">
                    <div className="cc-card-head">
                        <div>
                            <h2>Portal login</h2>
                            <p>The customer signs in with the login ID and their own password.</p>
                        </div>
                        <PortalBadge portal={customer.portal} />
                    </div>
                    <div className="cc-card-body cc-form">
                        <div className="cc-info-grid">
                            <div><span>Login ID</span><strong>{customer.portal?.loginId || "Not created"}</strong></div>
                            <div><span>Email</span><strong>{customer.email || "No email on file"}</strong></div>
                        </div>
                        <button type="button" className="cc-btn cc-btn--primary" onClick={sendLogin} disabled={busy === "invite" || customer.portal?.status === "Disabled"}>
                            <Send size={15} />
                            {busy === "invite" ? "Sending..." : customer.portal?.status === "Active" ? "Send password reset link" : "Send login email"}
                        </button>
                        {customer.portal?.status === "Disabled" && <p className="cc-muted">Portal access is disabled by the Client Admin.</p>}
                        <InviteResult result={invite} />
                    </div>
                </section>
            </div>

            <section className="cc-card">
                <div className="cc-card-head">
                    <div>
                        <h2>Products bought</h2>
                        <p>The customer sees these in the portal and can request service for them.</p>
                    </div>
                </div>
                <div className="cc-table-wrap">
                    <table className="cc-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Serial no.</th>
                                <th>Bought on</th>
                                <th>Warranty until</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.length === 0 ? (
                                <tr><td colSpan={5} className="cc-muted">No products added yet.</td></tr>
                            ) : (
                                products.map((item) => (
                                    <tr key={item.id}>
                                        <td><strong>{item.productName}</strong></td>
                                        <td>{item.serialNumber || "—"}</td>
                                        <td>{formatDate(item.purchaseDate)}</td>
                                        <td>{formatDate(item.warrantyUntil)}</td>
                                        <td>
                                            <button type="button" className="cc-icon-btn" title="Remove" onClick={() => removeProduct(item)} disabled={busy === `remove-${item.id}`}>
                                                <Trash2 size={15} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <form className="cc-card-body cc-form" onSubmit={addProduct}>
                    <div className="cc-form-grid">
                        <label>
                            Add product *
                            <select name="productId" value={productForm.productId} onChange={changeProduct} disabled={busy === "product"}>
                                <option value="">Choose from catalogue</option>
                                {catalogue.map((item) => (
                                    <option key={item._id} value={item._id}>{item.name}{item.code ? ` (${item.code})` : ""}</option>
                                ))}
                            </select>
                        </label>
                        <label>Serial no.<input name="serialNumber" value={productForm.serialNumber} onChange={changeProduct} maxLength={60} disabled={busy === "product"} /></label>
                        <label>Bought on<input type="date" name="purchaseDate" max={todayInput()} value={productForm.purchaseDate} onChange={changeProduct} disabled={busy === "product"} /></label>
                        <label>Warranty (months)<input type="number" name="warrantyMonths" min="0" max="120" value={productForm.warrantyMonths} onChange={changeProduct} disabled={busy === "product"} /></label>
                    </div>
                    <div className="cc-actions">
                        <button type="submit" className="cc-btn cc-btn--primary" disabled={busy === "product"}>{busy === "product" ? "Adding..." : "Add product"}</button>
                    </div>
                </form>
            </section>

            <section className="cc-card">
                <div className="cc-card-head">
                    <div>
                        <h2>Service requests</h2>
                        <p>Assign staff and set charges from the Service Requests page.</p>
                    </div>
                    <button type="button" className="cc-btn cc-btn--small" onClick={() => navigate("/salesExecutive/service-requests")}>Open Service Requests</button>
                </div>
                <div className="cc-table-wrap">
                    <table className="cc-table">
                        <thead>
                            <tr>
                                <th>Request</th>
                                <th>Service</th>
                                <th>Status</th>
                                <th>Assigned to</th>
                                <th>Charge</th>
                            </tr>
                        </thead>
                        <tbody>
                            {serviceRequests.length === 0 ? (
                                <tr><td colSpan={5} className="cc-muted">No service requests yet.</td></tr>
                            ) : (
                                serviceRequests.map((request) => (
                                    <tr key={request.id}>
                                        <td><strong>{request.requestNumber}</strong><small>{formatDate(request.createdAt)}</small></td>
                                        <td><strong>{request.serviceType}</strong><small>{request.productName || "General"}</small></td>
                                        <td><StatusBadge status={request.status} /></td>
                                        <td>{request.assignedToName || "—"}</td>
                                        <td><PaymentBadge request={request} /></td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

export default CustomerDetail;
