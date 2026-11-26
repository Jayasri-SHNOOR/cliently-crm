import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Wrench } from "lucide-react";
import { formatDate, formatMoney, listMyRequests, statusClass } from "./portalApi";

function PortalRequests({ ctx }) {
    const { onSessionEnd } = ctx;
    const [data, setData] = useState({ loading: true, error: "", requests: [] });

    useEffect(() => {
        let active = true;
        listMyRequests()
            .then((result) => {
                if (active) setData({ loading: false, error: "", requests: result.serviceRequests || [] });
            })
            .catch((err) => {
                if (!active) return;
                if (err.status === 401) return onSessionEnd();
                setData({ loading: false, error: err.message, requests: [] });
            });
        return () => {
            active = false;
        };
    }, [onSessionEnd]);

    return (
        <section>
            <div className="cp-page-head">
                <div>
                    <h1>Service requests</h1>
                    <p>Track your service visits and pay service charges.</p>
                </div>
            </div>

            {data.loading ? (
                <p className="cp-empty">Loading your requests...</p>
            ) : data.error ? (
                <div className="cp-alert cp-alert--error" role="alert">{data.error}</div>
            ) : data.requests.length === 0 ? (
                <div className="cp-empty-card">
                    <Wrench size={30} />
                    <h3>No service requests yet</h3>
                    <p>Go to My products and choose “Request service”.</p>
                </div>
            ) : (
                <div className="cp-list">
                    {data.requests.map((request) => {
                        const unpaid = request.paymentStatus === "Unpaid" && request.charge > 0 && request.status !== "Cancelled";
                        return (
                            <Link key={request.id} to={`${ctx.base}/requests/${request.id}`} className="cp-list-item">
                                <div className="cp-list-main">
                                    <strong>{request.requestNumber} · {request.serviceType}</strong>
                                    <span>{request.productName || "General request"} · {formatDate(request.createdAt)}</span>
                                    {request.scheduledDate && <span>Visit on {formatDate(request.scheduledDate)}</span>}
                                </div>
                                <div className="cp-list-side">
                                    <span className={`cp-status cp-status--${statusClass(request.status)}`}>{request.status}</span>
                                    {unpaid && <span className="cp-status cp-status--unpaid">Pay {formatMoney(request.charge)}</span>}
                                    {request.paymentStatus === "Paid" && <span className="cp-status cp-status--paid">Paid</span>}
                                </div>
                                <ChevronRight size={18} className="cp-list-arrow" />
                            </Link>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

export default PortalRequests;
