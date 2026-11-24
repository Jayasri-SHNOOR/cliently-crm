import "./Notifications.css";
export default function Notifications({
  activePage,
  refreshNotifications,
  notificationsLoading,
  notifications,
  setShowNotificationForm,
  showNotificationForm,
  markAllNotificationsRead,
  notificationError,
  notificationMessage,
  createNotification,
  notificationDraft,
  setNotificationDraft,
  notificationSaving,
  notificationFilter,
  setNotificationFilter,
  notificationQuery,
  setNotificationQuery,
  notificationSort,
  setNotificationSort,
  markNotificationRead
}) {
  return (
    <>
{/* NOTIFICATIONS */}
{activePage === "notifications" && (
  <section className="dashboard-section" id="notifications">
    <div className="section-heading section-heading-row">
      <div><p className="section-eyebrow">ACTIVITY CENTER</p><h2>Notifications</h2><p>Publish platform messages and track read status using live MongoDB records.</p></div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <button type="button" className="secondary-button" onClick={refreshNotifications} disabled={notificationsLoading}>↻ Refresh</button>
        <button type="button" className="primary-button" onClick={() => setShowNotificationForm((value) => !value)}>{showNotificationForm ? "Close Form" : "+ Create Notification"}</button>
        <button type="button" className="secondary-button" onClick={markAllNotificationsRead} disabled={notificationsLoading || notifications.every((item) => item.isRead)}>Mark All Read</button>
      </div>
    </div>

    {notificationError && <p role="alert" style={{color:"#c0392b",margin:"12px 0"}}>{notificationError}</p>}
    {notificationMessage && <p role="status" style={{color:"#16866f",margin:"12px 0"}}>{notificationMessage}</p>}

    {showNotificationForm && <form onSubmit={createNotification} className="notification-panel" style={{padding:18,marginBottom:18,display:"grid",gap:12}}>
      <h3 style={{margin:0}}>Create platform notification</h3>
      <input aria-label="Notification title" required maxLength={200} placeholder="Notification title" value={notificationDraft.title} onChange={(e) => setNotificationDraft((d) => ({...d,title:e.target.value}))} />
      <textarea aria-label="Notification message" required maxLength={2000} rows={3} placeholder="Write the notification message..." value={notificationDraft.message} onChange={(e) => setNotificationDraft((d) => ({...d,message:e.target.value}))} />
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        <select aria-label="Notification type" value={notificationDraft.type} onChange={(e) => setNotificationDraft((d) => ({...d,type:e.target.value}))}><option>System</option><option>Billing</option><option>Security</option><option>General</option></select>
        <select aria-label="Audience" value={notificationDraft.audience} onChange={(e) => setNotificationDraft((d) => ({...d,audience:e.target.value}))}><option>All</option><option>Admins</option><option>Tenants</option></select>
        <button type="submit" className="primary-button" disabled={notificationSaving}>{notificationSaving ? "Saving..." : "Publish Notification"}</button>
      </div>
    </form>}

    <div className="notification-summary">
      <div className="notification-summary-card"><div><span>Total Notifications</span><strong>{notifications.length}</strong></div><div className="notification-summary-icon">N</div></div>
      <div className="notification-summary-card"><div><span>Unread</span><strong className="notification-unread-count">{notifications.filter((item) => !item.isRead).length}</strong></div><div className="notification-summary-icon unread">{notifications.filter((item) => !item.isRead).length}</div></div>
      <div className="notification-summary-card"><div><span>Read</span><strong>{notifications.filter((item) => item.isRead).length}</strong></div><div className="notification-summary-icon">✓</div></div>
    </div>

    <div className="notification-toolbar" style={{gap:10,flexWrap:"wrap"}}>
      <div className="notification-tabs">{["All","Unread","Read","Billing","System"].map((filter) => <button type="button" key={filter} className={`notification-tab ${notificationFilter === filter ? "active" : ""}`} onClick={() => setNotificationFilter(filter)}>{filter}{filter === "Unread" && <span>{notifications.filter((item) => !item.isRead).length}</span>}</button>)}</div>
      <input aria-label="Search notifications" placeholder="Search title or message..." value={notificationQuery} onChange={(e) => setNotificationQuery(e.target.value)} />
      <select className="notification-filter" value={notificationSort} onChange={(e) => setNotificationSort(e.target.value)} aria-label="Sort notifications"><option value="latest">Latest first</option><option value="oldest">Oldest first</option></select>
    </div>

    <div className="notification-panel">
      {notificationsLoading ? <p style={{padding:20}}>Loading notifications from MongoDB...</p> : (() => {
        const query = notificationQuery.trim().toLowerCase();
        const filtered = notifications.filter((item) => {
          const type = String(item.type || "System");
          const text = `${item.title || ""} ${item.message || ""} ${type} ${item.audience || ""}`.toLowerCase();
          if (query && !text.includes(query)) return false;
          if (notificationFilter === "Unread") return !item.isRead;
          if (notificationFilter === "Read") return item.isRead;
          if (notificationFilter === "Billing") return /billing|payment|subscription|invoice/i.test(`${type} ${item.title} ${item.message}`);
          if (notificationFilter === "System") return /system|security|maintenance|platform/i.test(`${type} ${item.title} ${item.message}`);
          return true;
        }).sort((a,b) => notificationSort === "latest" ? new Date(b.createdAt || 0)-new Date(a.createdAt || 0) : new Date(a.createdAt || 0)-new Date(b.createdAt || 0));
        if (!filtered.length) return <p style={{padding:20}}>{notificationError ? "Notifications could not be loaded." : "No notifications match your search or filter."}</p>;
        return filtered.map((item,index) => {
          const type = String(item.type || "System");
          const categoryClass = /billing|payment/i.test(type) ? "billing" : /security/i.test(type) ? "security" : "system";
          const timestamp = item.createdAt ? new Date(item.createdAt).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"}) : "Time unavailable";
          return <div key={item._id || index} className={`notification-item ${!item.isRead ? "unread" : ""}`}>
            <div className={`notification-item-icon ${categoryClass}`}>{categoryClass === "billing" ? "$" : categoryClass === "security" ? "!" : "i"}</div>
            <div className="notification-item-content"><div className="notification-item-title"><h3>{item.title}</h3><span className={`notification-priority ${categoryClass === "billing" ? "attention" : "normal"}`}>{type}</span></div>
              <p>{item.message}</p><div className="notification-meta"><span>Audience: {item.audience || "All"}</span><span>•</span><span>{timestamp}</span></div></div>
            <div className="notification-item-actions">{!item.isRead && <span className="notification-unread-dot"/>}<button type="button" onClick={() => !item.isRead && markNotificationRead(item)} disabled={item.isRead}>{item.isRead ? "Read" : "Mark Read"}</button></div>
          </div>;
        });
      })()}
    </div>
    <div className="notification-footer"><span>{notifications.length} record(s) loaded from the notifications API</span><button type="button" className="text-button" onClick={() => {setNotificationFilter("All");setNotificationQuery("");}}>Clear filters</button></div>
  </section>
)}


    </>
  );
}