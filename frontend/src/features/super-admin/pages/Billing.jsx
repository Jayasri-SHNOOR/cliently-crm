import "./Billing.css";
export default function Billing({
  activePage,
  subscriptions,
  subscriptionsLoading,
  subscriptionsError,
  refreshSubscriptions,
  activeSubscriptions,
  attentionSubscriptions,
  monthlyRecurringRevenue,
  formatINR,
  subscriptionActionError,
  subscriptionActionMessage,
  subscriptionQuery,
  setSubscriptionQuery,
  subscriptionStatusFilter,
  setSubscriptionStatusFilter,
  subscriptionPlanFilter,
  setSubscriptionPlanFilter,
  subscriptionCycleFilter,
  setSubscriptionCycleFilter,
  filteredSubscriptions,
  openSubscriptionForm,
  selectedSubscription,
  setSelectedSubscription,
  subscriptionDialogOpen,
  setSubscriptionDialogOpen,
  subscriptionDialogMode,
  subscriptionDraft,
  setSubscriptionDraft,
  subscriptionSaving,
  saveSubscription,
  cancelSubscription
}) {
  return (
    <>
{/* SUBSCRIPTION & BILLING — live CRUD using the existing subscriptions API */}
        {activePage === "billing" && (
          <section className="dashboard-section sa-billing-page" id="billing">
            <style>{`
              .sa-billing-page .sa-billing-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin:20px 0}
              .sa-billing-page .sa-billing-kpi{background:var(--card-bg,#fff);border:1px solid var(--border,#cfe4df);border-radius:15px;padding:18px;min-width:0}
              .sa-billing-page .sa-billing-kpi span{display:block;color:var(--muted-text,#637875);font-size:12px;font-weight:650}
              .sa-billing-page .sa-billing-kpi strong{display:block;color:var(--deep-teal,#123c3a);font-size:25px;margin:8px 0 4px;overflow-wrap:anywhere}
              .sa-billing-page .sa-billing-kpi small{color:var(--muted-text,#637875);font-size:11px}
              .sa-billing-page .sa-billing-toolbar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;padding:15px;margin:18px 0;background:var(--card-bg,#fff);border:1px solid var(--border,#cfe4df);border-radius:14px}
              .sa-billing-page .sa-billing-toolbar input,.sa-billing-page .sa-billing-toolbar select,.sa-billing-page .sa-billing-form input,.sa-billing-page .sa-billing-form select{min-height:41px;border:1px solid var(--border,#cfe4df);border-radius:9px;padding:9px 11px;background:var(--soft-bg,#f4faf8);color:var(--dark-text,#183735)}
              .sa-billing-page .sa-billing-toolbar input{flex:1;min-width:200px}.sa-billing-page .sa-billing-toolbar select{min-width:130px}
              .sa-billing-page .sa-billing-table{width:100%;min-width:950px;border-collapse:collapse}.sa-billing-page .sa-billing-table th,.sa-billing-page .sa-billing-table td{padding:13px 12px;border-bottom:1px solid var(--border,#cfe4df);text-align:left;font-size:13px}.sa-billing-page .sa-billing-table th{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted-text,#637875)}
              .sa-billing-page .sa-billing-status{display:inline-flex;border-radius:20px;padding:5px 9px;background:#e8f7ef;color:#236348;font-size:11px;font-weight:750}.sa-billing-page .sa-billing-status.trial{background:#eaf2ff;color:#315c9b}.sa-billing-page .sa-billing-status.past-due{background:#fff2dc;color:#8a5a00}.sa-billing-page .sa-billing-status.cancelled{background:#fdeaea;color:#a43b3b}
              .sa-billing-page .sa-billing-action{border:1px solid var(--border,#cfe4df);border-radius:8px;padding:7px 9px;background:var(--pale-mint,#ddf6f1);color:var(--deep-teal,#123c3a);font-weight:650;cursor:pointer}
              .sa-billing-page .sa-billing-overlay{position:fixed;inset:0;z-index:3100;background:rgba(10,28,27,.55);display:flex;align-items:center;justify-content:center;padding:18px}.sa-billing-page .sa-billing-dialog{width:min(650px,100%);max-height:90vh;overflow:auto;background:var(--card-bg,#fff);color:var(--dark-text,#183735);border-radius:18px;padding:22px;box-shadow:0 24px 70px #0003}
              .sa-billing-page .sa-billing-form{display:grid;grid-template-columns:1fr 1fr;gap:13px}.sa-billing-page .sa-billing-form label{display:grid;gap:6px;font-size:12px;font-weight:700;color:var(--muted-text,#637875)}.sa-billing-page .sa-billing-form input,.sa-billing-page .sa-billing-form select{width:100%;box-sizing:border-box}.sa-billing-page .sa-billing-form .full{grid-column:1/-1}
              @media(max-width:850px){.sa-billing-page .sa-billing-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.sa-billing-page .sa-billing-kpis{grid-template-columns:1fr 1fr}.sa-billing-page .sa-billing-form{grid-template-columns:1fr}.sa-billing-page .sa-billing-form .full{grid-column:auto}}
            `}</style>
            <div className="section-heading section-heading-row">
              <div><p className="section-eyebrow">FINANCIAL MANAGEMENT</p><h2>Subscription &amp; Billing</h2><p>Manage company subscriptions, billing cycles and account status.</p></div>
              <div style={{display:"flex",gap:9,flexWrap:"wrap"}}><button type="button" className="secondary-button" onClick={refreshSubscriptions} disabled={subscriptionsLoading}>{subscriptionsLoading ? "Refreshing…" : "↻ Refresh"}</button><button type="button" className="primary-button" onClick={() => openSubscriptionForm("create")}>＋ Add Subscription</button></div>
            </div>
            {subscriptionsError && <p role="alert" style={{color:"#b42318",margin:"12px 0"}}>{subscriptionsError}</p>}
            {subscriptionActionError && <p role="alert" style={{color:"#b42318",margin:"12px 0"}}>{subscriptionActionError}</p>}
            {subscriptionActionMessage && <p role="status" style={{color:"#236348",margin:"12px 0"}}>{subscriptionActionMessage}</p>}
            <div className="sa-billing-kpis">
              <div className="sa-billing-kpi"><span>Total Subscriptions</span><strong>{subscriptionsLoading ? "…" : subscriptions.length}</strong><small>All saved records</small></div>
              <div className="sa-billing-kpi"><span>Active Subscriptions</span><strong>{subscriptionsLoading ? "…" : activeSubscriptions.length}</strong><small>Currently active</small></div>
              <div className="sa-billing-kpi"><span>Monthly Recurring Revenue</span><strong>{subscriptionsLoading ? "…" : formatINR(monthlyRecurringRevenue)}</strong><small>Quarterly / 3 · Yearly / 12</small></div>
              <div className="sa-billing-kpi"><span>Needs Attention</span><strong>{subscriptionsLoading ? "…" : attentionSubscriptions.length}</strong><small>Trial or past-due records</small></div>
            </div>
            <div className="billing-alert"><div className="billing-alert-indicator">!</div><div><strong>Subscription status overview</strong><p>{subscriptionsLoading ? "Checking subscription statuses…" : `${subscriptions.filter(x => String(x.status).toLowerCase() === "trial").length} trial · ${subscriptions.filter(x => String(x.status).toLowerCase() === "past due").length} past due · ${subscriptions.filter(x => String(x.status).toLowerCase() === "cancelled").length} cancelled`}</p></div></div>
            <div className="dashboard-card" style={{marginTop:18}}>
              <div className="table-header"><div><h3>Subscription Directory</h3><p>Records loaded from MongoDB · showing up to 100 latest records</p></div><span className="integration-count">{filteredSubscriptions.length} shown / {subscriptions.length} loaded</span></div>
              <div className="sa-billing-toolbar">
                <input aria-label="Search subscriptions" placeholder="Search company or plan…" value={subscriptionQuery} onChange={e=>setSubscriptionQuery(e.target.value)}/>
                <select aria-label="Filter subscription status" value={subscriptionStatusFilter} onChange={e=>setSubscriptionStatusFilter(e.target.value)}><option>All</option><option>Active</option><option>Trial</option><option>Past Due</option><option>Cancelled</option></select>
                <select aria-label="Filter subscription plan" value={subscriptionPlanFilter} onChange={e=>setSubscriptionPlanFilter(e.target.value)}><option>All</option>{[...new Set(subscriptions.map(x=>x.plan).filter(Boolean))].map(plan=><option key={plan}>{plan}</option>)}</select>
                <select aria-label="Filter billing cycle" value={subscriptionCycleFilter} onChange={e=>setSubscriptionCycleFilter(e.target.value)}><option>All</option><option>Monthly</option><option>Quarterly</option><option>Yearly</option></select>
              </div>
              <div className="table-wrapper"><table className="sa-billing-table"><thead><tr><th>Company</th><th>Plan</th><th>Cycle</th><th>Amount</th><th>Status</th><th>Start Date</th><th>End Date</th><th>Actions</th></tr></thead><tbody>
                {subscriptionsLoading ? <tr><td colSpan={8}>Loading subscriptions from MongoDB…</td></tr> : subscriptionsError ? <tr><td colSpan={8}>Could not load subscription records.</td></tr> : filteredSubscriptions.length === 0 ? <tr><td colSpan={8}>No matching subscriptions. Change filters or add a subscription.</td></tr> : filteredSubscriptions.map((item,index)=><tr key={item._id || `${item.company}-${index}`}><td><strong>{item.company || "Unnamed company"}</strong></td><td>{item.plan || "—"}</td><td>{item.billingCycle || "Monthly"}</td><td>{formatINR(item.amount)}</td><td><span className={`sa-billing-status ${String(item.status || "Active").toLowerCase().replace(/\s+/g,"-")}`}>{item.status || "Active"}</span></td><td>{item.startDate ? new Date(item.startDate).toLocaleDateString("en-IN") : "—"}</td><td>{item.endDate ? new Date(item.endDate).toLocaleDateString("en-IN") : "—"}</td><td><div style={{display:"flex",gap:6}}><button type="button" className="sa-billing-action" onClick={()=>setSelectedSubscription(item)}>View</button><button type="button" className="sa-billing-action" onClick={()=>{setSelectedSubscription(item);openSubscriptionForm("edit",item);}}>Edit</button></div></td></tr>)}
              </tbody></table></div>
            </div>
            
            {subscriptionDialogOpen && <div className="sa-billing-overlay" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setSubscriptionDialogOpen(false);}}><section className="sa-billing-dialog" role="dialog" aria-modal="true" aria-labelledby="subscription-form-title"><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginBottom:16}}><div><p className="section-eyebrow">SUBSCRIPTION RECORD</p><h2 id="subscription-form-title" style={{margin:0}}>{subscriptionDialogMode === "edit" ? "Edit Subscription" : "Create Subscription"}</h2></div><button type="button" className="secondary-button" onClick={()=>setSubscriptionDialogOpen(false)}>Close</button></div>
              <form className="sa-billing-form" onSubmit={saveSubscription}>
                <label className="full">Company name<input required maxLength={150} value={subscriptionDraft.company} onChange={e=>setSubscriptionDraft(d=>({...d,company:e.target.value}))} placeholder="Enter company name"/></label>
                <label>Plan<input required maxLength={100} value={subscriptionDraft.plan} onChange={e=>setSubscriptionDraft(d=>({...d,plan:e.target.value}))} placeholder="Enter plan name"/></label>
                <label>Amount (INR)<input required type="number" min="0" step="0.01" value={subscriptionDraft.amount} onChange={e=>setSubscriptionDraft(d=>({...d,amount:e.target.value}))} placeholder="0.00"/></label>
                <label>Status<select value={subscriptionDraft.status} onChange={e=>setSubscriptionDraft(d=>({...d,status:e.target.value}))}><option>Active</option><option>Trial</option><option>Past Due</option><option>Cancelled</option></select></label>
                <label>Billing cycle<select value={subscriptionDraft.billingCycle} onChange={e=>setSubscriptionDraft(d=>({...d,billingCycle:e.target.value}))}><option>Monthly</option><option>Quarterly</option><option>Yearly</option></select></label>
                <label>Start date<input required type="date" value={subscriptionDraft.startDate} onChange={e=>setSubscriptionDraft(d=>({...d,startDate:e.target.value}))}/></label>
                <label>End date<input type="date" value={subscriptionDraft.endDate} onChange={e=>setSubscriptionDraft(d=>({...d,endDate:e.target.value}))}/></label>
                {subscriptionActionError && <p className="full" role="alert" style={{color:"#b42318"}}>{subscriptionActionError}</p>}
                <div className="full" style={{display:"flex",justifyContent:"flex-end",gap:9,marginTop:8}}><button type="button" className="secondary-button" onClick={()=>setSubscriptionDialogOpen(false)}>Cancel</button><button type="submit" className="primary-button" disabled={subscriptionSaving}>{subscriptionSaving ? "Saving…" : subscriptionDialogMode === "edit" ? "Save Changes" : "Create Subscription"}</button></div>
              </form></section></div>}
            {selectedSubscription && !subscriptionDialogOpen && <div className="sa-billing-overlay" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setSelectedSubscription(null);}}><section className="sa-billing-dialog" role="dialog" aria-modal="true" aria-labelledby="subscription-detail-title"><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginBottom:18}}><div><p className="section-eyebrow">SUBSCRIPTION DETAILS</p><h2 id="subscription-detail-title" style={{margin:0}}>{selectedSubscription.company}</h2></div><button type="button" className="secondary-button" onClick={()=>setSelectedSubscription(null)}>Close</button></div><div style={{display:"grid",gridTemplateColumns:"minmax(130px,1fr) 2fr",gap:"12px 16px",fontSize:14}}><strong>Plan</strong><span>{selectedSubscription.plan}</span><strong>Amount</strong><span>{formatINR(selectedSubscription.amount)}</span><strong>Billing cycle</strong><span>{selectedSubscription.billingCycle}</span><strong>Status</strong><span>{selectedSubscription.status}</span><strong>Start date</strong><span>{selectedSubscription.startDate ? new Date(selectedSubscription.startDate).toLocaleDateString("en-IN") : "—"}</span><strong>End date</strong><span>{selectedSubscription.endDate ? new Date(selectedSubscription.endDate).toLocaleDateString("en-IN") : "—"}</span><strong>Subscription ID</strong><span style={{overflowWrap:"anywhere"}}>{selectedSubscription._id || "—"}</span></div><div style={{display:"flex",justifyContent:"flex-end",gap:9,marginTop:22}}><button type="button" className="secondary-button" onClick={()=>openSubscriptionForm("edit",selectedSubscription)}>Edit</button>{String(selectedSubscription.status).toLowerCase() !== "cancelled" && <button type="button" className="secondary-button" onClick={()=>cancelSubscription(selectedSubscription)}>Cancel Subscription</button>}</div></section></div>}
          </section>
        )}

        
    </>
  );
}