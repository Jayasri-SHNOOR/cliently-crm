import { useState } from "react";
import { Pin, PinOff, Plus } from "lucide-react";
import PageHeader from "../../../shared/ui/PageHeader";
import Panel from "../../../shared/ui/Panel";
import PageState from "../../../shared/ui/PageState";
import "../../../shared/ui/ui.css";
import { Modal, Notice } from "../../customer-care/CareParts";
import { errorMessage, formatDate, salesApi } from "../services/salesApi";
import useLoad from "../services/useLoad";

const CATEGORIES = ["General", "Customer", "Meeting", "Follow-up", "Idea"];

function NoteForm({ note, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({ title: note?.title || "", content: note?.content || "", category: note?.category || "General" }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return setError("Title and note are required");
    setSaving(true);
    setError("");
    const body = { title: form.title.trim(), content: form.content.trim(), category: form.category };
    try {
      const result = note ? await salesApi.updateNote(note._id, body) : await salesApi.createNote(body);
      onSaved(result.message);
    } catch (err) {
      setError(errorMessage(err, "Could not save the note."));
      setSaving(false);
    }
  };

  return (
    <Modal title={note ? "Edit note" : "Add note"} onClose={onClose}>
      <form className="cc-form" onSubmit={submit}>
        <label>Title *<input name="title" value={form.title} onChange={change} maxLength={150} disabled={saving} /></label>
        <label>Category<select name="category" value={form.category} onChange={change} disabled={saving}>{[...new Set([...CATEGORIES, form.category])].map((c) => <option key={c}>{c}</option>)}</select></label>
        <label>Note *<textarea name="content" rows={6} value={form.content} onChange={change} maxLength={5000} disabled={saving} /></label>
        {error && <Notice notice={{ type: "error", text: error }} />}
        <div className="cc-actions">
          <button type="button" className="cc-btn" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="cc-btn cc-btn--primary" disabled={saving}>{saving ? "Saving..." : "Save note"}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Notes() {
  const { data, loading, error, reload } = useLoad(salesApi.notes);
  const [search, setSearch] = useState("");
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

  const q = search.toLowerCase();
  const notes = (data.notes || []).filter((n) => `${n.title} ${n.content} ${n.category}`.toLowerCase().includes(q));

  return (
    <main className="ui-page">
      <PageHeader
        title="Notes" subtitle="Private notes only you can see"
        actions={<button className="ui-btn" onClick={() => setDialog({ note: null })}><Plus size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />Add note</button>}
      />
      <Notice notice={notice} onClose={() => setNotice(null)} />
      <Panel>
        <div className="ui-filters">
          <input className="ui-input" placeholder="Search notes..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {notes.length === 0 && <p className="ui-empty">No notes yet.</p>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {notes.map((n) => (
            <article key={n._id} style={{ display: "flex", flexDirection: "column", gap: 8, padding: 16, border: "1px solid var(--soft-border)", borderRadius: 12, background: n.isPinned ? "var(--light-mint-card)" : "var(--white)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <strong style={{ fontSize: 14 }}>{n.title}</strong>
                <button type="button" className="cc-icon-btn" title={n.isPinned ? "Unpin" : "Pin"} disabled={busyId === n._id} onClick={() => act(n._id, () => salesApi.updateNote(n._id, { isPinned: !n.isPinned }))}>
                  {n.isPinned ? <PinOff size={15} /> : <Pin size={15} />}
                </button>
              </div>
              <span className="ui-badge ui-badge--teal" style={{ width: "fit-content" }}>{n.category || "General"}</span>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "var(--dark-text)", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{n.content}</p>
              <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <small style={{ color: "var(--muted-text)" }}>{formatDate(n.updatedAt)}</small>
                <div className="cc-row-actions">
                  <button type="button" className="cc-btn cc-btn--small" disabled={busyId === n._id} onClick={() => setDialog({ note: n })}>Edit</button>
                  <button type="button" className="cc-btn cc-btn--small cc-btn--danger" disabled={busyId === n._id} onClick={() => { if (window.confirm(`Delete "${n.title}"?`)) act(n._id, () => salesApi.deleteNote(n._id)); }}>Delete</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Panel>
      {dialog && (
        <NoteForm
          note={dialog.note}
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