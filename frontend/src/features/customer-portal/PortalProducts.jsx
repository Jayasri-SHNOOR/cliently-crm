import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Plus, ShieldCheck, ShieldOff, X } from "lucide-react";
import { createServiceRequest, formatDate, getServiceTypes, listMyProducts } from "./portalApi";

function loadProducts() {
    return Promise.all([listMyProducts(), getServiceTypes()]).then(([products, types]) => ({
        products: products.products || [],
        serviceTypes: types.serviceTypes || [],
    }));
}

function todayInput() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function RequestForm({ product, serviceTypes, profile, onClose, onCreated, onSessionEnd }) {
    const [form, setForm] = useState({
        serviceType: serviceTypes[0] || "",
        description: "",
        preferredDate: "",
        address: [profile.address, profile.city].filter(Boolean).join(", "),
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

    const submit = async (event) => {
        event.preventDefault();
        if (form.serviceType === "Other" && !form.description.trim()) {
            setError("Please describe what you need");
            return;
        }
        setSaving(true);
        setError("");
        try {
            const data = await createServiceRequest({
                customerProductId: product?.id,
                serviceType: form.serviceType,
                description: form.description.trim(),
                preferredDate: form.preferredDate || undefined,
                address: form.address.trim() || undefined,
            });
            onCreated(data);
        } catch (err) {
            if (err.status === 401) return onSessionEnd();
            setError(err.message);
            setSaving(false);
        }
    };

    return (
        <div className="cp-overlay" onMouseDown={onClose}>
            <div className="cp-modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
                <div className="cp-modal-head">
                    <div>
                        <h2>Request a service</h2>
                        <p>{product ? product.productName : "General request (not for a specific product)"}</p>
                    </div>
                    <button type="button" className="cp-icon-btn" onClick={onClose} aria-label="Close">
                        <X size={18} />
                    </button>
                </div>
                <form className="cp-form" onSubmit={submit}>
                    <label>
                        What do you need? *
                        <select name="serviceType" value={form.serviceType} onChange={change} disabled={saving}>
                            {serviceTypes.map((type) => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Describe the problem {form.serviceType === "Other" ? "*" : ""}
                        <textarea name="description" rows={4} maxLength={1000} value={form.description} onChange={change} placeholder="e.g. Water is leaking from the bottom" disabled={saving} />
                    </label>
                    <label>
                        Preferred visit date
                        <input type="date" name="preferredDate" min={todayInput()} value={form.preferredDate} onChange={change} disabled={saving} />
                    </label>
                    <label>
                        Visit address
                        <textarea name="address" rows={2} maxLength={300} value={form.address} onChange={change} disabled={saving} />
                    </label>
                    {error && <div className="cp-alert cp-alert--error" role="alert">{error}</div>}
                    <div className="cp-actions">
                        <button type="button" className="cp-btn" onClick={onClose} disabled={saving}>Cancel</button>
                        <button type="submit" className="cp-btn cp-btn--primary" disabled={saving}>{saving ? "Sending..." : "Send request"}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function PortalProducts({ ctx }) {
    const navigate = useNavigate();
    const { onSessionEnd } = ctx;
    const [data, setData] = useState({ loading: true, error: "", products: [], serviceTypes: [] });
    const [requestFor, setRequestFor] = useState(null);

    useEffect(() => {
        let active = true;
        loadProducts()
            .then((result) => {
                if (active) setData({ loading: false, error: "", ...result });
            })
            .catch((err) => {
                if (!active) return;
                if (err.status === 401) return onSessionEnd();
                setData({ loading: false, error: err.message, products: [], serviceTypes: [] });
            });
        return () => {
            active = false;
        };
    }, [onSessionEnd]);

    const created = (result) => {
        setRequestFor(null);
        navigate(`${ctx.base}/requests/${result.serviceRequest.id}`, { state: { message: result.message } });
    };

    return (
        <section>
            <div className="cp-page-head">
                <div>
                    <h1>My products</h1>
                    <p>These are the products you bought from {ctx.profile.company?.name || "us"}.</p>
                </div>
                <button type="button" className="cp-btn" onClick={() => setRequestFor({ product: null })} disabled={!data.serviceTypes.length}>
                    <Plus size={16} /> General request
                </button>
            </div>

            {data.loading ? (
                <p className="cp-empty">Loading your products...</p>
            ) : data.error ? (
                <div className="cp-alert cp-alert--error" role="alert">{data.error}</div>
            ) : data.products.length === 0 ? (
                <div className="cp-empty-card">
                    <Package size={30} />
                    <h3>No products yet</h3>
                    <p>Your sales executive adds the products you buy here.</p>
                </div>
            ) : (
                <div className="cp-grid">
                    {data.products.map((product) => (
                        <article className="cp-product" key={product.id}>
                            <div className="cp-product-top">
                                <div className="cp-product-icon"><Package size={20} /></div>
                                {product.underWarranty ? (
                                    <span className="cp-badge cp-badge--ok"><ShieldCheck size={13} /> Under warranty</span>
                                ) : (
                                    <span className="cp-badge"><ShieldOff size={13} /> No warranty</span>
                                )}
                            </div>
                            <h2>{product.productName}</h2>
                            <dl>
                                <div><dt>Serial no.</dt><dd>{product.serialNumber || "—"}</dd></div>
                                <div><dt>Bought on</dt><dd>{formatDate(product.purchaseDate)}</dd></div>
                                <div><dt>Warranty until</dt><dd>{formatDate(product.warrantyUntil)}</dd></div>
                            </dl>
                            {product.hasOpenRequest ? (
                                <button type="button" className="cp-btn cp-btn--block" onClick={() => navigate(`${ctx.base}/requests`)}>
                                    Service request in progress
                                </button>
                            ) : (
                                <button type="button" className="cp-btn cp-btn--primary cp-btn--block" onClick={() => setRequestFor({ product })}>
                                    Request service
                                </button>
                            )}
                        </article>
                    ))}
                </div>
            )}

            {requestFor && (
                <RequestForm
                    product={requestFor.product}
                    serviceTypes={data.serviceTypes}
                    profile={ctx.profile}
                    onClose={() => setRequestFor(null)}
                    onCreated={created}
                    onSessionEnd={onSessionEnd}
                />
            )}
        </section>
    );
}

export default PortalProducts;