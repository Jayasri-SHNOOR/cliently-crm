import "./Announcements.css";
export default function Announcements({
  activePage,
  announcements,
  announcementsLoading,
  announcementError,
  setAnnouncementError,
  announcementMessage,
  setAnnouncementMessage,
  refreshAnnouncements,
  announcementFormOpen,
  setAnnouncementFormOpen,
  announcementDraft,
  setAnnouncementDraft,
  announcementSaving,
  createAnnouncement,
  announcementFilter,
  setAnnouncementFilter,
  announcementQuery,
  setAnnouncementQuery,
  announcementTypeFilter,
  setAnnouncementTypeFilter,
  announcementSort,
  setAnnouncementSort,
  publishingAnnouncementId,
  publishAnnouncement
}) {
  return (
    <>
{/* ANNOUNCEMENTS */}
{activePage === "announcements" && (
  <section className="dashboard-section" id="announcements">
    <style>{`
      .announcement-feedback{padding:12px 15px;border-radius:10px;margin:12px 0;font-size:13px}
      .announcement-feedback.error{background:#fff0ef;color:#a33b32;border:1px solid #f1c5c1}
      .announcement-feedback.success{background:#eaf8f2;color:#24775a;border:1px solid #bde6d4}
      .announcement-compose-panel{margin:18px 0;padding:22px;border:1px solid #cfe4df;border-radius:18px;background:#fff;box-shadow:0 12px 30px rgba(18,60,58,.07)}
      .announcement-compose-panel h3{margin:0;color:#183735}
      .announcement-compose-panel p{margin:5px 0 0;color:#637875;font-size:13px}
      .announcement-form-field{display:grid;gap:7px;margin:13px 0;color:#35514e;font-size:12px;font-weight:700}
      .announcement-form-field input,.announcement-form-field textarea,.announcement-form-field select,.announcement-search{width:100%;box-sizing:border-box;padding:11px 12px;border:1px solid #cfe0dc;border-radius:10px;background:#fff;color:#183735;font:inherit;outline:none}
      .announcement-form-field input:focus,.announcement-form-field textarea:focus,.announcement-form-field select:focus,.announcement-search:focus{border-color:#55b9a8;box-shadow:0 0 0 3px rgba(85,185,168,.13)}
      .announcement-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
      .announcement-form-actions{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:14px}
      .announcement-form-actions span{color:#637875;font-size:11px}
      .announcement-toolbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
      .announcement-search{max-width:290px}
      .announcement-empty{padding:45px 20px;text-align:center;color:#35514e}
      .announcement-empty p{color:#637875;font-size:13px}
      .announcement-row{align-items:flex-start}
      @media(max-width:700px){.announcement-form-grid{grid-template-columns:1fr}.announcement-form-actions{align-items:flex-start;flex-direction:column}.announcement-search{max-width:none;flex:1 1 100%}}
    `}</style>
    <div className="section-heading section-heading-row">
      <div>
        <p className="section-eyebrow">PLATFORM COMMUNICATION</p>
        <h2>Announcements</h2>
        <p>Create and publish platform updates for your Cliently workspace.</p>
      </div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        <button type="button" className="secondary-button" onClick={refreshAnnouncements} disabled={announcementsLoading}>
          {announcementsLoading ? "Refreshing..." : "↻ Refresh"}
        </button>
        <button type="button" className="primary-button" onClick={() => {setAnnouncementError("");setAnnouncementMessage("");setAnnouncementFormOpen(true);}}>
          + New Announcement
        </button>
      </div>
    </div>

    {announcementError && <div className="announcement-feedback error" role="alert">{announcementError}</div>}
    {announcementMessage && <div className="announcement-feedback success" role="status">{announcementMessage}</div>}

    <div className="announcement-summary">
      <div className="announcement-summary-card"><div><span>Total Announcements</span><strong>{announcements.length}</strong></div><div className="announcement-summary-icon">A</div></div>
      <div className="announcement-summary-card"><div><span>Published</span><strong className="announcement-published-count">{announcements.filter((item) => item.status === "Published").length}</strong></div><div className="announcement-summary-icon published">✓</div></div>
      <div className="announcement-summary-card"><div><span>Drafts</span><strong>{announcements.filter((item) => item.status === "Draft").length}</strong></div><div className="announcement-summary-icon draft">D</div></div>
    </div>

    {announcementFormOpen && (
      <form className="announcement-compose-panel" onSubmit={createAnnouncement}>
        <div className="section-heading-row" style={{marginBottom:16}}>
          <div><p className="section-eyebrow">NEW PLATFORM MESSAGE</p><h3>Create announcement</h3><p>Save as a draft or publish immediately.</p></div>
          <button type="button" className="secondary-button" onClick={() => setAnnouncementFormOpen(false)}>Close</button>
        </div>
        <label className="announcement-form-field">Title
          <input required maxLength={200} value={announcementDraft.title} onChange={(event) => setAnnouncementDraft((current) => ({...current,title:event.target.value}))} placeholder="e.g. Scheduled platform maintenance" />
        </label>
        <label className="announcement-form-field">Message
          <textarea required maxLength={2000} rows={5} value={announcementDraft.message} onChange={(event) => setAnnouncementDraft((current) => ({...current,message:event.target.value}))} placeholder="Write the announcement details..." />
        </label>
        <div className="announcement-form-grid">
          <label className="announcement-form-field">Announcement type
            <select value={announcementDraft.type} onChange={(event) => setAnnouncementDraft((current) => ({...current,type:event.target.value}))}>
              <option value="General">General</option><option value="Maintenance">Maintenance</option><option value="Update">Update</option><option value="Important">Important</option>
            </select>
          </label>
          <label className="announcement-form-field">Save as
            <select value={announcementDraft.status} onChange={(event) => setAnnouncementDraft((current) => ({...current,status:event.target.value}))}>
              <option value="Draft">Draft</option><option value="Published">Published</option>
            </select>
          </label>
        </div>
        <div className="announcement-form-actions">
          <span>Saved directly to your announcements database.</span>
          <button type="submit" className="primary-button" disabled={announcementSaving}>{announcementSaving ? "Saving..." : announcementDraft.status === "Published" ? "Create & Publish" : "Save Draft"}</button>
        </div>
      </form>
    )}

    <div className="announcement-toolbar">
      <div className="announcement-tabs">
        {["All", "Published", "Drafts"].map((filter) => (
          <button type="button" key={filter} className={`announcement-tab ${announcementFilter === filter ? "active" : ""}`} onClick={() => setAnnouncementFilter(filter)}>{filter}</button>
        ))}
      </div>
      <input className="announcement-search" type="search" value={announcementQuery} onChange={(event) => setAnnouncementQuery(event.target.value)} placeholder="Search title or message..." />
      <select className="announcement-filter" value={announcementTypeFilter} onChange={(event) => setAnnouncementTypeFilter(event.target.value)}>
        <option value="All">All types</option><option value="General">General</option><option value="Maintenance">Maintenance</option><option value="Update">Update</option><option value="Important">Important</option>
      </select>
      <select className="announcement-filter" value={announcementSort} onChange={(event) => setAnnouncementSort(event.target.value)}>
        <option value="latest">Latest first</option><option value="oldest">Oldest first</option>
      </select>
    </div>

    <div className="announcement-panel">
      {announcementsLoading ? <p>Loading announcements from database...</p> : (() => {
        let visible = announcements.filter((item) => {
          const statusMatch = announcementFilter === "All" || String(item.status || "Draft").toLowerCase() === announcementFilter.toLowerCase().replace(/s$/, "");
          const typeMatch = announcementTypeFilter === "All" || String(item.type || "General").toLowerCase() === announcementTypeFilter.toLowerCase();
          const query = announcementQuery.trim().toLowerCase();
          const queryMatch = !query || [item.title, item.message].some((value) => String(value || "").toLowerCase().includes(query));
          return statusMatch && typeMatch && queryMatch;
        });
        visible = [...visible].sort((a,b) => {
          const aDate = new Date(a.publishedAt || a.updatedAt || a.createdAt || 0).getTime();
          const bDate = new Date(b.publishedAt || b.updatedAt || b.createdAt || 0).getTime();
          return announcementSort === "latest" ? bDate - aDate : aDate - bDate;
        });
        if (!visible.length) return <div className="announcement-empty"><strong>{announcements.length ? "No matching announcements" : "No announcements yet"}</strong><p>{announcements.length ? "Try changing your search or filters." : "Create your first platform announcement to get started."}</p></div>;
        return visible.map((item) => {
          const status = String(item.status || "Draft");
          const type = String(item.type || "General");
          const date = item.publishedAt || item.updatedAt || item.createdAt;
          return <article className="announcement-row" key={item._id || `${item.title}-${date || "item"}`}>
            <div className={`announcement-type ${type.toLowerCase()}`}>{type.slice(0,1).toUpperCase()}</div>
            <div className="announcement-main">
              <div className="announcement-title-line"><h3>{item.title || "Untitled announcement"}</h3><span className={`announcement-status ${status.toLowerCase()}`}>{status}</span></div>
              <p>{item.message || "No message provided."}</p>
              <div className="announcement-details"><span>{type}</span><span>•</span><span>{date ? `${status === "Published" ? "Published" : "Created"} ${new Date(date).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}` : "Date unavailable"}</span></div>
              {status === "Draft" && <button type="button" className="secondary-button" disabled={publishingAnnouncementId === String(item._id)} onClick={() => publishAnnouncement(item)}>{publishingAnnouncementId === String(item._id) ? "Publishing..." : "Publish announcement"}</button>}
            </div>
          </article>;
        });
      })()}
    </div>
    <div className="announcement-footer"><span>Showing {announcements.filter((item) => {
      const statusMatch = announcementFilter === "All" || String(item.status || "Draft").toLowerCase() === announcementFilter.toLowerCase().replace(/s$/, "");
      const typeMatch = announcementTypeFilter === "All" || String(item.type || "General").toLowerCase() === announcementTypeFilter.toLowerCase();
      const query = announcementQuery.trim().toLowerCase();
      return statusMatch && typeMatch && (!query || [item.title,item.message].some((value) => String(value || "").toLowerCase().includes(query)));
    }).length} of {announcements.length} announcements · live database records</span></div>
  </section>
)}
 
    </>
  );
}