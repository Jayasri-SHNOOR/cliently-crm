import { useState } from 'react'
import PageHeader from '../../../shared/ui/PageHeader'
import Panel from '../../../shared/ui/Panel'
import '../../../shared/ui/ui.css'

export default function Settings() {
  const [saved, setSaved] = useState(false)
  return (
    <main className="ui-page">
      <PageHeader title="Profile & Settings" subtitle="Manage your personal preferences" />
      <Panel title="Profile">
        <div className="ui-form">
          <label className="ui-field">Full name<input className="ui-input" defaultValue="" /></label>
          <label className="ui-field">Email<input className="ui-input" type="email" /></label>
          <label className="ui-field">Phone<input className="ui-input" /></label>
          <label className="ui-field">Role<input className="ui-input" value="Manager" disabled readOnly /></label>
          <label className="ui-check"><input type="checkbox" defaultChecked /> Email me overdue follow-up reminders</label>
          <label className="ui-check"><input type="checkbox" defaultChecked /> Notify me about new enquiries</label>
        </div>
        <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="ui-btn" onClick={() => setSaved(true)}>Save changes</button>
          {saved && <span className="ui-empty">Saved (mock — not stored yet).</span>}
        </div>
      </Panel>
    </main>
  )
}