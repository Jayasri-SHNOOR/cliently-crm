import "./Overview.css";

export default function Overview({
  setActivePage,
  tenantsLoading,
  tenantError,
  totalTenants,
  activeTenants,
  activeSubscriptions,
  subscriptionsLoading,
  subscriptionsError,
  refreshSubscriptions,
  monthlyRecurringRevenue,
  formatINR,
  overviewRange,
  setOverviewRange,
  overviewMonthlyRegistrations,
  billingPlanSummary,
  latestOverviewTenants,
  setSelectedTenant
}) {
  return (
<section className="dashboard-section page-active" id="overview">
            

            <div className="section-heading section-heading-row">
              <div>
                <p className="section-eyebrow">PLATFORM ANALYTICS</p>
                <h2>Platform Overview</h2>
                <p>Live insights calculated from your Cliently platform records.</p>
              </div>
              <div className="sa-overview-toolbar">
                <span className="sa-overview-live">Live API data</span>
                <button type="button" className="secondary-button" onClick={() => { refreshSubscriptions(); }} disabled={subscriptionsLoading}>
                  {subscriptionsLoading ? "Refreshing…" : "↻ Refresh billing"}
                </button>
              </div>
            </div>

            {(tenantError || subscriptionsError) && (
              <p role="alert" className="sa-overview-error">
                {tenantError || subscriptionsError}
              </p>
            )}

            <div className="overview-grid">
              <button type="button" className="overview-card sa-overview-kpi" onClick={() => setActivePage("tenants")}>
                <div className="overview-card-top"><span>Total Tenants</span><span className="metric-icon">▣</span></div>
                <strong>{tenantsLoading ? "…" : tenantError ? "—" : totalTenants}</strong>
                <small>Registered companies · View tenants ↗</small>
              </button>
              <button type="button" className="overview-card sa-overview-kpi" onClick={() => setActivePage("tenants")}>
                <div className="overview-card-top"><span>Active Tenants</span><span className="metric-icon">✓</span></div>
                <strong>{tenantsLoading ? "…" : tenantError ? "—" : activeTenants}</strong>
                <small>Currently active companies</small>
              </button>
              <button type="button" className="overview-card sa-overview-kpi" onClick={() => setActivePage("billing")}>
                <div className="overview-card-top"><span>Active Subscriptions</span><span className="metric-icon">◇</span></div>
                <strong>{subscriptionsLoading ? "…" : subscriptionsError ? "—" : activeSubscriptions.length}</strong>
                <small>Currently active plans · View billing ↗</small>
              </button>
              <button type="button" className="overview-card sa-overview-kpi" onClick={() => setActivePage("billing")}>
                <div className="overview-card-top"><span>Monthly Recurring Revenue</span><span className="metric-icon">₹</span></div>
                <strong>{subscriptionsLoading ? "…" : subscriptionsError ? "—" : formatINR(monthlyRecurringRevenue)}</strong>
                <small>Calculated from active subscriptions</small>
              </button>
            </div>

            <div className="dashboard-card sa-overview-panel">
              <div className="sa-overview-panel-head">
                <div><h3>Tenant Registration Trends</h3><p>Monthly registrations based on recorded tenant creation dates.</p></div>
                <div className="sa-overview-range" aria-label="Tenant growth chart range">
                  {[6, 12].map((range) => (
                    <button key={range} type="button" className={overviewRange === range ? "active" : ""} onClick={() => setOverviewRange(range)} aria-pressed={overviewRange === range}>{range} months</button>
                  ))}
                </div>
              </div>
              {tenantsLoading ? <p className="sa-overview-empty">Loading tenant records…</p> : tenantError ? <p className="sa-overview-empty">Tenant growth is unavailable until the tenant API responds.</p> : (
                <div className="sa-overview-chart" style={{ gridTemplateColumns: `repeat(${overviewRange}, minmax(0, 1fr))` }}>
                  {overviewMonthlyRegistrations.map((month) => {
                    const maxCount = Math.max(1, ...overviewMonthlyRegistrations.map((item) => item.count));
                    return (
                      <div className="sa-overview-bar-col" key={month.key}>
                        <strong>{month.count}</strong>
                        <div className="sa-overview-bar-track"><div className="sa-overview-bar" style={{ height: `${Math.max(3, (month.count / maxCount) * 100)}%` }} title={`${month.label}: ${month.count} registrations`} /></div>
                        <small>{month.label}</small>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="sa-overview-note">Only tenant records with valid creation dates are included. No historical data is generated.</p>
            </div>

            <div className="sa-overview-lower">
              <div className="dashboard-card sa-overview-panel">
                <div className="sa-overview-panel-head"><div><h3>Subscription Plan Distribution</h3><p>Active subscriptions grouped by plan.</p></div></div>
                {subscriptionsLoading ? <p className="sa-overview-empty">Loading subscriptions…</p> : subscriptionsError ? <p className="sa-overview-empty">Subscription data unavailable.</p> : activeSubscriptions.length === 0 ? <p className="sa-overview-empty">No active subscriptions found.</p> : billingPlanSummary.filter((plan) => plan.subscribers > 0).map((plan) => (
                  <div className="sa-overview-plan" key={plan.name}>
                    <div className="sa-overview-plan-label"><strong>{plan.name}</strong><span>{plan.subscribers} subscriptions</span></div>
                    <div className="sa-overview-plan-track"><div className="sa-overview-plan-fill" style={{ width: `${(plan.subscribers / activeSubscriptions.length) * 100}%` }} /></div>
                  </div>
                ))}
                <button type="button" className="text-button sa-overview-link" onClick={() => setActivePage("billing")}>View subscription details →</button>
              </div>

              <div className="dashboard-card sa-overview-panel">
                <div className="sa-overview-panel-head"><div><h3>Latest Tenants</h3><p>Recently registered companies.</p></div><button type="button" className="text-button" onClick={() => setActivePage("tenants")}>View all →</button></div>
                {tenantsLoading ? <p className="sa-overview-empty">Loading tenants…</p> : tenantError ? <p className="sa-overview-empty">Tenant records unavailable.</p> : latestOverviewTenants.length === 0 ? <p className="sa-overview-empty">No tenant records with valid creation dates.</p> : latestOverviewTenants.map((tenant) => (
                  <button type="button" className="sa-overview-recent" key={tenant._id || tenant.company} onClick={() => { setSelectedTenant(tenant); setActivePage("tenants"); }}>
                    <span className="sa-overview-avatar">{tenant.company?.charAt(0)?.toUpperCase() || "T"}</span>
                    <span className="sa-overview-recent-copy"><strong>{tenant.company}</strong><small>{tenant.plan} · {tenant.status}</small></span>
                    <span aria-hidden="true">↗</span>
                  </button>
                ))}
              </div>
            </div>
          </section>
  );
}
