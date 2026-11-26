import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, CreditCard } from "lucide-react";
import {
    cancelServiceRequest,
    formatDate,
    formatMoney,
    getMyRequest,
    loadRazorpay,
    reportPaymentFailure,
    startPayment,
    statusClass,
    verifyPayment,
} from "./portalApi";

function formatDateTime(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function PortalRequestDetail({ ctx }) {
    const { id } = useParams();
    const location = useLocation();
    const { onSessionEnd } = ctx;
    const [reloadKey, setReloadKey] = useState(0);
    const [data, setData] = useState({ id: null, loading: true, error: "", request: null });
    const [notice, setNotice] = useState(() => (location.state?.message ? { type: "success", text: location.state.message } : null));
    const [busy, setBusy] = useState("");
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [reason, setReason] = useState("");

    useEffect(() => {
        let active = true;
        getMyRequest(id)
            .then((result) => {
                if (active) setData({ id, loading: false, error: "", request: result.serviceRequest });
            })
            .catch((err) => {
                if (!active) return;
                if (err.status === 401) return onSessionEnd();
                setData({ id, loading: false, error: err.message, request: null });
            });
        return () => {
            active = false;
        };
    }, [id, reloadKey, onSessionEnd]);

    const request = data.id === id ? data.request : null;
    const loading = data.id !== id || data.loading;

    const handleError = (err) => {
        if (err.status === 401) return onSessionEnd();
        setNotice({ type: "error", text: err.message });
    };

    const cancel = async () => {
        setBusy("cancel");
        setNotice(null);
        try {
            const result = await cancelServiceRequest(id, reason.trim() || undefined);
            setConfirmCancel(false);
            setNotice({ type: "success", text: result.message });
            setReloadKey((key) => key + 1);
        } catch (err) {
            handleError(err);
        } finally {
            setBusy("");
        }
    };

    const pay = async () => {
        setBusy("pay");
        setNotice(null);
        try {
            const order = await startPayment(id);
            await loadRazorpay();
            const checkout = new window.Razorpay({
                key: order.keyId,
                amount: order.amount,
                currency: order.currency,
                name: order.companyName,
                description: order.description,
                order_id: order.orderId,
                prefill: order.prefill,
                theme: { color: "#123C3A" },
                handler: async (response) => {
                    try {
                        const result = await verifyPayment(response);
                        setNotice({ type: "success", text: result.message || "Payment successful" });
                        setReloadKey((key) => key + 1);
                    } catch (err) {
                        handleError(err);
                    } finally {
                        setBusy("");
                    }
                },
                modal: {
                    ondismiss: () => setBusy(""),
                },
            });
            checkout.on("payment.failed", (response) => {
                reportPaymentFailure({
                    razorpay_order_id: response?.error?.metadata?.order_id || order.orderId,
                    reason: response?.error?.description || "Payment failed",
                });
                setNotice({ type: "error", text: response?.error?.description || "Payment failed. Please try again." });
            });
            checkout.open();
        } catch (err) {
            handleError(err);
            setBusy("");
        }
    };

    if (loading) return <p className="cp-empty">Loading request...</p>;

    if (!request) {
        return (
            <section>
                <Link to={`${ctx.base}/requests`} className="cp-back"><ArrowLeft size={16} /> All requests</Link>
                <div className="cp-alert cp-alert--error" role="alert">{data.error || "Request not found."}</div>
            </section>
        );
    }

    const canCancel = ["Requested", "Assigned"].includes(request.status);
    const unpaid = request.paymentStatus === "Unpaid" && request.charge > 0 && request.status !== "Cancelled";

    return (
        <section>
            <Link to={`${ctx.base}/requests`} className="cp-back"><ArrowLeft size={16} /> All requests</Link>

            <div className="cp-page-head">
                <div>
                    <h1>{request.requestNumber}</h1>
                    <p>{request.serviceType} · {request.productName || "General request"}</p>
                </div>
                <span className={`cp-status cp-status--${statusClass(request.status)}`}>{request.status}</span>
            </div>

            {notice && <div className={`cp-alert cp-alert--${notice.type}`} role={notice.type === "error" ? "alert" : "status"}>{notice.text}</div>}

            {unpaid && (
                <div className="cp-pay-card">
                    <div>
                        <span>Service charge</span>
                        <strong>{formatMoney(request.charge)}</strong>
                    </div>
                    <button type="button" className="cp-btn cp-btn--primary" onClick={pay} disabled={Boolean(busy)}>
                        <CreditCard size={16} /> {busy === "pay" ? "Opening payment..." : "Pay now"}
                    </button>
                </div>
            )}
            {request.paymentStatus === "Paid" && (
                <div className="cp-alert cp-alert--success">
                    Paid {formatMoney(request.charge)}{request.paidAt ? ` on ${formatDate(request.paidAt)}` : ""}. Thank you.
                </div>
            )}

            <div className="cp-detail-grid">
                <div className="cp-card">
                    <h2>Details</h2>
                    <dl className="cp-dl">
                        <div><dt>Requested on</dt><dd>{formatDate(request.createdAt)}</dd></div>
                        <div><dt>Preferred date</dt><dd>{formatDate(request.preferredDate)}</dd></div>
                        <div><dt>Visit date</dt><dd>{formatDate(request.scheduledDate)}</dd></div>
                        <div><dt>Technician</dt><dd>{request.assignedToName || "Not assigned yet"}</dd></div>
                        {request.completedAt && <div><dt>Completed on</dt><dd>{formatDate(request.completedAt)}</dd></div>}
                    </dl>
                    {request.description && (
                        <>
                            <h3>Your description</h3>
                            <p className="cp-text">{request.description}</p>
                        </>
                    )}

                    {canCancel && !confirmCancel && (
                        <button type="button" className="cp-btn cp-btn--danger" onClick={() => setConfirmCancel(true)} disabled={Boolean(busy)}>
                            Cancel request
                        </button>
                    )}
                    {confirmCancel && (
                        <div className="cp-confirm">
                            <label>
                                Reason (optional)
                                <input value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} disabled={busy === "cancel"} />
                            </label>
                            <div className="cp-actions">
                                <button type="button" className="cp-btn" onClick={() => setConfirmCancel(false)} disabled={busy === "cancel"}>Keep request</button>
                                <button type="button" className="cp-btn cp-btn--danger" onClick={cancel} disabled={busy === "cancel"}>
                                    {busy === "cancel" ? "Cancelling..." : "Yes, cancel"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="cp-card">
                    <h2>Progress</h2>
                    <ol className="cp-timeline">
                        {[...(request.updates || [])].reverse().map((item, index) => (
                            <li key={`${item.at}-${index}`}>
                                <div>
                                    <span className={`cp-status cp-status--${statusClass(item.status)}`}>{item.status}</span>
                                    <time>{formatDateTime(item.at)}</time>
                                </div>
                                {item.note && <p>{item.note}</p>}
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </section>
    );
}

export default PortalRequestDetail;