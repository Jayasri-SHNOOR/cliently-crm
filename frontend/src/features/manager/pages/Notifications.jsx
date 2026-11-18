import { useState } from 'react'
import PageHeader from '../../../shared/ui/PageHeader'
import Panel from '../../../shared/ui/Panel'
import '../../../shared/ui/ui.css'
import { notifications as seed } from '../services/mockData'

export default function Notifications() {
  const [items, setItems] = useState(seed)
  return (
    <main className="ui-page">
      <PageHeader
        title="Notifications" subtitle="Reminders and important updates"
        actions={<button className="ui-btn ui-btn--ghost" onClick={() => setItems((c) => c.map((n) => ({ ...n, read: true })))}>Mark all as read</button>}
      />
      <Panel>
        {items.map((n) => (
          <div className={`ui-list-item ${n.read ? '' : 'unread'}`} key={n.id}>
            <div><strong>{n.title}</strong><span>{n.message}</span></div>
            <span>{n.time}</span>
          </div>
        ))}
      </Panel>
    </main>
  )
}