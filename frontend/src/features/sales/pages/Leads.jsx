import { useState } from "react";
import { Users, UserPlus, CheckCircle2, CircleSlash } from "lucide-react";
import TablePage from "../../../shared/ui/TablePage";
import PageState from "../../../shared/ui/PageState";
import { inr } from "../../../shared/ui/format";
import { salesCare } from "../../customer-care/careApi";
import { InviteResult, Modal, Notice } from "../../customer-care/CareParts";
import { LEAD_STATUSES, errorMessage, formatDate, salesApi } from "../services/salesApi";
import useLoad from "../services/useLoad";

const EMPTY = { name: "", company: "", email: "", phone: "", productInterested: "", value: "", message: "" };

function LeadForm({ lead, onClose, onSaved }) {
  const [form, setForm] = useState(() =>
    lead
      ? {
          name: lead.name || "", company: lead.company || "", email: lead.email || "", phone: lead.phone || "",
          productInterested: lead.productName || lead.productInterested || "", value: lead.value ? String(lead.value) : "", message: lead.message || "",
        }
      : EMPTY
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return setError("Lead name is required");
    if (form.value && (!Number.isFinite(Number(form.value)) || Number(form.value) < 0)) return setError("Enter a valid value");
    setSaving(true);
    setError("");
    const body = {
      name: form.name.trim(), company: form.company.trim(), email: form.email.trim(), phone: form.phone.trim(),
      productInterested: form.productInterested.trim(), value: form.value ? Number(form.value) : 0, message: form.message.trim(),
    };
    try {
      const result = lead ? await salesApi.updateLead(lead._id, body) : await salesApi.createLead(body);
      onSaved(result.message);
    } catch (err) {
      setError(errorMessage(err, "Could not save the lead."));
      setSaving(false);
    }
  };

  return (
    <Modal title={lead ? "Edit lead" : "Add lead"} subtitle={lead ? lead.name : "A lead you found yourself (walk-in, call, referral)"} onClose={onClose} wide>
      <form className="cc-form" onSubmit={submit}>
        <div className="cc-form-grid">
          <label>Name *<input name="name" value={form.name} onChange={change} maxLength={120} disabled={saving} /></label>
          <label>Company<input name="company" value={form.company} onChange={change} maxLength={120} disabled={saving} /></label>
          <label>Email<input name="email" type="email" value={form.email} onChange={change} maxLength={120} disabled={saving} /></label>
          <label>Phone<input name="phone" value={form.phone} onChange={change} maxLength={20} disabled={saving} /></label>
          <label>Product interested<input name="productInterested" value={form.productInterested} onChange={change} maxLength={120} disabled={saving} /></label>
          <label>Expected value (₹)<input name="value" type="number" min="0" value={form.value} onChange={change} disabled={saving} /></label>
          <label className="cc-full">Notes<textarea name="message" rows={3} value={form.message} onChange={change} maxLength={1000} disabled={saving} /></label>
        </div>
        {error && <Notice notice={{ type: "error", text: error }} />}
        <div className="cc-actions">
          <button type="button" className="cc-btn" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="cc-btn cc-btn--primary" disabled={saving}>{saving ? "Saving..." : "Save lead"}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Leads() {
  const { data, loading, error, reload } = useLoad(salesApi.leads);
  const [dialog, setDialog] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busyId, setBusyId] = useState(null);

  if (loading || error) return <PageState loading={loading} error={error} onRetry={reload} />;

  const leads = Array.isArray(data?.data) ? data.data : [];

  const run = async (lead, action) => {
    setBusyId(lead._id);
    setNotice(null);
    try {
      await action();
    } catch (err) {
      setNotice({ type: "error", text: errorMessage(err) });
    } finally {
      setBusyId(null);
    }
  };

  const changeStatus = (lead, status) =>
    run(lead, async () => {
      const result = await salesApi.updateLead(lead._id, { status });
      setNotice({ type: "success", text: result.message });
      reload();
    });

  const convert = (lead) =>
    run(lead, async () => {
      const result = await salesCare.createCustomer({ leadId: lead._id });
      setDialog({ type: "invite", result });
      reload();
    });

  const remove = (lead) => {
    if (!window.confirm(`Delete lead ${lead.name}?`)) return;
    run(lead, async () => {
      const result = await salesApi.deleteLead(lead._id);
      setNotice({ type: "success", text: result.message });
      reload();
    });
  };

  const rows = leads.map((lead) => ({
    ...lead,
    id: lead._id,
    contact: [lead.email, lead.phone].filter(Boolean).join(" / ") || "—",
    product: lead.productName || lead.productInterested || "General enquiry",
    assigned: formatDate(lead.assignedAt || lead.createdAt),
  }));

  const columns = [
    { key: "name", label: "Lead", render: (r) => (<div><strong>{r.name}</strong><div style={{ fontSize: 11, color: "var(--muted-text)" }}>{r.company || "—"}</div></div>) },
    { key: "contact", label: "Contact" },
    { key: "product", label: "Product" },
    { key: "value", label: "Value", render: (r) => (r.value ? inr(r.value) : "—") },
    { key: "source", label: "Source" },
    {
      key: "status", label: "Status",
      render: (r) => (
        <select className="ui-select" value={r.status} disabled={busyId === r._id || r.status === "Won"} onChange={(e) => changeStatus(r, e.target.value)} aria-label={`Status for ${r.name}`}>
          {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      ),
    },
    { key: "assigned", label: "Assigned" },
    {
      key: "actions", label: "Actions",
      render: (r) => (
        <div className="cc-row-actions">
          {r.status !== "Won" && r.status !== "Lost" && (
            <button type="button" className="cc-btn cc-btn--small cc-btn--primary" disabled={busyId === r._id} onClick={() => convert(r)}>Make customer</button>
          )}
          <button type="button" className="cc-btn cc-btn--small" disabled={busyId === r._id} onClick={() => setDialog({ type: "edit", lead: r })}>Edit</button>
          {r.source === "Manual" && (
            <button type="button" className="cc-btn cc-btn--small cc-btn--danger" disabled={busyId === r._id} onClick={() => remove(r)}>Delete</button>
          )}
        </div>
      ),
    },
  ];

  const n = (status) => leads.filter((l) => l.status === status).length;

  return (
    <>
      {notice && <div style={{ padding: "16px 28px 0" }}><Notice notice={notice} onClose={() => setNotice(null)} /></div>}
      <TablePage
        title="Leads" subtitle="Leads assigned to you. Move them through the stages, then make them customers."
        actions={<button className="ui-btn" onClick={() => setDialog({ type: "add" })}><UserPlus size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />Add lead</button>}
        kpis={[
          { label: "Total Leads", value: leads.length, icon: Users },
          { label: "New", value: n("New"), icon: UserPlus },
          { label: "Won", value: n("Won"), icon: CheckCircle2 },
          { label: "Lost", value: n("Lost"), icon: CircleSlash },
        ]}
        columns={columns} rows={rows}
        filters={[{ key: "status", label: "Statuses", options: LEAD_STATUSES }]}
        searchKeys={["name", "company", "contact", "product"]} searchPlaceholder="Search leads..."
        panelTitle="My Leads"
      />

      {(dialog?.type === "add" || dialog?.type === "edit") && (
        <LeadForm
          lead={dialog.lead}
          onClose={() => setDialog(null)}
          onSaved={(message) => {
            setDialog(null);
            setNotice({ type: "success", text: message });
            reload();
          }}
        />
      )}

      {dialog?.type === "invite" && (
        <Modal title="Customer created" onClose={() => setDialog(null)}>
          <div className="cc-form">
            <InviteResult result={dialog.result} />
            <p className="cc-muted">Add the products they bought from Customers → open the customer.</p>
            <div className="cc-actions">
              <button type="button" className="cc-btn cc-btn--primary" onClick={() => setDialog(null)}>Done</button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}