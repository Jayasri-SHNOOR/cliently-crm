import "./Tenants.css";
export default function Tenants({
  activePage,
  tenants,
  tenantsLoading,
  tenantError,
  totalTenants,
  activeTenants,
  pendingTenants,
  blockedTenants,
  refreshTenantData,
  openTenantForm,
  tenantActionError,
  tenantActionSuccess,
  tenantQuery,
  setTenantQuery,
  tenantStatusFilter,
  setTenantStatusFilter,
  tenantPlanFilter,
  setTenantPlanFilter,
  filteredTenants,
  selectedTenant,
  setSelectedTenant,
  tenantFormOpen,
  setTenantFormOpen,
  tenantFormMode,
  tenantDraft,
  setTenantDraft,
  tenantAdminNames,
  tenantSaving,
  saveTenant,
  updateTenantStatus,
  deleteTenantRecord,
}) {
  return (
    <>
<section className={`dashboard-section ${activePage === "tenants" ? "page-active" : ""}`} id="tenants">
          <style>{`
            .sa-tenant-toolbar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:18px 0;padding:16px;background:var(--card-bg,#fff);border:1px solid var(--border,#cfe4df);border-radius:16px}
            .sa-tenant-toolbar input,.sa-tenant-toolbar select,.sa-tenant-form input,.sa-tenant-form select{border:1px solid var(--border,#cfe4df);background:var(--soft-bg,#f4faf8);color:var(--dark-text,#183735);border-radius:10px;padding:11px 12px;min-height:42px;outline:none}
            .sa-tenant-toolbar input{flex:1;min-width:210px}.sa-tenant-toolbar select{min-width:140px}
            .sa-tenant-primary{border:0;border-radius:10px;background:var(--deep-teal,#123c3a);color:white;padding:11px 16px;font-weight:700;cursor:pointer}
            .sa-tenant-secondary{border:1px solid var(--border,#cfe4df);border-radius:10px;background:var(--pale-mint,#ddf6f1);color:var(--deep-teal,#123c3a);padding:10px 14px;font-weight:650;cursor:pointer}
            .sa-tenant-table-wrap{overflow:auto}.sa-tenant-table{width:100%;border-collapse:collapse;min-width:850px}.sa-tenant-table th,.sa-tenant-table td{padding:14px 13px;text-align:left;border-bottom:1px solid var(--border,#e5eeeb);font-size:13px}.sa-tenant-table th{color:var(--muted-text,#637875);font-size:11px;text-transform:uppercase;letter-spacing:.06em}.sa-tenant-table tbody tr:hover{background:var(--soft-bg,#f4faf8)}
            .sa-tenant-pill{display:inline-flex;padding:5px 9px;border-radius:999px;font-size:11px;font-weight:750;background:#eaf6f3;color:#23685e}.sa-tenant-pill.pending{background:#fff5df;color:#946200}.sa-tenant-pill.blocked{background:#fdeaea;color:#a43b3b}
            .sa-tenant-overlay{position:fixed;inset:0;z-index:3000;background:rgba(10,28,27,.55);display:flex;align-items:center;justify-content:center;padding:18px}.sa-tenant-dialog{width:min(620px,100%);max-height:90vh;overflow:auto;background:var(--card-bg,#fff);color:var(--dark-text,#183735);border-radius:18px;padding:22px;box-shadow:0 24px 70px #0003}.sa-tenant-form{display:grid;grid-template-columns:1fr 1fr;gap:13px}.sa-tenant-form label{display:grid;gap:6px;font-size:12px;font-weight:700;color:var(--muted-text,#637875)}.sa-tenant-form input,.sa-tenant-form select{width:100%;box-sizing:border-box}.sa-tenant-form .full{grid-column:1/-1}.sa-tenant-feedback{padding:10px 12px;border-radius:10px;margin:10px 0;font-size:13px;background:#fff5df;color:#815b00}.sa-tenant-feedback.success{background:#e8f7ef;color:#236348}
            @media(max-width:650px){.sa-tenant-form{grid-template-columns:1fr}.sa-tenant-form .full{grid-column:auto}}
          `}</style>
          <div className="section-heading section-heading-row">
            <div><p className="section-eyebrow">PLATFORM MANAGEMENT</p><h2>Tenant Management</h2><p>Monitor tenant accounts, manage subscriptions, and coordinate your platform team.</p></div>
            <div style={{display:"flex",gap:9,flexWrap:"wrap"}}>
              <button type="button" className="sa-tenant-secondary" onClick={() => refreshTenantData(true)} disabled={tenantsLoading}>{tenantsLoading ? "Refreshing…" : "↻ Refresh"}</button>
              <button type="button" className="sa-tenant-primary" onClick={() => openTenantForm("create")}>＋ Add Tenant</button>
            </div>
          </div>
          <div className="tenant-summary-grid">
            <div><span>Total Tenants</span><strong>{tenantsLoading ? "…" : totalTenants}</strong><small>All registered workspaces</small></div>
            <div><span>Active</span><strong>{tenantsLoading ? "…" : activeTenants}</strong><small>Currently enabled</small></div>
            <div><span>Pending</span><strong>{tenantsLoading ? "…" : pendingTenants}</strong><small>Awaiting activation</small></div>
            <div><span>Blocked</span><strong>{tenantsLoading ? "…" : blockedTenants}</strong><small>Access restricted</small></div>
          </div>
          {tenantActionError && <div className="sa-tenant-feedback" role="alert">{tenantActionError}</div>}
          {tenantActionSuccess && <div className="sa-tenant-feedback success" role="status">{tenantActionSuccess}</div>}
          <div className="sa-tenant-toolbar">
            <input aria-label="Search tenants" placeholder="Search company, administrator or email…" value={tenantQuery} onChange={(e) => setTenantQuery(e.target.value)} />
            <select aria-label="Filter by status" value={tenantStatusFilter} onChange={(e) => setTenantStatusFilter(e.target.value)}><option>All</option><option>Active</option><option>Pending</option><option>Blocked</option></select>
            <select aria-label="Filter by plan" value={tenantPlanFilter} onChange={(e) => setTenantPlanFilter(e.target.value)}><option>All</option><option>Starter</option><option>Pro</option><option>Enterprise</option></select>
            <span style={{fontSize:12,color:"var(--muted-text,#637875)"}}>{filteredTenants.length} of {tenants.length} tenants</span>
          </div>
          <div className="dashboard-card table-card">
            <div className="table-header"><div><h3>Tenant Directory</h3><p>Live records from the Super Admin tenant API · refreshes every 30 seconds</p></div><button type="button" className="text-button" onClick={() => { const csv = ["Company,Administrator,Email,Plan,Environment,Status,Created", ...filteredTenants.map(t => [t.company,t.admin,t.email,t.plan,t.environment,t.status,t.date].map(v => `"${String(v || "").replaceAll('"','""')}"`).join(","))].join("\n"); const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"}); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href=url; a.download="cliently-tenants.csv"; a.click(); URL.revokeObjectURL(url); }}>Export CSV ↓</button></div>
            <div className="sa-tenant-table-wrap"><table className="sa-tenant-table"><thead><tr><th>Company / Admin</th><th>Plan</th><th>Environment</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead><tbody>
              {tenantsLoading ? <tr><td colSpan={6}>Loading tenant records…</td></tr> : tenantError ? <tr><td colSpan={6}>{tenantError} <button type="button" className="text-button" onClick={() => refreshTenantData(true)}>Try again</button></td></tr> : filteredTenants.length === 0 ? <tr><td colSpan={6}>No matching tenants. Try changing your filters or add a tenant.</td></tr> : filteredTenants.map((tenant) => <tr key={tenant._id || tenant.company}>
                <td><div className="company-cell"><div className="company-avatar">{tenant.company?.charAt(0)?.toUpperCase() || "T"}</div><div><strong>{tenant.company}</strong><span>{tenant.admin}{tenant.email ? ` · ${tenant.email}` : ""}</span></div></div></td>
                <td><span className={`plan-badge ${String(tenant.plan).toLowerCase()}`}>{tenant.plan}</span></td><td>{tenant.environment}</td><td><span className={`sa-tenant-pill ${String(tenant.status).toLowerCase()}`}>{tenant.status}</span></td><td>{tenant.date}</td>
                <td><div style={{display:"flex",gap:7,alignItems:"center"}}><button type="button" className="table-action" onClick={() => setSelectedTenant(tenant)}>View</button><button type="button" className="table-action" onClick={() => openTenantForm("edit",tenant)}>Edit</button></div></td>
              </tr>)}
            </tbody></table></div>
          </div>

        </section>

        {tenantFormOpen && <div className="sa-tenant-overlay" role="presentation" onMouseDown={(e) => { if(e.target===e.currentTarget) setTenantFormOpen(false); }}><section className="sa-tenant-dialog" role="dialog" aria-modal="true" aria-labelledby="tenant-form-title"><div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",marginBottom:16}}><div><p className="section-eyebrow">TENANT WORKSPACE</p><h2 id="tenant-form-title" style={{margin:0}}>{tenantFormMode === "edit" ? "Edit tenant" : "Create tenant"}</h2></div><button type="button" className="sa-tenant-secondary" onClick={() => setTenantFormOpen(false)}>Close</button></div>
          <form className="sa-tenant-form" onSubmit={saveTenant}>
            {[{key:"company",label:"Company name",required:true},{key:"email",label:"Admin email"},{key:"environment",label:"Environment",required:true}].map(field=><label key={field.key} className={field.key === "email" ? "full" : ""}>{field.label}<input required={field.required} type={field.key === "email" ? "email" : "text"} value={tenantDraft[field.key] || ""} onChange={e=>setTenantDraft(d=>({...d,[field.key]:e.target.value}))} placeholder={field.label}/></label>)}
            <label>Company administrator<select required value={tenantDraft.admin} onChange={e=>setTenantDraft(d=>({...d,admin:e.target.value}))}>{!tenantAdminNames.includes(tenantDraft.admin) && tenantDraft.admin && <option>{tenantDraft.admin}</option>}{tenantAdminNames.map(name=><option key={name} value={name}>{name}</option>)}</select></label>
            <label>Subscription plan<select value={tenantDraft.plan} onChange={e=>setTenantDraft(d=>({...d,plan:e.target.value}))}><option>Starter</option><option>Pro</option><option>Enterprise</option></select></label>
            <label>Account status<select value={tenantDraft.status} onChange={e=>setTenantDraft(d=>({...d,status:e.target.value}))}><option>Active</option><option>Pending</option><option>Blocked</option></select></label>
            <label>Created date<input type="date" value={tenantDraft.date} onChange={e=>setTenantDraft(d=>({...d,date:e.target.value}))}/></label>
            {tenantActionError && <div className="sa-tenant-feedback full">{tenantActionError}</div>}
            <div className="full" style={{display:"flex",justifyContent:"flex-end",gap:9,marginTop:8}}><button type="button" className="sa-tenant-secondary" onClick={()=>setTenantFormOpen(false)}>Cancel</button><button className="sa-tenant-primary" type="submit" disabled={tenantSaving}>{tenantSaving ? "Saving…" : tenantFormMode === "edit" ? "Save changes" : "Create tenant"}</button></div>
          </form></section></div>}


        {selectedTenant && !tenantFormOpen && (
          <div className="sa-tenant-overlay" role="presentation" onMouseDown={(e) => { if(e.target===e.currentTarget) setSelectedTenant(null); }}>
            <section className="sa-tenant-dialog" role="dialog" aria-modal="true" aria-labelledby="tenant-details-title">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginBottom:18}}><div><p className="section-eyebrow">WORKSPACE PROFILE</p><h2 id="tenant-details-title" style={{margin:0}}>{selectedTenant.company}</h2></div><button type="button" className="sa-tenant-secondary" onClick={()=>setSelectedTenant(null)}>Close</button></div>
              <div style={{display:"grid",gridTemplateColumns:"minmax(110px,1fr) 2fr",gap:"12px 16px",overflowWrap:"anywhere",fontSize:14}}><strong>Administrator</strong><span>{selectedTenant.admin || "—"}</span><strong>Email</strong><span>{selectedTenant.email || "—"}</span><strong>Plan</strong><span>{selectedTenant.plan || "—"}</span><strong>Environment</strong><span>{selectedTenant.environment || "—"}</span><strong>Status</strong><span><span className={`sa-tenant-pill ${String(selectedTenant.status).toLowerCase()}`}>{selectedTenant.status}</span></span><strong>Created</strong><span>{selectedTenant.date || "—"}</span><strong>Tenant ID</strong><span>{selectedTenant._id || "—"}</span></div>
              <div style={{marginTop:22,paddingTop:16,borderTop:"1px solid var(--border,#cfe4df)"}}><strong style={{fontSize:13}}>Quick status update</strong><div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:10}}>{["Active","Pending","Blocked"].map(status=><button key={status} type="button" className="sa-tenant-secondary" disabled={String(selectedTenant.status).toLowerCase()===status.toLowerCase()} onClick={()=>updateTenantStatus(selectedTenant,status)}>{status}</button>)}</div></div>
              <div style={{display:"flex",justifyContent:"space-between",gap:8,flexWrap:"wrap",marginTop:22}}><button type="button" className="sa-tenant-secondary" onClick={()=>deleteTenantRecord(selectedTenant)}>Delete tenant</button><div style={{display:"flex",gap:8}}><button type="button" className="sa-tenant-secondary" onClick={()=>openTenantForm("edit",selectedTenant)}>Edit tenant</button><button type="button" className="sa-tenant-primary" onClick={()=>setSelectedTenant(null)}>Done</button></div></div>
            </section>
          </div>
        )}

        
    </>
  );
}