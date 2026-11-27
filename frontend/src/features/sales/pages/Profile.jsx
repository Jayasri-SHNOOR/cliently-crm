import { useState } from "react";
import PageHeader from "../../../shared/ui/PageHeader";
import Panel from "../../../shared/ui/Panel";
import PageState from "../../../shared/ui/PageState";
import "../../../shared/ui/ui.css";
import { updateCurrentUser } from "../../../lib/session";
import { Notice } from "../../customer-care/CareParts";
import { errorMessage, formatDate, salesApi } from "../services/salesApi";
import useLoad from "../services/useLoad";

function ProfileForm({ profile, onSaved }) {
  const [form, setForm] = useState({ name: profile.name || "", phone: profile.phone || "" });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const result = await salesApi.updateProfile({ name: form.name.trim(), phone: form.phone.trim() });
      updateCurrentUser({ name: result.data?.name || form.name.trim() });
      setNotice({ type: "success", text: result.message });
      onSaved();
    } catch (err) {
      setNotice({ type: "error", text: errorMessage(err, "Could not save your profile.") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <div className="ui-form">
        <label className="ui-field">Full name<input className="ui-input" name="name" value={form.name} onChange={change} maxLength={80} disabled={saving} required /></label>
        <label className="ui-field">Phone<input className="ui-input" name="phone" value={form.phone} onChange={change} maxLength={20} disabled={saving} /></label>
        <label className="ui-field">Email<input className="ui-input" value={profile.email || ""} disabled readOnly /></label>
        <label className="ui-field">Role<input className="ui-input" value="Sales Executive" disabled readOnly /></label>
      </div>
      <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <button className="ui-btn" type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</button>
      </div>
      {notice && <div style={{ marginTop: 14 }}><Notice notice={notice} onClose={() => setNotice(null)} /></div>}
    </form>
  );
}

export default function Profile() {
  const { data, loading, error, reload } = useLoad(salesApi.profile);

  if (loading || error) return <PageState loading={loading} error={error} onRetry={reload} />;

  const profile = data.data || {};

  return (
    <main className="ui-page">
      <PageHeader title="My Profile" subtitle="Your contact details" />
      <section className="ui-grid-2">
        <Panel title="Personal details" subtitle="Your name and phone are shown to your team">
          <ProfileForm key={`${profile.name}|${profile.phone}`} profile={profile} onSaved={reload} />
        </Panel>
        <Panel title="Account" subtitle="Managed by your Client Admin">
          <div className="ui-list-item"><div><strong>Company</strong><span>{profile.company?.name || profile.company?.companyName || "—"}</span></div></div>
          <div className="ui-list-item"><div><strong>Department</strong><span>{profile.department || "Sales"}</span></div></div>
          <div className="ui-list-item"><div><strong>Designation</strong><span>{profile.designation || "Sales Executive"}</span></div></div>
          <div className="ui-list-item"><div><strong>Joined</strong><span>{formatDate(profile.joiningDate || profile.createdAt)}</span></div></div>
          <div className="ui-list-item"><div><strong>Last sign-in</strong><span>{formatDate(profile.lastLoginAt)}</span></div></div>
          <p className="ui-empty" style={{ textAlign: "left" }}>To change your email or reset your password, contact your Client Admin.</p>
        </Panel>
      </section>
    </main>
  );
}
