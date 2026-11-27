import { useState } from "react";
import { CheckSquare, Clock3, AlertTriangle, CheckCircle2, Plus } from "lucide-react";
import TablePage from "../../../shared/ui/TablePage";
import StatusBadge from "../../../shared/ui/StatusBadge";
import PageState from "../../../shared/ui/PageState";
import { Modal, Notice } from "../../customer-care/CareParts";
import { PRIORITIES, TASK_STATUSES, errorMessage, formatDate, salesApi, toDateInput } from "../services/salesApi";
import useLoad from "../services/useLoad";

const EMPTY = { title: "", description: "", dueDate: "", priority: "Medium", status: "Pending" };

function TaskForm({ task, onClose, onSaved }) {
  const [form, setForm] = useState(() =>
    task
      ? { title: task.title, description: task.description || "", dueDate: toDateInput(task.dueDate), priority: task.priority, status: task.status }
      : EMPTY
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) return setError("Task title is required");
    setSaving(true);
    setError("");
    const body = { ...form, title: form.title.trim(), description: form.description.trim(), dueDate: form.dueDate || null };
    try {
      const result = task ? await salesApi.updateTask(task._id, body) : await salesApi.createTask(body);
      onSaved(result.message);
    } catch (err) {
      setError(errorMessage(err, "Could not save the task."));
      setSaving(false);
    }
  };

  return (
    <Modal title={task ? "Edit task" : "Add task"} onClose={onClose}>
      <form className="cc-form" onSubmit={submit}>
        <label>Title *<input name="title" value={form.title} onChange={change} maxLength={150} disabled={saving} /></label>
        <label>Details<textarea name="description" rows={3} value={form.description} onChange={change} maxLength={1000} disabled={saving} /></label>
        <div className="cc-form-grid">
          <label>Due date<input type="date" name="dueDate" value={form.dueDate} onChange={change} disabled={saving} /></label>
          <label>Priority<select name="priority" value={form.priority} onChange={change} disabled={saving}>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select></label>
          <label>Status<select name="status" value={form.status} onChange={change} disabled={saving}>{TASK_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></label>
        </div>
        {error && <Notice notice={{ type: "error", text: error }} />}
        <div className="cc-actions">
          <button type="button" className="cc-btn" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="cc-btn cc-btn--primary" disabled={saving}>{saving ? "Saving..." : "Save task"}</button>
        </div>
      </form>
    </Modal>
  );
}

function loadTasks() {
  return salesApi.tasks().then((result) => ({ tasks: result.tasks || [], loadedAt: Date.now() }));
}

export default function Tasks() {
  const { data, loading, error, reload } = useLoad(loadTasks);
  const [dialog, setDialog] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busyId, setBusyId] = useState(null);

  if (loading || error) return <PageState loading={loading} error={error} onRetry={reload} />;

  const act = async (task, action) => {
    setBusyId(task._id);
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

  const remove = (task) => {
    if (!window.confirm(`Delete task "${task.title}"?`)) return;
    act(task, () => salesApi.deleteTask(task._id));
  };

  const rows = data.tasks.map((t) => {
    const overdue = t.status !== "Completed" && t.dueDate && new Date(t.dueDate).getTime() < data.loadedAt;
    return { ...t, id: t._id, due: formatDate(t.dueDate), overdue, state: overdue ? "Overdue" : t.status };
  });

  const columns = [
    { key: "title", label: "Task", render: (r) => (<div><strong>{r.title}</strong>{r.description && <div style={{ fontSize: 11, color: "var(--muted-text)" }}>{r.description}</div>}</div>) },
    { key: "priority", label: "Priority", render: (r) => <StatusBadge status={r.priority} /> },
    { key: "due", label: "Due" },
    {
      key: "status", label: "Status",
      render: (r) => (
        <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
          <select className="ui-select" value={r.status} disabled={busyId === r._id} onChange={(e) => act(r, () => salesApi.updateTask(r._id, { status: e.target.value }))} aria-label={`Status for ${r.title}`}>
            {TASK_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          {r.overdue && <StatusBadge status="Overdue" />}
        </span>
      ),
    },
    {
      key: "actions", label: "Actions",
      render: (r) => (
        <div className="cc-row-actions">
          <button type="button" className="cc-btn cc-btn--small" disabled={busyId === r._id} onClick={() => setDialog({ task: r })}>Edit</button>
          <button type="button" className="cc-btn cc-btn--small cc-btn--danger" disabled={busyId === r._id} onClick={() => remove(r)}>Delete</button>
        </div>
      ),
    },
  ];

  const count = (fn) => rows.filter(fn).length;

  return (
    <>
      {notice && <div style={{ padding: "16px 28px 0" }}><Notice notice={notice} onClose={() => setNotice(null)} /></div>}
      <TablePage
        title="Tasks" subtitle="Your personal to-do list"
        actions={<button className="ui-btn" onClick={() => setDialog({ task: null })}><Plus size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />Add task</button>}
        kpis={[
          { label: "Total", value: rows.length, icon: CheckSquare },
          { label: "Pending", value: count((r) => r.status !== "Completed"), icon: Clock3 },
          { label: "Overdue", value: count((r) => r.overdue), icon: AlertTriangle },
          { label: "Completed", value: count((r) => r.status === "Completed"), icon: CheckCircle2 },
        ]}
        columns={columns} rows={rows}
        filters={[
          { key: "status", label: "Statuses", options: TASK_STATUSES },
          { key: "priority", label: "Priorities", options: PRIORITIES },
        ]}
        searchKeys={["title", "description"]} searchPlaceholder="Search tasks..."
        panelTitle="My Tasks"
      />
      {dialog && (
        <TaskForm
          task={dialog.task}
          onClose={() => setDialog(null)}
          onSaved={(message) => {
            setDialog(null);
            setNotice({ type: "success", text: message });
            reload();
          }}
        />
      )}
    </>
  );
}