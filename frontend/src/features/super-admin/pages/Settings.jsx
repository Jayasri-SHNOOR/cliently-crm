import "./Settings.css";
export default function Settings({
  activePage,
  activeSetting,
  setActiveSetting,
  settings,
  setSettings,
  settingsLoading,
  setSettingsLoading,
  settingsSaving,
  settingsError,
  setSettingsError,
  settingsMessage,
  setSettingsMessage,
  saveSettings,
  updateSettingsSection,
  normalizeDashboardSettings,
  getSettings
}) {
  return (
    <>
{activePage === "settings" && (
  <section className="settings-page" id="settings">
    <div className="settings-page-header">
      <div>
        <span className="section-eyebrow">PLATFORM ADMINISTRATION</span>
        <h2>Settings</h2>
        <p>Manage essential Cliently platform preferences.</p>
      </div>
      <span className="settings-admin-badge">● Super Admin</span>
    </div>

    <div className="settings-layout">
      <aside className="settings-menu">
        <div className="settings-menu-group">
          <h4>SETTINGS</h4>
          {["General", "Regional Defaults", "Security", "Notifications"].map((item) => (
            <button type="button" key={item}
              className={`settings-menu-item ${activeSetting === item ? "active" : ""}`}
              onClick={() => { setActiveSetting(item); setSettingsMessage(""); setSettingsError(""); }}>
              <span>{item === "General" ? "▣" : item === "Regional Defaults" ? "◷" : item === "Security" ? "⌾" : "♢"}</span>
              {item}
            </button>
          ))}
        </div>
      </aside>

      <div className="settings-content">
        <div className="settings-content-header">
          <div>
            <span className="settings-content-eyebrow">CLIENTLY PLATFORM</span>
            <h3>{activeSetting}</h3>
            <p>
              {activeSetting === "General" && "Platform identity and support contact details."}
              {activeSetting === "Regional Defaults" && "Default timezone, currency and display formats."}
              {activeSetting === "Security" && "Basic platform password and session policies."}
              {activeSetting === "Notifications" && "Choose which platform alerts are enabled."}
            </p>
          </div>
          <button type="button" className="primary-button" onClick={saveSettings} disabled={settingsSaving || settingsLoading}>
            {settingsSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {settingsLoading && <p role="status">Loading saved settings...</p>}
        {settingsError && (
          <div role="alert" style={{ color: "#c0392b", marginBottom: 12 }}>
            <p>{settingsError}</p>
            <button type="button" className="secondary-button" onClick={async () => {
              setSettingsLoading(true); setSettingsError("");
              try { setSettings(normalizeDashboardSettings(await getSettings())); }
              catch (error) { setSettingsError(error.message || "Unable to load settings."); }
              finally { setSettingsLoading(false); }
            }} disabled={settingsLoading || settingsSaving}>Retry</button>
          </div>
        )}
        {settingsMessage && <p role="status" style={{ color: "#218838", marginBottom: 12 }}>{settingsMessage}</p>}

        {activeSetting === "General" && (
          <div className="settings-card">
            <div className="settings-card-header">
              <div><h3>Organization</h3><p>Platform identity and support contact.</p></div>
              <span className="settings-card-status">MongoDB</span>
            </div>
            <div className="settings-form-grid">
              <div className="settings-field"><label htmlFor="platform-name">Platform Name</label>
                <input id="platform-name" value={settings.organization.companyName} maxLength={100}
                  onChange={(e) => updateSettingsSection("organization", "companyName", e.target.value)} disabled={settingsSaving} /></div>
              <div className="settings-field"><label htmlFor="support-email">Support Email</label>
                <input id="support-email" type="email" value={settings.organization.supportEmail}
                  onChange={(e) => updateSettingsSection("organization", "supportEmail", e.target.value)} disabled={settingsSaving} /></div>
              <div className="settings-field"><label htmlFor="support-url">Support URL</label>
                <input id="support-url" type="url" value={settings.organization.supportUrl}
                  onChange={(e) => updateSettingsSection("organization", "supportUrl", e.target.value)} disabled={settingsSaving} /></div>
            </div>
          </div>
        )}

        {activeSetting === "Regional Defaults" && (
          <div className="settings-card">
            <div className="settings-card-header"><div><h3>Regional Preferences</h3><p>Default regional display settings.</p></div></div>
            <div className="settings-form-grid">
              <div className="settings-field"><label htmlFor="regional-timezone">Timezone</label>
                <select id="regional-timezone" value={settings.regional.timezone} onChange={(e) => updateSettingsSection("regional", "timezone", e.target.value)} disabled={settingsSaving}>
                  <option value="Asia/Kolkata">Asia/Kolkata</option><option value="UTC">UTC</option><option value="America/New_York">America/New_York</option><option value="Europe/London">Europe/London</option><option value="Asia/Singapore">Asia/Singapore</option>
                </select></div>
              <div className="settings-field"><label htmlFor="regional-currency">Currency</label>
                <select id="regional-currency" value={settings.regional.currency} onChange={(e) => updateSettingsSection("regional", "currency", e.target.value)} disabled={settingsSaving}>
                  <option value="INR">INR — Indian Rupee</option><option value="USD">USD — US Dollar</option><option value="EUR">EUR — Euro</option><option value="GBP">GBP — Pound Sterling</option><option value="SGD">SGD — Singapore Dollar</option>
                </select></div>
              <div className="settings-field"><label htmlFor="regional-date">Date Format</label>
                <select id="regional-date" value={settings.regional.dateFormat} onChange={(e) => updateSettingsSection("regional", "dateFormat", e.target.value)} disabled={settingsSaving}>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option><option value="MM/DD/YYYY">MM/DD/YYYY</option><option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select></div>
              <div className="settings-field"><label htmlFor="regional-time">Time Format</label>
                <select id="regional-time" value={settings.regional.timeFormat} onChange={(e) => updateSettingsSection("regional", "timeFormat", e.target.value)} disabled={settingsSaving}>
                  <option value="12h">12-hour</option><option value="24h">24-hour</option>
                </select></div>
              <div className="settings-field"><label htmlFor="regional-language">Language</label>
                <select id="regional-language" value={settings.regional.language} onChange={(e) => updateSettingsSection("regional", "language", e.target.value)} disabled={settingsSaving}>
                  <option value="en">English</option>
                </select></div>
              <div className="settings-field"><label htmlFor="regional-week">Week Starts On</label>
                <select id="regional-week" value={settings.regional.weekStartsOn} onChange={(e) => updateSettingsSection("regional", "weekStartsOn", e.target.value)} disabled={settingsSaving}>
                  <option value="Monday">Monday</option><option value="Sunday">Sunday</option>
                </select></div>
            </div>
          </div>
        )}

        {activeSetting === "Security" && (
          <div className="settings-card">
            <div className="settings-card-header"><div><h3>Security Preferences</h3><p>Stored policy settings; enforcement remains with the authentication backend.</p></div></div>
            <div className="settings-form-grid">
              <div className="settings-field"><label htmlFor="session-timeout">Session Timeout (minutes)</label>
                <input id="session-timeout" type="number" min="5" max="1440" value={settings.security.sessionTimeoutMinutes}
                  onChange={(e) => updateSettingsSection("security", "sessionTimeoutMinutes", Math.min(1440, Math.max(5, Number(e.target.value) || 5)))} disabled={settingsSaving} /></div>
              <div className="settings-field"><label htmlFor="password-minimum">Minimum Password Length</label>
                <input id="password-minimum" type="number" min="8" max="64" value={settings.security.passwordMinLength}
                  onChange={(e) => updateSettingsSection("security", "passwordMinLength", Math.min(64, Math.max(8, Number(e.target.value) || 8)))} disabled={settingsSaving} /></div>
            </div>
            {[
              ["twoFactorRequired", "Require two-factor authentication"],
              ["requireUppercase", "Require uppercase letter"],
              ["requireNumber", "Require a number"],
              ["requireSpecialCharacter", "Require special character"],
            ].map(([field, label]) => (
              <div className="settings-option-row" key={field}>
                <div><strong>{label}</strong></div>
                <label className="settings-switch"><input type="checkbox" checked={Boolean(settings.security[field])}
                  onChange={(e) => updateSettingsSection("security", field, e.target.checked)} disabled={settingsSaving} /><span></span></label>
              </div>
            ))}
          </div>
        )}

        {activeSetting === "Notifications" && (
          <div className="settings-card">
            <div className="settings-card-header"><div><h3>Notification Preferences</h3><p>Enable or disable platform notification categories.</p></div></div>
            {[
              ["emailEnabled", "Email notifications"],
              ["systemAlertsEnabled", "System alerts"],
              ["securityAlerts", "Security alerts"],
              ["billingAlerts", "Billing alerts"],
            ].map(([field, label]) => (
              <div className="settings-option-row" key={field}>
                <div><strong>{label}</strong></div>
                <label className="settings-switch"><input type="checkbox" checked={Boolean(settings.notifications[field])}
                  onChange={(e) => updateSettingsSection("notifications", field, e.target.checked)} disabled={settingsSaving} /><span></span></label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </section>
)}

    </>
  );
}