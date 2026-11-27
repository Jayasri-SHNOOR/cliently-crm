import { useState } from "react";
import { Plus } from "lucide-react";
import PageHeader from "../../../shared/ui/PageHeader";
import Panel from "../../../shared/ui/Panel";
import StatusBadge from "../../../shared/ui/StatusBadge";
import PageState from "../../../shared/ui/PageState";
import "../../../shared/ui/ui.css";
import { salesCare } from "../../customer-care/careApi";
import { Modal, Notice } from "../../customer-care/CareParts";
import { errorMessage, formatDate, salesApi, toDateTimeInput } from "../services/salesApi";
import useLoad from "../services/useLoad";

function loadCalendar() {
  return Promise.all([
    salesApi.meetings(),
    salesApi.tasks(),
    salesCare.listCustomers().catch(() => ({ customers: [] })),
  ]).then(([meetings, tasks, customers]) => ({
    meetings: meetings.activities || [],
    tasks: (tasks.tasks || []).filter((t) => t.dueDate && t.status !== "Completed"),
    customers: customers.customers || [],
    now: Date.now(),
  }));
}

function dayKey(value) {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dayLabel(key) {
  return new Date(`${key}T00:00:00`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });
}

function timeOf(value) {
  return new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function MeetingForm({ meeting, customers, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({
    description: meeting?.description || "",
    activityDate: toDateTimeInput(meeting?.activityDate),
    customerId: meeting?.customerId?._id || meeting?.customerId || "",
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!form.description.trim()) return setError("What is the meeting about?");
    if (!form.activityDate) return setError("Choose a date and time");
    setSaving(true);
    setError("");
    const body = {
      description: form.description.trim(),
      activityDate: new Date(form.activityDate).toISOString(),
      customerId: form.customerId || null,
    };
    try {
      const result = meeting ? await salesApi.updateMeeting(meeting._id, body) : await salesApi.createMeeting(body);
      onSaved(result.message);
    } catch (err) {
      setError(errorMessage(err, "Could not save the meeting."));
      setSaving(false);
    }
  };

  return (
    <Modal title={meeting ? "Edit meeting" : "Add meeting"} onClose={onClose}>
      <form className="cc-form" onSubmit={submit}>
        <label>About *<input name="description" value={form.description} onChange={change} maxLength={500} placeholder="e.g. Product demo" disabled={saving} /></label>
        <label>Date and time *<input type="datetime-local" name="activityDate" value={form.activityDate} onChange={change} disabled={saving} /></label>
        <label>
          Customer
          <select name="customerId" value={form.customerId} onChange={change} disabled={saving}>
            <option value="">No customer</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.customerCode})</option>)}
          </select>
        </label>
        {error && <Notice notice={{ type: "error", text: error }} />}
        <div className="cc-actions">
          <button type="button" className="cc-btn" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="cc-btn cc-btn--primary" disabled={saving}>{saving ? "Saving..." : "Save meeting"}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Calendar() {
  const { data, loading, error, reload } = useLoad(loadCalendar);
  const [dialog, setDialog] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busyId, setBusyId] = useState(null);

  if (loading || error) return <PageState loading={loading} error={error} onRetry={reload} />;

  const act = async (id, action) => {
    setBusyId(id);
    setNotice(null);
    try {
      const result = await action();
      setNotice({ type: "success", text: result.message });
      reload();
    } catch (err) {
      setNotice({ type: "error", text: errorMessage(err) });
    } finally {
      setBusyId(null);
    }
  };

  const todayStart = new Date(data.now);
  todayStart.setHours(0, 0, 0, 0);

  const upcomingMeetings = data.meetings.filter((m) => m.status === "Pending" && new Date(m.activityDate) >= todayStart);
  const pastMeetings = data.meetings.filter((m) => !upcomingMeetings.includes(m)).reverse().slice(0, 10);

  const agenda = {};
  for (const m of upcomingMeetings) (agenda[dayKey(m.activityDate)] ||= []).push({ kind: "meeting", at: m.activityDate, item: m });
  for (const t of data.tasks) {
    const key = new Date(t.dueDate) < todayStart ? dayKey(todayStart) : dayKey(t.dueDate);
    (agenda[key] ||= []).push({ kind: "task", at: t.dueDate, item: t });
  }
  const days = Object.keys(agenda).sort();

  return (
    <main className="ui-page">
      <PageHeader
        title="Calendar" subtitle="Your meetings and task due dates"
        actions={<button className="ui-btn" onClick={() => setDialog({ meeting: null })}><Plus size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />Add meeting</button>}
      />
      <Notice notice={notice} onClose={() => setNotice(null)} />

      <Panel title="Upcoming" subtitle="Overdue tasks are shown under today">
        {days.length === 0 && <p className="ui-empty">Nothing scheduled. Add a meeting or give your tasks a due date.</p>}
        {days.map((key) => (
          <div key={key} style={{ marginBottom: 14 }}>
            <h3 style={{ margin: "6px 0 8px", fontSize: 13, fontWeight: 800, color: "var(--deep-teal)" }}>{dayLabel(key)}</h3>
            {agenda[key]
              .sort((a, b) => new Date(a.at) - new Date(b.at))
              .map(({ kind, item }) =>
                kind === "meeting" ? (
                  <div className="ui-list-item" key={`m-${item._id}`}>
                    <div>
                      <strong>{timeOf(item.activityDate)} · {item.description}</strong>
                      <span>{item.customerId?.name ? `With ${item.customerId.name}` : "Meeting"}</span>
                    </div>
                    <div className="cc-row-actions">
                      <button type="button" className="cc-btn cc-btn--small cc-btn--primary" disabled={busyId === item._id} onClick={() => act(item._id, () => salesApi.updateMeeting(item._id, { status: "Completed" }))}>Done</button>
                      <button type="button" className="cc-btn cc-btn--small" disabled={busyId === item._id} onClick={() => setDialog({ meeting: item })}>Edit</button>
                      <button type="button" className="cc-btn cc-btn--small cc-btn--danger" disabled={busyId === item._id} onClick={() => act(item._id, () => salesApi.updateMeeting(item._id, { status: "Cancelled" }))}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="ui-list-item" key={`t-${item._id}`}>
                    <div>
                      <strong>Task · {item.title}</strong>
                      <span>Due {formatDate(item.dueDate)} · {item.status}</span>
                    </div>
                    <StatusBadge status={new Date(item.dueDate) < todayStart ? "Overdue" : item.priority} />
                  </div>
                )
              )}
          </div>
        ))}
      </Panel>

      <Panel title="Past & cancelled meetings">
        {pastMeetings.length === 0 && <p className="ui-empty">No past meetings.</p>}
        {pastMeetings.map((m) => (
          <div className="ui-list-item" key={m._id}>
            <div><strong>{m.description}</strong><span>{formatDate(m.activityDate)}{m.customerId?.name ? ` · ${m.customerId.name}` : ""}</span></div>
            <div className="cc-row-actions">
              <StatusBadge status={m.status} />
              <button type="button" className="cc-btn cc-btn--small cc-btn--danger" disabled={busyId === m._id} onClick={() => act(m._id, () => salesApi.deleteMeeting(m._id))}>Delete</button>
            </div>
          </div>
        ))}
      </Panel>

      {dialog && (
        <MeetingForm
          meeting={dialog.meeting}
          customers={data.customers}
          onClose={() => setDialog(null)}
          onSaved={(message) => {
            setDialog(null);
            setNotice({ type: "success", text: message });
            reload();
          }}
        />
      )}
    </main>
  );
}
