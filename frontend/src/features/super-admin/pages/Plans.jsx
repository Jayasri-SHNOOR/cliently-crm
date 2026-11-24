import "./Plans.css";
export default function Plans({
  activePage,
  setActivePage,
  plans,
  setPlans,
  plansLoading,
  plansError,
  setPlansError,
  plansMessage,
  setPlansMessage,
  plansSaving,
  editingPlan,
  setEditingPlan,
  planDraft,
  setPlanDraft,
  openPlanEditor,
  savePlan,
  deletePlan,
  featureDefinitions,
  featureDrafts,
  setFeatureDrafts,
  togglePlanFeature,
  saveFeatureFlags,
  FeatureState
}) {
  return (
    <>
{/* PLANS & FEATURE FLAGS — connected to the existing plans API */}
        {activePage === "features" && (
          <section className="dashboard-section features-page" id="features">
            <div className="section-heading section-heading-row">
              <div>
                <p className="section-eyebrow">PLATFORM CONFIGURATION</p>
                <h2>Plans &amp; Feature Flags</h2>
                <p>Manage subscription plan details and feature availability.</p>
              </div>
              <div style={{display:"flex",gap:9,flexWrap:"wrap"}}>
              <button type="button" className="primary-button" onClick={() => openPlanEditor(null)}>Add Plan</button>
              <button type="button" className="secondary-button" onClick={() => {
                setPlansMessage(""); setPlansError(""); setActivePage("features");
                fetch("http://localhost:5000/api/super-admin/plans").then(async (response) => {
                  const result = await response.json();
                  if (!response.ok || result.success === false) throw new Error(result.message || `Request failed: ${response.status}`);
                  const records = Array.isArray(result.data) ? result.data : Array.isArray(result.plans) ? result.plans : [];
                  setPlans(records);
                  const drafts = {};
                  records.forEach((plan) => { drafts[String(plan._id || plan.name)] = Array.isArray(plan.features) ? [...plan.features] : []; });
                  setFeatureDrafts(drafts);
                }).catch((error) => setPlansError(error.message || "Unable to refresh plans."));
              }}>Refresh Plans</button>
              </div>
            </div>

            {plansError && <p role="alert" style={{ color: "#c0392b", margin: "12px 0" }}>{plansError}</p>}
            {plansMessage && <p role="status" style={{ color: "#218838", margin: "12px 0" }}>{plansMessage}</p>}

            <div className="dashboard-card plan-overview">
              <div className="card-title-area">
                <h3>Subscription Plans</h3>
                <p>Plan details loaded from the backend database.</p>
              </div>
              {plansLoading ? <p>Loading plans from the backend...</p> : plans.length === 0 ? (
                <p>{plansError ? "Plans could not be loaded. Check the plans API." : "No plans found in the database."}</p>
              ) : (
                <div className="plan-overview-grid">
                  {plans.map((plan) => (
                    <div className="plan-column" key={plan._id || plan.name}>
                      <span className="plan-number">{plan.price != null ? `₹${plan.price}` : "Price not set"}</span>
                      <strong>{plan.name || "Unnamed plan"}</strong>
                      <small>{plan.description || plan.billingCycle || "Subscription plan"}</small>
                      <span className="plan-active">{plan.isActive === false ? "Inactive" : "Active"}</span>
                      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:10}}>
                        <button type="button" className="table-action" onClick={() => openPlanEditor(plan)}>Edit Plan</button>
                        <button type="button" className="table-action" onClick={() => deletePlan(plan)} disabled={plansSaving}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {editingPlan && (
              <div className="dashboard-card" style={{ marginTop: "20px", padding: "20px" }}>
                <div className="card-title-area">
                  <h3>{editingPlan._id ? `Edit ${editingPlan.name}` : "Create Subscription Plan"}</h3>
                  <p>{editingPlan._id ? "Changes are saved to MongoDB." : "The new plan will be saved to MongoDB."}</p>
                </div>
                <div className="settings-form-grid">
                  <div className="settings-field">
                    <label htmlFor="plan-name">Plan name</label>
                    <input id="plan-name" value={planDraft.name} onChange={(event) => setPlanDraft((current) => ({ ...current, name: event.target.value }))} />
                  </div>
                  <div className="settings-field">
                    <label htmlFor="plan-price">Price (₹)</label>
                    <input id="plan-price" type="number" min="0" value={planDraft.price} onChange={(event) => setPlanDraft((current) => ({ ...current, price: event.target.value }))} />
                  </div>
                  <div className="settings-field">
                    <label htmlFor="plan-billing-cycle">Billing cycle</label>
                    <select id="plan-billing-cycle" value={planDraft.billingCycle} onChange={(event) => setPlanDraft((current) => ({ ...current, billingCycle: event.target.value }))}>
                      <option value="Monthly">Monthly</option><option value="Quarterly">Quarterly</option><option value="Yearly">Yearly</option>
                    </select>
                  </div>
                  <div className="settings-field">
                    <label htmlFor="plan-description">Description</label>
                    <input id="plan-description" value={planDraft.description} onChange={(event) => setPlanDraft((current) => ({ ...current, description: event.target.value }))} />
                  </div>
                  <div className="settings-field">
                    <label htmlFor="plan-active">Plan status</label>
                    <select id="plan-active" value={planDraft.isActive ? "active" : "inactive"} onChange={(event) => setPlanDraft((current) => ({ ...current, isActive: event.target.value === "active" }))}>
                      <option value="active">Active</option><option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "12px", marginTop: "16px", flexWrap: "wrap" }}>
                  <button type="button" className="primary-button" onClick={savePlan} disabled={plansSaving}>{plansSaving ? "Saving..." : editingPlan._id ? "Save Changes" : "Create Plan"}</button>
                  <button type="button" className="secondary-button" onClick={() => setEditingPlan(null)} disabled={plansSaving}>Cancel</button>
                </div>
              </div>
            )}

            <div className="dashboard-card feature-access-card" style={{ marginTop: "20px" }}>
              <div className="card-title-area">
                <h3>Feature Access</h3>
                <p>Check a feature to enable it for a plan. Changes are saved to MongoDB when you click Save Feature Flags.</p>
              </div>
              {plansLoading ? <p>Loading feature flags...</p> : plans.length === 0 ? <p>Load subscription plans to configure feature access.</p> : (
                <>
                  <div className="table-wrapper">
                    <table className="feature-table">
                      <thead><tr><th>Feature</th>{plans.map((plan) => <th key={plan._id || plan.name}>{plan.name}</th>)}</tr></thead>
                      <tbody>
                        {featureDefinitions.map((item) => (
                          <tr key={item.feature}>
                            <td><div className="feature-information"><strong>{item.feature}</strong><span>{item.description}</span></div></td>
                            {plans.map((plan) => {
                              const key = String(plan._id || plan.name);
                              const enabledFeatures = featureDrafts[key] || (Array.isArray(plan.features) ? plan.features : []);
                              const enabled = enabledFeatures.includes(item.feature);
                              return <td key={key}>
                                <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                                  <input type="checkbox" checked={enabled} onChange={(event) => togglePlanFeature(plan, item.feature, event.target.checked)} aria-label={`${item.feature} for ${plan.name}`} />
                                  <FeatureState state={enabled ? "Enabled" : "Disabled"} />
                                </label>
                              </td>;
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
                    <button type="button" className="primary-button" onClick={saveFeatureFlags} disabled={plansSaving || plansLoading}>{plansSaving ? "Saving..." : "Save Feature Flags"}</button>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

    
    </>
  );
}