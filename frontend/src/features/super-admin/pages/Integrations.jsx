import "./Integrations.css";
export default function Integrations({
  activePage,
  integrationsLoading,
  setIntegrationsLoading,
  integrationError,
  setIntegrationError,
  integrationMessage,
  setIntegrationMessage,
  integrationRecords,
  setIntegrationRecords,
  integrationQuery,
  setIntegrationQuery,
  selectedIntegration,
  setSelectedIntegration,
  integrationDraft,
  setIntegrationDraft,
  integrationSaving,
  openIntegrationConfig,
  saveIntegration
}) {
  return (
    <>
{/* INTEGRATIONS */}
        {activePage === "integrations" && (
          <section className="dashboard-section" id="integrations">
            <div className="section-heading section-heading-row">
              <div>
                <p className="section-eyebrow">PLATFORM SERVICES</p>
                <h2>Global Integrations</h2>
                <p>Manage integration records and platform availability.</p>
              </div>
              <button
                type="button"
                className="secondary-button"
                disabled={integrationsLoading}
                onClick={async () => {
                  setIntegrationsLoading(true);
                  setIntegrationError("");
                  try {
                    const response = await fetch("http://localhost:5000/api/super-admin/integrations");
                    const result = await response.json();
                    if (!response.ok || result.success === false) {
                      throw new Error(result.message || `Request failed: ${response.status}`);
                    }
                    setIntegrationRecords(Array.isArray(result.data) ? result.data : []);
                  } catch (error) {
                    setIntegrationError(error.message || "Could not refresh integrations.");
                  } finally {
                    setIntegrationsLoading(false);
                  }
                }}
              >
                {integrationsLoading ? "Refreshing..." : "Refresh Integrations"}
              </button>
            </div>

            {integrationError && <p role="alert" style={{ color: "#c0392b", margin: "12px 0" }}>{integrationError}</p>}
            {integrationMessage && <p role="status" style={{ color: "#218838", margin: "12px 0" }}>{integrationMessage}</p>}

            <div className="integration-overview">
              <div className="integration-overview-item">
                <span className="integration-overview-label">Configured Integrations</span>
                <strong>{integrationRecords.length}</strong>
                <small>Records returned by MongoDB</small>
              </div>
              <div className="integration-overview-item">
                <span className="integration-overview-label">Enabled</span>
                <strong>{integrationRecords.filter((item) => item.enabled === true).length}</strong>
                <small>Platform availability enabled</small>
              </div>
              <div className="integration-overview-item">
                <span className="integration-overview-label">Disabled</span>
                <strong>{integrationRecords.filter((item) => item.enabled !== true).length}</strong>
                <small>Platform availability disabled</small>
              </div>
            </div>

            <div className="integration-section-header">
              <div>
                <h3>Configured Integrations</h3>
                <p>Manage the database fields: name, description and enabled.</p>
              </div>
              <span className="integration-count">
                {integrationRecords.length} integration{integrationRecords.length === 1 ? "" : "s"}
              </span>
            </div>

            <div style={{ margin: "14px 0", maxWidth: 420 }}>
              <input
                type="search"
                aria-label="Search integrations"
                placeholder="Search by integration name or description..."
                value={integrationQuery}
                onChange={(event) => setIntegrationQuery(event.target.value)}
                style={{ width: "100%" }}
              />
            </div>

            <div className="integration-card-grid">
              {integrationsLoading ? (
                <div className="dashboard-card" style={{ padding: "20px" }}>Loading integrations from MongoDB...</div>
              ) : (() => {
                const visibleIntegrations = integrationRecords.filter((item) =>
                  `${item.name || ""} ${item.description || ""}`.toLowerCase().includes(integrationQuery.trim().toLowerCase())
                );
                if (visibleIntegrations.length === 0) {
                  return (
                    <div className="dashboard-card" style={{ padding: "20px" }}>
                      {integrationError ? "Integrations could not be loaded. Check the backend API." :
                        integrationRecords.length === 0 ? "No integration records found in the database." : "No integrations match your search."}
                    </div>
                  );
                }
                return visibleIntegrations.map((integration) => {
                  const isEnabled = integration.enabled === true;
                  const initials = String(integration.name || "I").trim().charAt(0).toUpperCase();
                  return (
                    <div className="integration-card" key={integration._id || integration.name}>
                      <div className="integration-card-top">
                        <div className="integration-provider">
                          <div className="integration-logo">{initials}</div>
                          <div>
                            <h3>{integration.name || "Unnamed integration"}</h3>
                            <span>Platform integration</span>
                          </div>
                        </div>
                        <span className={`integration-connected ${isEnabled ? "" : "integration-disconnected"}`}>
                          <span></span>{isEnabled ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                      <div className="integration-divider"></div>
                      <p className="integration-description">{integration.description || "No description provided."}</p>
                      <div className="integration-details">
                        <div><span>Platform availability</span><strong>{isEnabled ? "Enabled" : "Disabled"}</strong></div>
                        <div><span>Record updated</span><strong>{integration.updatedAt ? new Date(integration.updatedAt).toLocaleDateString("en-IN") : "Not provided"}</strong></div>
                      </div>
                      <div className="integration-card-footer">
                        <span className="integration-api-status"><span></span>{isEnabled ? "Available on platform" : "Unavailable on platform"}</span>
                        <button type="button" className="text-button" onClick={() => openIntegrationConfig(integration)}>Configure</button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {selectedIntegration && (
              <div className="dashboard-card integration-config-panel">
                <div className="table-header">
                  <div>
                    <h3>Configure {selectedIntegration.name}</h3>
                    <p>Changes are saved to the integration record in MongoDB.</p>
                  </div>
                  <button type="button" className="text-button" onClick={() => {
                    setSelectedIntegration(null);
                    setIntegrationError("");
                    setIntegrationMessage("");
                  }}>Close</button>
                </div>
                <div className="settings-form-grid">
                  <div className="settings-field">
                    <label htmlFor="integration-name">Integration Name</label>
                    <input id="integration-name" type="text" maxLength={100} value={integrationDraft.name}
                      onChange={(event) => setIntegrationDraft((current) => ({ ...current, name: event.target.value }))} />
                  </div>
                  <div className="settings-field">
                    <label htmlFor="integration-description">Description</label>
                    <input id="integration-description" type="text" maxLength={500} value={integrationDraft.description}
                      onChange={(event) => setIntegrationDraft((current) => ({ ...current, description: event.target.value }))} />
                  </div>
                  <div className="settings-field">
                    <label htmlFor="integration-enabled">Platform Availability</label>
                    <select id="integration-enabled" value={integrationDraft.enabled ? "true" : "false"}
                      onChange={(event) => setIntegrationDraft((current) => ({ ...current, enabled: event.target.value === "true" }))}>
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                  <button type="button" className="primary-button" onClick={saveIntegration} disabled={integrationSaving}>
                    {integrationSaving ? "Saving..." : "Save Changes"}
                  </button>
                  <button type="button" className="secondary-button" onClick={() => setIntegrationDraft({
                    name: selectedIntegration.name || "",
                    description: selectedIntegration.description || "",
                    enabled: selectedIntegration.enabled === true,
                  })} disabled={integrationSaving}>Reset</button>
                </div>
              </div>
            )}
          </section>
        )}



    </>
  );
}