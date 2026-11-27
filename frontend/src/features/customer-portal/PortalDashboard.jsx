import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, CreditCard, Package, Plus, ShieldCheck, Wallet, Wrench } from "lucide-react";
import { formatDate, formatMoney, getServiceTypes, listMyProducts, listMyRequests, statusClass } from "./portalApi";
import { RequestForm } from "./PortalProducts";
import "./PortalDashboard.css";

const OPEN = ["Requested", "Assigned", "In Progress"];

function load() {
    return Promise.all([listMyProducts(), listMyRequests(), getServiceTypes()]).then(([p, r, t]) => ({
        products: p.products || [],
        requests: r.serviceRequests || [],
        serviceTypes: t.serviceTypes || [],
    }));
}

function PortalDashboard({ ctx }) {
    const navigate = useNavigate();
    const { onSessionEnd, base, profile } = ctx;
    const [data, setData] = useState({ loading: true, error: "", products: [], requests: [], serviceTypes: [] });
    const [requestFor, setRequestFor] = useState(null);

    useEffect(() => {
        let active = true;
        load()
            .then((result) => {
                if (active) setData({ loading: false, error: "", ...result });
            })
            .catch((err) => {
                if (!active) return;
                if (err.status === 401) return onSessionEnd();
                setData({ loading: false, error: err.message, products: [], requests: [], serviceTypes: [] });
            });
        return () => {
            active = false;
        };
    }, [onSessionEnd]);

    const stats = useMemo(() => {
        const due = data.requests.filter((r) => r.paymentStatus === "Unpaid" && r.charge > 0 && r.status !== "Cancelled");
        return {
            due,
            dueTotal: due.reduce((sum, r) => sum + Number(r.charge || 0), 0),
            open: data.requests.filter((r) => OPEN.includes(r.status)).length,
            warranty: data.products.filter((p) => p.underWarranty).length,
        };
    }, [data]);

    const created = (result) => {
        setRequestFor(null);
        navigate(`${base}/requests/${result.serviceRequest.id}`, { state: { message: result.message } });
    };

    const firstName = String(profile.name || "").split(" ")[0] || "there";
    const dash = data.loading ? "–" : null;

    const cards = [
        { icon: Package, label: "My products", value: dash || data.products.length },
        { icon: ShieldCheck, label: "Under warranty", value: dash || stats.warranty },
        { icon: Wrench, label: "Open requests", value: dash || stats.open },
    ];

    return (
        <section className="pd">
            <div className="pd-head">
                <div>
                    <h1>Hi, {firstName}</h1>
                    <p>Here’s a quick look at your account.</p>
                </div>
                <button type="button" className="cp-btn cp-btn--primary" onClick={() => setRequestFor({ product: null })} disabled={!data.serviceTypes.length}>
                    <Plus size={16} /> New request
                </button>
            </div>

            {data.error && <div className="cp-alert cp-alert--error" role="alert">{data.error}</div>}

            <div className="pd-stats">
                {cards.map(({ icon: Icon, label, value }) => (
                    <div key={label} className="pd-stat">
                        <div className="pd-stat-icon"><Icon size={20} /></div>
                        <div>
                            <span>{label}</span>
                            <strong>{value}</strong>
                        </div>
                    </div>
                ))}
                <div className={`pd-stat pd-stat--due ${stats.due.length ? "has-due" : ""}`}>
                    <div className="pd-stat-icon"><Wallet size={20} /></div>
                    <div>
                        <span>Amount due</span>
                        <strong>{dash || formatMoney(stats.dueTotal)}</strong>
                    </div>
                    {stats.due.length > 0 && (
                        <Link to={`${base}/requests/${stats.due[0].id}`} className="pd-pay">
                            <CreditCard size={14} /> Pay
                        </Link>
                    )}
                </div>
            </div>

            <div className="pd-grid">
                <div className="pd-panel">
                    <div className="pd-panel-head">
                        <h2>Recent requests</h2>
                        <Link to={`${base}/requests`}>View all</Link>
                    </div>
                    <div className="pd-panel-body">
                        {data.loading ? (
                            <p className="cp-empty">Loading...</p>
                        ) : data.requests.length === 0 ? (
                            <p className="cp-empty">No service requests yet.</p>
                        ) : (
                            data.requests.slice(0, 3).map((r) => (
                                <Link key={r.id} to={`${base}/requests/${r.id}`} className="pd-row">
                                    <div className="pd-row-main">
                                        <strong>{r.serviceType}</strong>
                                        <span>{r.requestNumber} · {r.productName || "General"} · {formatDate(r.createdAt)}</span>
                                    </div>
                                    <span className={`cp-status cp-status--${statusClass(r.status)}`}>{r.status}</span>
                                    <ChevronRight size={16} className="pd-arrow" />
                                </Link>
                            ))
                        )}
                    </div>
                </div>

                <div className="pd-panel">
                    <div className="pd-panel-head">
                        <h2>My products</h2>
                        <Link to={`${base}/products`}>View all</Link>
                    </div>
                    <div className="pd-panel-body">
                        {data.loading ? (
                            <p className="cp-empty">Loading...</p>
                        ) : data.products.length === 0 ? (
                            <p className="cp-empty">Your sales executive adds your products here.</p>
                        ) : (
                            data.products.slice(0, 3).map((p) => (
                                <div key={p.id} className="pd-row">
                                    <div className="pd-row-icon"><Package size={16} /></div>
                                    <div className="pd-row-main">
                                        <strong>{p.productName}</strong>
                                        <span>{p.underWarranty ? `Warranty until ${formatDate(p.warrantyUntil)}` : "No warranty"}</span>
                                    </div>
                                    {p.hasOpenRequest ? (
                                        <span className="cp-status cp-status--in-progress">In progress</span>
                                    ) : (
                                        <button type="button" className="cp-btn cp-btn--small" onClick={() => setRequestFor({ product: p })}>
                                            Request service
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {requestFor && (
                <RequestForm
                    product={requestFor.product}
                    serviceTypes={data.serviceTypes}
                    profile={profile}
                    onClose={() => setRequestFor(null)}
                    onCreated={created}
                    onSessionEnd={onSessionEnd}
                />
            )}
        </section>
    );
}

export default PortalDashboard;