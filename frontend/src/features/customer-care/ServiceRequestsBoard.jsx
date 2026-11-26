import { Fragment, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { managerCare, salesCare } from "./careApi";
import { REQUEST_STATUSES, canAssign, canCharge, errorText, formatDate } from "./careFormat";
import { AssignDialog, ChargeDialog, Notice, PaymentBadge, StatusBadge, Timeline } from "./CareParts";
import "./care.css";

function loadBoard(role, status, unassigned) {
    const api = role === "manager" ? managerCare : salesCare;
    const requests = role === "manager" ? api.listRequests(status, unassigned) : api.listRequests(status);
    return Promise.all([requests, api.listStaff()]).then(([list, team]) => ({
        requests: list.serviceRequests || [],
        staff: team.staff || [],
    }));
}

export default function ServiceRequestsBoard({ role }) {
    const api = role === "manager" ? managerCare : salesCare;
    const [status, setStatus] = useState("All");
    const [unassigned, setUnassigned] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const [data, setData] = useState({ loading: true, error: "", requests: [], staff: [] });
    const [openId, setOpenId] = useState(null);
    const [dialog, setDialog] = useState(null);
    const [notice, setNotice] = useState(null);

    useEffect(() => {
        let active = true;
        loadBoard(role, status, unassigned)
            .then((result) => {
                if (active) setData({ loading: false, error: "", ...result });
            })
            .catch((err) => {
                if (active) setData({ loading: false, error: errorText(err, "Could not load service requests."), requests: [], staff: [] });
            });
        return () => {
            active = false;
        };
    }, [role, status, unassigned, reloadKey]);

    const refresh = () => setReloadKey((key) => key + 1);

    const saveAssign = async (body) => {
        const result = await api.assign(dialog.request.id, body);
        setDialog(null);
        setNotice({ type: "success", text: result.message });
        refresh();
    };

    const saveCharge = async (body) => {
        const result = await api.setCharge(dialog.request.id, body);
        setDialog(null);
        setNotice({ type: "success", text: result.message });
        refresh();
    };

    const counts = data.requests.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] || 0) + 1 }), {});

    return (
        <div className="cc-page">
            <header className="cc-head">
                <div>
                    <h1>Service Requests</h1>
                    <p>
                        {role === "manager"
                            ? "All customer service requests. Assign operational staff and set charges."
                            : "Requests from your customers. Assign operational staff and set charges."}
                    </p>
                </div>
                <button type="button" className="cc-btn" onClick={refresh} disabled={data.loading}>
                    <RefreshCw size={15} /> Refresh
                </button>
            </header>

            <Notice notice={notice} onClose={() => setNotice(null)} />

            <div className="cc-card">
                <div className="cc-toolbar">
                    <div className="cc-tabs">
                        {["All", ...REQUEST_STATUSES].map((value) => (
                            <button key={value} type="button" className={status === value ? "active" : ""} onClick={() => setStatus(value)}>
                                {value}
                                {status === "All" && value !== "All" && counts[value] ? ` (${counts[value]})` : ""}
                            </button>
                        ))}
                    </div>
                    {role === "manager" && (
                        <label className="cc-check">
                            <input type="checkbox" checked={unassigned} onChange={(e) => setUnassigned(e.target.checked)} />
                            Unassigned only
                        </label>
                    )}
                </div>

                {data.loading ? (
                    <p className="cc-empty">Loading service requests...</p>
                ) : data.error ? (
                    <div className="cc-empty">
                        <p role="alert">{data.error}</p>
                        <button type="button" className="cc-btn" onClick={refresh}>Try again</button>
                    </div>
                ) : data.requests.length === 0 ? (
                    <p className="cc-empty">No service requests found.</p>
                ) : (
                    <div className="cc-table-wrap">
                        <table className="cc-table">
                            <thead>
                                <tr>
                                    <th>Request</th>
                                    <th>Customer</th>
                                    <th>Service</th>
                                    <th>Dates</th>
                                    <th>Status</th>
                                    <th>Assigned to</th>
                                    <th>Charge</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.requests.map((request) => {
                                    const open = openId === request.id;
                                    return (
                                        <Fragment key={request.id}>
                                            <tr>
                                                <td>
                                                    <strong>{request.requestNumber}</strong>
                                                    <small>{formatDate(request.createdAt)}</small>
                                                </td>
                                                <td>
                                                    <strong>{request.customer?.name || "—"}</strong>
                                                    <small>{[request.customer?.customerCode, request.customer?.phone].filter(Boolean).join(" · ")}</small>
                                                </td>
                                                <td>
                                                    <strong>{request.serviceType}</strong>
                                                    <small>{request.productName || "General"}</small>
                                                </td>
                                                <td>
                                                    <small>Preferred: {formatDate(request.preferredDate)}</small>
                                                    <small>Visit: {formatDate(request.scheduledDate)}</small>
                                                </td>
                                                <td><StatusBadge status={request.status} /></td>
                                                <td>{request.assignedToName || <span className="cc-muted">Unassigned</span>}</td>
                                                <td><PaymentBadge request={request} /></td>
                                                <td>
                                                    <div className="cc-row-actions">
                                                        {canAssign(request) && (
                                                            <button type="button" className="cc-btn cc-btn--small cc-btn--primary" onClick={() => setDialog({ type: "assign", request })}>
                                                                {request.assignedToName ? "Reassign" : "Assign"}
                                                            </button>
                                                        )}
                                                        {canCharge(request) && (
                                                            <button type="button" className="cc-btn cc-btn--small" onClick={() => setDialog({ type: "charge", request })}>
                                                                Charge
                                                            </button>
                                                        )}
                                                        <button type="button" className="cc-icon-btn" onClick={() => setOpenId(open ? null : request.id)} aria-label={open ? "Hide details" : "Show details"}>
                                                            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {open && (
                                                <tr className="cc-detail-row">
                                                    <td colSpan={8}>
                                                        <div className="cc-detail-grid">
                                                            <div>
                                                                <h3>Details</h3>
                                                                <p>{request.description || "No description."}</p>
                                                                <p className="cc-muted">Address: {request.address || "—"}</p>
                                                            </div>
                                                            <div>
                                                                <h3>Timeline</h3>
                                                                <Timeline updates={request.updates} />
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {dialog?.type === "assign" && <AssignDialog request={dialog.request} staff={data.staff} onClose={() => setDialog(null)} onSave={saveAssign} />}
            {dialog?.type === "charge" && <ChargeDialog request={dialog.request} onClose={() => setDialog(null)} onSave={saveCharge} />}
        </div>
    );
}
