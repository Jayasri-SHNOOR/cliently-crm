import { useState } from "react";
import { X } from "lucide-react";
import { formatDate, formatDateTime, formatMoney, slug, todayInput, errorText } from "./careFormat";
import "./care.css";

export function StatusBadge({ status }) {
    return <span className={`cc-badge cc-badge--${slug(status)}`}>{status || "—"}</span>;
}

export function PaymentBadge({ request }) {
    if (!request?.charge || request.paymentStatus === "Not Required") {
        return <span className="cc-badge cc-badge--none">No charge</span>;
    }
    return (
        <span className={`cc-badge cc-badge--${slug(request.paymentStatus)}`}>
            {formatMoney(request.charge)} · {request.paymentStatus}
        </span>
    );
}

export function PortalBadge({ portal }) {
    if (!portal) return <span className="cc-badge cc-badge--none">No login</span>;
    return <span className={`cc-badge cc-badge--${slug(portal.status)}`}>{portal.status}</span>;
}

export function Notice({ notice, onClose }) {
    if (!notice) return null;
    return (
        <div className={`cc-notice cc-notice--${notice.type}`} role={notice.type === "error" ? "alert" : "status"}>
            <span>{notice.text}</span>
            {onClose && (
                <button type="button" onClick={onClose} aria-label="Dismiss">
                    <X size={15} />
                </button>
            )}
        </div>
    );
}

export function Timeline({ updates }) {
    if (!updates?.length) return <p className="cc-muted">No updates yet.</p>;
    return (
        <ol className="cc-timeline">
            {[...updates].reverse().map((item, index) => (
                <li key={`${item.at}-${index}`}>
                    <div className="cc-timeline-top">
                        <StatusBadge status={item.status} />
                        <time>{formatDateTime(item.at)}</time>
                    </div>
                    {item.note && <p>{item.note}</p>}
                    {item.byName && <small>by {item.byName}</small>}
                </li>
            ))}
        </ol>
    );
}

export function Modal({ title, subtitle, onClose, children, wide }) {
    return (
        <div className="cc-overlay" onMouseDown={onClose}>
            <div className={`cc-modal ${wide ? "cc-modal--wide" : ""}`} role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
                <div className="cc-modal-head">
                    <div>
                        <h2>{title}</h2>
                        {subtitle && <p>{subtitle}</p>}
                    </div>
                    <button type="button" className="cc-icon-btn" onClick={onClose} aria-label="Close">
                        <X size={18} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

export function InviteResult({ result }) {
    const [copied, setCopied] = useState(false);
    if (!result) return null;
    const { message, portal, email } = result;
    const sent = email?.sent;

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(portal.activationLink);
            setCopied(true);
        } catch {
            setCopied(false);
        }
    };

    return (
        <div className={`cc-invite ${sent ? "cc-invite--ok" : "cc-invite--warn"}`}>
            <strong>{message}</strong>
            {portal?.loginId && (
                <div className="cc-invite-row">
                    <span>Login ID</span>
                    <code>{portal.loginId}</code>
                </div>
            )}
            {portal?.expiresAt && (
                <div className="cc-invite-row">
                    <span>Link expires</span>
                    <span>{formatDateTime(portal.expiresAt)}</span>
                </div>
            )}
            {email?.previewUrl && (
                <div className="cc-invite-row">
                    <span>Test inbox</span>
                    <a href={email.previewUrl} target="_blank" rel="noreferrer">Open email preview</a>
                </div>
            )}
            {portal?.activationLink && !sent && (
                <div className="cc-invite-row">
                    <span>Activation link</span>
                    <button type="button" className="cc-btn cc-btn--small" onClick={copy}>
                        {copied ? "Copied" : "Copy link"}
                    </button>
                </div>
            )}
        </div>
    );
}

export function AssignDialog({ request, staff, onClose, onSave }) {
    const [staffId, setStaffId] = useState(() => {
        const current = staff.find((person) => String(person.id) === String(request.assignedTo));
        return current ? String(current.id) : "";
    });
    const [scheduledDate, setScheduledDate] = useState(() => (request.scheduledDate ? String(request.scheduledDate).slice(0, 10) : ""));
    const [note, setNote] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const submit = async (event) => {
        event.preventDefault();
        if (!staffId) {
            setError("Choose a staff member");
            return;
        }
        setSaving(true);
        setError("");
        try {
            await onSave({ staffId, scheduledDate: scheduledDate || undefined, note: note.trim() || undefined });
        } catch (err) {
            setError(errorText(err, "Could not assign this request."));
            setSaving(false);
        }
    };

    return (
        <Modal
            title={request.assignedToName ? "Reassign service request" : "Assign service request"}
            subtitle={`${request.requestNumber} · ${request.serviceType}${request.productName ? ` · ${request.productName}` : ""}`}
            onClose={onClose}
        >
            <form className="cc-form" onSubmit={submit}>
                <label>
                    Operational staff *
                    <select value={staffId} onChange={(e) => setStaffId(e.target.value)} disabled={saving}>
                        <option value="">Choose staff</option>
                        {staff.map((person) => (
                            <option key={person.id} value={person.id}>
                                {person.name} ({person.email})
                            </option>
                        ))}
                    </select>
                </label>
                {!staff.length && <p className="cc-muted">No active operational staff found.</p>}
                <label>
                    Visit date
                    <input type="date" min={todayInput()} value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} disabled={saving} />
                </label>
                {request.preferredDate && <p className="cc-muted">Customer prefers {formatDate(request.preferredDate)}</p>}
                <label>
                    Note
                    <textarea rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional instructions for the staff" disabled={saving} />
                </label>
                {error && <Notice notice={{ type: "error", text: error }} />}
                <div className="cc-actions">
                    <button type="button" className="cc-btn" onClick={onClose} disabled={saving}>Cancel</button>
                    <button type="submit" className="cc-btn cc-btn--primary" disabled={saving}>{saving ? "Saving..." : "Assign"}</button>
                </div>
            </form>
        </Modal>
    );
}

export function ChargeDialog({ request, onClose, onSave }) {
    const [amount, setAmount] = useState(() => (request.charge ? String(request.charge) : ""));
    const [note, setNote] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const submit = async (event) => {
        event.preventDefault();
        const value = Number(amount);
        if (amount === "" || !Number.isFinite(value) || value < 0) {
            setError("Enter an amount, or 0 for a free service");
            return;
        }
        setSaving(true);
        setError("");
        try {
            await onSave({ amount: value, note: note.trim() || undefined });
        } catch (err) {
            setError(errorText(err, "Could not save the charge."));
            setSaving(false);
        }
    };

    return (
        <Modal title="Service charge" subtitle={`${request.requestNumber} · ${request.serviceType}`} onClose={onClose}>
            <form className="cc-form" onSubmit={submit}>
                <label>
                    Amount (₹) *
                    <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0 for free service" disabled={saving} />
                </label>
                <label>
                    Note
                    <input maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional, e.g. filter + labour" disabled={saving} />
                </label>
                <p className="cc-muted">The customer pays this online from the customer portal.</p>
                {error && <Notice notice={{ type: "error", text: error }} />}
                <div className="cc-actions">
                    <button type="button" className="cc-btn" onClick={onClose} disabled={saving}>Cancel</button>
                    <button type="submit" className="cc-btn cc-btn--primary" disabled={saving}>{saving ? "Saving..." : "Save charge"}</button>
                </div>
            </form>
        </Modal>
    );
}
