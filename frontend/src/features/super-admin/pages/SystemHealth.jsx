import "./SystemHealth.css";
export default function SystemHealth({
  activePage,
  systemHealth,
  systemHealthCheckedAt,
  systemHealthLoading,
  systemHealthError,
  refreshSystemHealth,
  readHealthValue,
  securityLogs,
  securityLogsError,
  formatSecurityEventTime
}) {
  return (
    <>
{/* SYSTEM HEALTH — live metrics from the Node.js and MongoDB backend */}
    {activePage === "health" && (
      <section className="dashboard-section" id="health">
        {(() => {
          const server = systemHealth?.server || {};
          const database = systemHealth?.database || {};
          const system = systemHealth?.system || {};
          const serverHealthy = String(server.status || "").toLowerCase() === "healthy";
          const databaseConnected = database.connected === true;
          const overallHealthy = serverHealthy && databaseConnected;
          const uptimeSeconds = Number(server.uptimeSeconds);
          const uptimeText = Number.isFinite(uptimeSeconds)
            ? `${Math.floor(uptimeSeconds / 86400)}d ${Math.floor((uptimeSeconds % 86400) / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m`
            : "Not reported by API";

          return (
            <>
              <div className="section-heading section-heading-row">
                <div>
                  <p className="section-eyebrow">SYSTEM MONITORING</p>
                  <h2>System Health</h2>
                  <p>Live status and resource metrics reported by your Node.js server and MongoDB connection.</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <span className="last-checked">
                    {systemHealthCheckedAt
                      ? `Last checked: ${systemHealthCheckedAt.toLocaleTimeString("en-IN")}`
                      : "Not checked yet"}
                  </span>
                  <button type="button" className="secondary-button" onClick={refreshSystemHealth} disabled={systemHealthLoading}>
                    {systemHealthLoading ? "Checking…" : "↻ Refresh Health"}
                  </button>
                </div>
              </div>

              {systemHealthError && (
                <p role="alert" style={{ color: "#c0392b", margin: "12px 0" }}>
                  System Health API error: {systemHealthError}
                </p>
              )}

              <div className="health-overview-bar">
                <div className="health-overview-main">
                  <div className="health-status-dot" style={{ background: systemHealthError ? "#c0392b" : overallHealthy ? "#2eaa78" : "#d69b32" }}></div>
                  <div>
                    <strong>
                      {systemHealthLoading && !systemHealth
                        ? "Checking server health…"
                        : systemHealthError && !systemHealth
                          ? "Health check unavailable"
                          : overallHealthy
                            ? "Server and database are healthy"
                            : "System is degraded"}
                    </strong>
                    <p>
                      {systemHealth
                        ? `Backend status: ${readHealthValue(server.status)} · Database: ${readHealthValue(database.status)}`
                        : "Waiting for a successful response from the System Health API."}
                    </p>
                  </div>
                </div>
                <span className="health-status-badge">
                  {systemHealthLoading && !systemHealth ? "Checking" : systemHealthError && !systemHealth ? "Unavailable" : overallHealthy ? "Healthy" : "Degraded"}
                </span>
              </div>

              <div className="health-metrics-grid">
                <div className="health-metric-card">
                  <div className="health-metric-top">
                    <span>Application Server</span>
                    <span className={`metric-status ${serverHealthy ? "healthy" : "normal"}`}>
                      {readHealthValue(server.status)}
                    </span>
                  </div>
                  <strong>{uptimeText}</strong>
                  <small>Actual Node.js process uptime</small>
                </div>

                <div className="health-metric-card">
                  <div className="health-metric-top">
                    <span>MongoDB Database</span>
                    <span className={`metric-status ${databaseConnected ? "healthy" : "normal"}`}>
                      {readHealthValue(database.status)}
                    </span>
                  </div>
                  <strong>{databaseConnected ? "Connected" : "Not connected"}</strong>
                  <small>Live Mongoose connection state</small>
                </div>

                <div className="health-metric-card">
                  <div className="health-metric-top">
                    <span>Node.js Runtime</span>
                    <span className="metric-status normal">Backend info</span>
                  </div>
                  <strong>{readHealthValue(server.nodeVersion)}</strong>
                  <small>{readHealthValue(server.platform)}</small>
                </div>
              </div>

              <div className="health-content-grid">
                <div className="dashboard-card health-memory-card">
                  <div className="card-title-area">
                    <h3>Server Memory Usage</h3>
                    <p>Live operating-system and Node.js process memory values.</p>
                  </div>
                  <div className="health-memory-grid">
                    <div className="health-memory-item">
                      <span>Total System Memory</span>
                      <strong>{system.totalMemoryMB != null ? `${Number(system.totalMemoryMB).toLocaleString("en-IN")} MB` : "Not reported"}</strong>
                    </div>
                    <div className="health-memory-item">
                      <span>Free System Memory</span>
                      <strong>{system.freeMemoryMB != null ? `${Number(system.freeMemoryMB).toLocaleString("en-IN")} MB` : "Not reported"}</strong>
                    </div>
                    <div className="health-memory-item">
                      <span>Node Process Memory (RSS)</span>
                      <strong>{system.processMemoryMB != null ? `${Number(system.processMemoryMB).toLocaleString("en-IN")} MB` : "Not reported"}</strong>
                    </div>
                    <div className="health-memory-item">
                      <span>Memory Used</span>
                      <strong>
                        {Number.isFinite(Number(system.totalMemoryMB)) && Number(system.totalMemoryMB) > 0 && Number.isFinite(Number(system.freeMemoryMB))
                          ? `${((Number(system.totalMemoryMB) - Number(system.freeMemoryMB)) / Number(system.totalMemoryMB) * 100).toFixed(1)}%`
                          : "Not available"}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="dashboard-card">
                  <div className="card-title-area">
                    <h3>Health Check Details</h3>
                    <p>Metadata returned by the backend health controller.</p>
                  </div>
                  <div className="service-status-table">
                    <div className="service-status-row">
                      <strong>Server status</strong>
                      <span>{readHealthValue(server.status)}</span>
                    </div>
                    <div className="service-status-row">
                      <strong>Database connection</strong>
                      <span>{readHealthValue(database.status)}</span>
                    </div>
                    <div className="service-status-row">
                      <strong>Runtime platform</strong>
                      <span>{readHealthValue(server.platform)}</span>
                    </div>
                    <div className="service-status-row">
                      <strong>Checked at</strong>
                      <span>{systemHealth?.checkedAt ? new Date(systemHealth.checkedAt).toLocaleString("en-IN") : "Not reported"}</span>
                    </div>
                  </div>
                  <p style={{ marginTop: 12, color: "var(--muted-text, #637875)", fontSize: 12 }}>
                    CPU usage and API latency are not provided by the current health controller, so they are intentionally not displayed.
                  </p>
                </div>
              </div>

              <div className="dashboard-card security-events-card">
                <div className="card-title-area">
                  <h3>Recent Security Events</h3>
                  <p>Records returned by the existing Security Logs API.</p>
                </div>
                <div className="security-summary">
                  <strong>{securityLogs.length}</strong>
                  <span>Events returned by API</span>
                </div>
                {securityLogsError && (
                  <p role="alert" style={{ color: "#c0392b", margin: "12px 0" }}>{securityLogsError}</p>
                )}
                <div className="security-event-list">
                  {securityLogsError ? (
                    <p style={{ padding: "12px" }}>Security logs could not be loaded.</p>
                  ) : securityLogs.length === 0 ? (
                    <p style={{ padding: "12px" }}>No security events were returned by the API.</p>
                  ) : securityLogs.slice(0, 8).map((event, index) => (
                    <div className="security-event-row" key={event._id || event.id || index}>
                      <span className="security-event-indicator"></span>
                      <div>
                        <strong>{event.title || event.event || event.action || event.message || event.type || "Security event"}</strong>
                        <span>{formatSecurityEventTime(event)}{event.severity ? ` · ${event.severity}` : event.status ? ` · ${event.status}` : ""}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          );
        })()}
      </section>
    )}

        
    </>
  );
}