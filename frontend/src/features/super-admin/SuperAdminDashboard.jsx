import { useEffect, useState } from "react";
import {
  getSettings,
  updateSettings,
} from "./settingsApi";

import "./SuperAdminDashboard.css";

const featureAccess = [
  {
    feature: "Lead Management",
    description: "Core lead management capabilities",
    starter: "Enabled",
    pro: "Enabled",
    enterprise: "Enabled",
  },
  {
    feature: "Advanced Reports",
    description: "Advanced analytics and reporting",
    starter: "Disabled",
    pro: "Enabled",
    enterprise: "Enabled",
  },
  {
    feature: "AI Leads Scraper",
    description: "AI-powered lead discovery",
    starter: "Disabled",
    pro: "Disabled",
    enterprise: "Enabled",
  },
  {
    feature: "Global Integrations",
    description: "Platform-level third-party integrations",
    starter: "Disabled",
    pro: "Enabled",
    enterprise: "Enabled",
  },
  {
    feature: "Custom Workflows",
    description: "Advanced workflow automation",
    starter: "Disabled",
    pro: "Enabled",
    enterprise: "Enabled",
  },
];




const integrations = [
  {
    name: "Twilio",
    description: "Messaging and communication services",
    initials: "T",
  },
  {
    name: "Stripe",
    description: "Payments and subscription billing",
    initials: "S",
  },
  {
    name: "Google Workspace",
    description: "Productivity and workspace services",
    initials: "G",
  },
];

const services = [
  ["Application Server", "86 ms"],
  ["Database", "142 ms"],
  ["API Gateway", "94 ms"],
  ["Background Jobs", "118 ms"],
];

function FeatureState({ state }) {
  const enabled = state === "Enabled";

  return (
    <span className={`feature-state ${enabled ? "enabled" : "disabled"}`}>
      <span className="state-dot"></span>
      {state}
    </span>
  );
}

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function ProfileDialog({ onClose, onOpenSettings }) {
  const [tab, setTab] = useState("profile");
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState({
    name: "Super Admin",
    email: "Not connected",
    phone: "Not provided",
    department: "Platform Administration",
  });
  const [draft, setDraft] = useState(profile);

  const tabs = [
    { id: "profile", label: "Profile", icon: "◉" },
    { id: "security", label: "Security", icon: "⬡" },
    { id: "access", label: "Access & Roles", icon: "▱" },
    { id: "preferences", label: "Preferences", icon: "☷" },
    { id: "sessions", label: "Sessions", icon: "▣" },
    { id: "activity", label: "Activity", icon: "◷" },
  ];

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setSaved(false);
  };

  const cancelEdit = () => {
    setDraft(profile);
    setEditing(false);
    setSaved(false);
  };

  const saveProfilePreview = () => {
    // This updates the current UI only. Connect this action to a profile API
    // before treating profile changes as persisted account data.
    setProfile(draft);
    setEditing(false);
    setSaved(true);
  };

  return (
    <div className="cliently-profile-overlay" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <style>{`
        .cliently-profile-overlay{position:fixed;inset:0;z-index:3000;display:grid;place-items:center;padding:22px;background:rgba(18,60,58,.62);backdrop-filter:blur(16px)}
        .cliently-profile-shell{width:min(1180px,100%);max-height:94vh;overflow:auto;background:#f4faf8;color:#183735;border:1px solid rgba(207,228,223,.95);border-radius:25px;box-shadow:0 35px 110px rgba(0,0,0,.55);font-family:inherit}
        .cliently-profile-top{height:66px;display:flex;align-items:center;justify-content:space-between;padding:0 26px;border-bottom:1px solid rgba(255,255,255,.12);background:linear-gradient(110deg,#123c3a,#1b514d)}
        .cliently-profile-brand{display:flex;align-items:center;gap:11px;font-weight:850;letter-spacing:.04em}.cliently-profile-brandmark{display:grid;place-items:center;width:36px;height:36px;border-radius:12px;background:linear-gradient(135deg,#75d5c5,#55b9a8);color:#123c3a;font-weight:950;box-shadow:0 0 24px rgba(31,218,207,.25)}
        .cliently-profile-close{width:36px;height:36px;border:1px solid rgba(181,205,235,.2);border-radius:11px;background:#eaf6f3;color:#183735;font-size:22px;cursor:pointer}
        .cliently-profile-main{padding:24px 28px 28px;background:radial-gradient(ellipse at 82% 0%,rgba(117,213,197,.16),transparent 34%),radial-gradient(ellipse at 18% 18%,rgba(85,185,168,.10),transparent 32%),#f4faf8}
        .cliently-profile-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:18px}.cliently-profile-heading h2{margin:0;font-size:27px;letter-spacing:-.04em;color:#183735}.cliently-profile-heading p{margin:6px 0 0;color:#637875;font-size:13px}.cliently-profile-breadcrumb{font-size:11px;color:#637875;margin-bottom:8px;letter-spacing:.08em;text-transform:uppercase}
        .cliently-profile-hero{position:relative;overflow:hidden;display:flex;align-items:center;gap:18px;padding:22px 25px;border:1px solid rgba(66,203,210,.25);border-radius:20px;background:linear-gradient(105deg,#eaf6f3,#ddf6f1 55%,#f4faf8);box-shadow:inset 0 1px rgba(255,255,255,.06)}
        .cliently-profile-hero:after{content:"";position:absolute;width:310px;height:170px;right:7%;top:-90px;border:1px solid rgba(43,224,216,.35);border-radius:50%;box-shadow:0 0 0 12px rgba(43,224,216,.035),0 0 0 28px rgba(43,224,216,.025),0 0 50px rgba(43,224,216,.12);transform:rotate(-18deg);pointer-events:none}
        .cliently-profile-avatar{position:relative;z-index:1;display:grid;place-items:center;flex:0 0 76px;width:76px;height:76px;border-radius:23px;border:2px solid #55b9a8;background:linear-gradient(145deg,#ddf6f1,#eaf6f3);color:#123c3a;font-size:25px;font-weight:900;box-shadow:0 0 26px rgba(32,218,211,.18)}
        .cliently-profile-hero-copy{position:relative;z-index:1;min-width:0}.cliently-profile-hero h3{margin:0 0 7px;font-size:23px;letter-spacing:-.03em}.cliently-profile-hero p{margin:0;color:#637875;font-size:12px}.cliently-profile-meta{display:flex;flex-wrap:wrap;gap:9px 18px;margin-top:12px;color:#35514e;font-size:12px}.cliently-profile-pill{display:inline-flex;align-items:center;gap:7px;padding:6px 11px;border:1px solid rgba(42,220,193,.35);border-radius:99px;background:rgba(5,35,48,.42);color:#357f74;font-size:11px;font-weight:800}
        .cliently-profile-tabs{display:flex;gap:6px;overflow:auto;margin:17px 0;padding:6px;border:1px solid rgba(130,163,205,.17);border-radius:16px;background:#eaf6f3}.cliently-profile-tab{display:flex;align-items:center;justify-content:center;gap:8px;flex:1;min-width:max-content;padding:12px 14px;border:0;border-radius:11px;background:transparent;color:#637875;font:600 12px inherit;cursor:pointer;transition:background .18s,color .18s,box-shadow .18s}.cliently-profile-tab.active{background:#357f74;color:#ffffff;box-shadow:0 5px 20px rgba(0,193,190,.18)}.cliently-profile-tab span{font-size:16px}
        .cliently-profile-layout{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(280px,.9fr);gap:16px}.cliently-profile-panel{min-width:0;padding:21px;border:1px solid rgba(129,164,210,.18);border-radius:19px;background:#ffffff;box-shadow:0 12px 35px rgba(0,0,0,.12)}.cliently-profile-panel h4{margin:0;color:#183735;font-size:16px}.cliently-profile-subtitle{margin:6px 0 18px;color:#637875;font-size:12px;line-height:1.55}.cliently-profile-fields{display:grid;gap:12px}.cliently-profile-field{display:grid;grid-template-columns:130px minmax(0,1fr);align-items:center;gap:12px}.cliently-profile-field label{color:#637875;font-size:12px}.cliently-profile-field input{width:100%;min-width:0;box-sizing:border-box;padding:11px 12px;border:1px solid #cfe4df;border-radius:10px;outline:none;background:#ffffff;color:#183735;font:500 12px inherit}.cliently-profile-field input:focus{border-color:#55b9a8;box-shadow:0 0 0 3px rgba(36,201,197,.1)}.cliently-profile-readonly{padding:11px 12px;border:1px solid rgba(110,145,190,.13);border-radius:10px;background:rgba(7,18,34,.52);color:#35514e;font-size:12px;overflow-wrap:anywhere}
        .cliently-profile-side{display:grid;gap:15px}.cliently-profile-identity{display:flex;align-items:center;justify-content:space-between;gap:14px;border-color:rgba(42,196,214,.32);background:#eaf6f3}.cliently-profile-identity strong{display:block;margin-top:5px;font-size:17px}.cliently-profile-identity small{color:#637875;font-size:11px}.cliently-profile-crown{display:grid;place-items:center;width:62px;height:62px;border:1px solid rgba(177,148,255,.32);border-radius:17px;background:rgba(132,93,205,.18);color:#357f74;font-size:27px}
        .cliently-profile-statgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.cliently-profile-stat{padding:14px;border:1px solid rgba(124,157,199,.16);border-radius:14px;background:rgba(7,18,34,.45)}.cliently-profile-stat small{display:block;color:#8ea5c4;font-size:10px}.cliently-profile-stat strong{display:block;margin-top:8px;color:#183735;font-size:14px}.cliently-profile-stat em{display:block;margin-top:4px;color:#357f74;font-size:10px;font-style:normal}
        .cliently-profile-list{display:grid;gap:10px}.cliently-profile-row{display:flex;align-items:flex-start;gap:12px;padding:13px;border:1px solid rgba(125,158,198,.15);border-radius:13px;background:rgba(7,18,34,.42)}.cliently-profile-row-icon{display:grid;place-items:center;flex:0 0 34px;width:34px;height:34px;border-radius:10px;background:rgba(36,191,194,.13);color:#357f74}.cliently-profile-row strong{display:block;color:#183735;font-size:12px}.cliently-profile-row span{display:block;margin-top:4px;color:#637875;font-size:11px;line-height:1.5}.cliently-profile-note{padding:13px;border:1px solid rgba(62,178,190,.2);border-radius:13px;background:rgba(10,73,86,.18);color:#637875;font-size:11px;line-height:1.6}
        .cliently-profile-actions{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:17px}.cliently-profile-actions small{color:#637875;font-size:10px}.cliently-profile-action{padding:10px 15px;border:1px solid transparent;border-radius:10px;background:linear-gradient(110deg,#75d5c5,#357f74);color:#123c3a;font-size:12px;font-weight:850;cursor:pointer}.cliently-profile-action.secondary{border-color:#cfe4df;background:#eaf6f3;color:#35514e}.cliently-profile-action:disabled{opacity:.5;cursor:not-allowed}
        @media(max-width:760px){.cliently-profile-overlay{padding:8px}.cliently-profile-shell{max-height:97vh;border-radius:18px}.cliently-profile-main{padding:18px 14px}.cliently-profile-top{padding:0 16px}.cliently-profile-heading{align-items:flex-start;flex-direction:column}.cliently-profile-hero{padding:17px;align-items:flex-start}.cliently-profile-avatar{width:60px;height:60px;flex-basis:60px;border-radius:18px}.cliently-profile-layout{grid-template-columns:1fr}.cliently-profile-tabs{justify-content:flex-start}.cliently-profile-tab{flex:0 0 auto}.cliently-profile-field{grid-template-columns:1fr;gap:6px}.cliently-profile-actions{align-items:flex-start;flex-direction:column}}
      `}</style>

      <section className="cliently-profile-shell" role="dialog" aria-modal="true" aria-labelledby="cliently-profile-title">
        <header className="cliently-profile-top">
          <div className="cliently-profile-brand"><span className="cliently-profile-brandmark">C</span><span>CLIENTLY CRM <small style={{display:"block",fontSize:9,opacity:.65,fontWeight:600,letterSpacing:".15em"}}>PLATFORM CONTROL</small></span></div>
          <button type="button" className="cliently-profile-close" aria-label="Close profile" onClick={onClose}>×</button>
        </header>

        <main className="cliently-profile-main">
          <div className="cliently-profile-heading">
            <div><div className="cliently-profile-breadcrumb">Account centre&nbsp; / &nbsp;Administrator identity</div><h2 id="cliently-profile-title">My Profile</h2><p>Manage your identity, security preferences and platform access.</p></div>
            <span className="cliently-profile-pill">●&nbsp; SUPER ADMIN</span>
          </div>

          <section className="cliently-profile-hero">
            <div className="cliently-profile-avatar">SA</div>
            <div className="cliently-profile-hero-copy"><h3>{profile.name || "Super Admin"}</h3><p>Platform Administrator · Cliently Platform</p><div className="cliently-profile-meta"><span>✉ {profile.email}</span><span>◈ Platform-wide access</span><span className="cliently-profile-pill">● Active workspace</span></div></div>
          </section>

          <nav className="cliently-profile-tabs" aria-label="Profile sections">
            {tabs.map((item) => <button key={item.id} type="button" className={`cliently-profile-tab ${tab === item.id ? "active" : ""}`} onClick={() => setTab(item.id)}><span>{item.icon}</span>{item.label}</button>)}
          </nav>

          {tab === "profile" && <div className="cliently-profile-layout">
            <section className="cliently-profile-panel">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}><h4>Personal information</h4><button type="button" className="cliently-profile-action secondary" onClick={() => { setDraft(profile); setEditing((value) => !value); setSaved(false); }}>{editing ? "Stop editing" : "✎ Edit profile"}</button></div>
              <p className="cliently-profile-subtitle">Your administrator identity and contact details.</p>
              <div className="cliently-profile-fields">
                {[["name","Full name"],["email","Email address"],["phone","Phone number"],["department","Department"]].map(([field,label]) => <div className="cliently-profile-field" key={field}><label htmlFor={`cliently-profile-${field}`}>{label}</label>{editing ? <input id={`cliently-profile-${field}`} value={draft[field]} onChange={(event) => updateDraft(field,event.target.value)} /> : <div className="cliently-profile-readonly">{profile[field]}</div>}</div>)}
              </div>
              <div className="cliently-profile-actions"><small>{saved ? "Preview updated in this dialog. Backend profile persistence is not connected yet." : "Changes are a local preview until a profile API is connected."}</small><div style={{display:"flex",gap:8}}>{editing && <><button type="button" className="cliently-profile-action secondary" onClick={cancelEdit}>Cancel</button><button type="button" className="cliently-profile-action" onClick={saveProfilePreview}>Apply preview</button></>}</div></div>
            </section>
            <aside className="cliently-profile-side">
              <section className="cliently-profile-panel cliently-profile-identity"><div><small>PLATFORM IDENTITY</small><strong>Super Admin</strong><small>Full platform access and control</small></div><div className="cliently-profile-crown">♛</div></section>
              <section className="cliently-profile-panel"><h4>Account overview</h4><p className="cliently-profile-subtitle">Account details currently available in this dashboard.</p><div className="cliently-profile-statgrid"><div className="cliently-profile-stat"><small>Access scope</small><strong>Platform-wide</strong><em>Administrator</em></div><div className="cliently-profile-stat"><small>Account status</small><strong>Active</strong><em>Current UI role</em></div><div className="cliently-profile-stat"><small>Email</small><strong style={{fontSize:11}}>{profile.email}</strong></div><div className="cliently-profile-stat"><small>Department</small><strong style={{fontSize:11}}>{profile.department}</strong></div></div></section>
            </aside>
          </div>}

          {tab === "security" && <section className="cliently-profile-panel"><h4>Security centre</h4><p className="cliently-profile-subtitle">Security controls for the administrator account.</p><div className="cliently-profile-list"><div className="cliently-profile-row"><div className="cliently-profile-row-icon">⌑</div><div><strong>Authentication</strong><span>Login is managed by the existing Firebase and CRM session authentication flow.</span></div></div><div className="cliently-profile-row"><div className="cliently-profile-row-icon">◇</div><div><strong>Multi-factor authentication</strong><span>Status is not currently exposed by the profile API. No security status is assumed.</span></div></div><div className="cliently-profile-row"><div className="cliently-profile-row-icon">⛨</div><div><strong>Session protection</strong><span>Refresh and access-token handling remain controlled by the backend session service.</span></div></div></div></section>}

          {tab === "access" && <section className="cliently-profile-panel"><h4>Access & roles</h4><p className="cliently-profile-subtitle">Platform role overview. Actual permissions are enforced by backend authorization.</p><div className="cliently-profile-list">{[["Platform administration","Global platform configuration and oversight"],["Tenant management","Manage tenant lifecycle and status"],["Subscriptions & plans","Review subscriptions, billing cycles and plan configuration"],["Integrations & operations","Manage integrations and monitor system health"],["Security & audit","Review security events and platform audit information"]].map(([title,desc]) => <div className="cliently-profile-row" key={title}><div className="cliently-profile-row-icon">✓</div><div><strong>{title}</strong><span>{desc}</span></div></div>)}</div><p className="cliently-profile-note" style={{marginTop:14}}>This screen is informational. It does not grant permissions or change backend roles.</p></section>}

          {tab === "preferences" && <section className="cliently-profile-panel"><h4>Workspace preferences</h4><p className="cliently-profile-subtitle">Personal display options can be connected to a user-preferences endpoint.</p><div className="cliently-profile-statgrid"><div className="cliently-profile-stat"><small>Interface theme</small><strong>Dark · Cliently</strong><em>Current workspace style</em></div><div className="cliently-profile-stat"><small>Language</small><strong>English</strong><em>Displayed interface language</em></div><div className="cliently-profile-stat"><small>Timezone</small><strong>Asia/Kolkata</strong><em>Suggested local setting</em></div><div className="cliently-profile-stat"><small>Notifications</small><strong>Platform defaults</strong><em>Managed in Settings</em></div></div><p className="cliently-profile-note" style={{marginTop:14}}>Preference controls are not wired to persistent storage yet. Platform-wide defaults remain in the existing Settings module.</p></section>}

          {tab === "sessions" && <section className="cliently-profile-panel"><h4>Active sessions</h4><p className="cliently-profile-subtitle">Signed-in devices and session controls.</p><div className="cliently-profile-row"><div className="cliently-profile-row-icon">▣</div><div><strong>Session information unavailable</strong><span>The current backend does not provide a session-list endpoint to this profile view. No device count or login time is fabricated.</span></div></div><p className="cliently-profile-note" style={{marginTop:14}}>Connect this panel to the session-management API before enabling device revocation.</p></section>}

          {tab === "activity" && <section className="cliently-profile-panel"><h4>Account activity</h4><p className="cliently-profile-subtitle">Recent administrator actions and sign-in history.</p><div className="cliently-profile-row"><div className="cliently-profile-row-icon">◷</div><div><strong>No activity feed connected</strong><span>Verified profile activity will appear here when an audit or activity API is connected.</span></div></div><p className="cliently-profile-note" style={{marginTop:14}}>We do not display sample events as real account history.</p></section>}

          <footer className="cliently-profile-actions"><small>CLIENTLY CRM · PLATFORM ADMINISTRATION</small><div style={{display:"flex",gap:9}}><button type="button" className="cliently-profile-action secondary" onClick={onClose}>Close</button><button type="button" className="cliently-profile-action" onClick={onOpenSettings}>Open platform settings ↗</button></div></footer>
        </main>
      </section>
    </div>
  );
}

export default function SuperAdminDashboard({ onLogout }) {
  const [tenants, setTenants] = useState([]);
  const [tenantError, setTenantError] = useState("");
  const [tenantsLoading, setTenantsLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState(null);

  // Tenant summary counts are calculated from the records returned by the backend API.
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(
    (tenant) => String(tenant.status || "").toLowerCase() === "active"
  ).length;
  const pendingTenants = tenants.filter(
    (tenant) => String(tenant.status || "").toLowerCase() === "pending"
  ).length;
  const blockedTenants = tenants.filter(
    (tenant) => String(tenant.status || "").toLowerCase() === "blocked"
  ).length;

  useEffect(() => {
    let cancelled = false;

    async function loadTenants() {
      try {
        const response = await fetch("http://localhost:5000/api/super-admin/tenants");
        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }

        const result = await response.json();
        const records = Array.isArray(result.data)
          ? result.data
          : Array.isArray(result.tenants)
            ? result.tenants
            : [];

        const formattedTenants = records.map((tenant) => ({
          ...tenant,
          company: tenant.company || tenant.organization || tenant.name || "Unnamed tenant",
          admin: tenant.admin || tenant.ownerName || tenant.email || "—",
          plan: tenant.plan || "Starter",
          environment: tenant.environment || "Production",
          status: tenant.status || "Active",
          date: tenant.date
            ? tenant.date
            : tenant.createdAt
              ? new Date(tenant.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "—",
        }));

        if (!cancelled) {
          setTenants(formattedTenants);
          setTenantError("");
        }
      } catch (error) {
        console.error("Error fetching tenants:", error);
        if (!cancelled) {
          setTenantError("Unable to load tenants. Check that the backend is running.");
        }
      } finally {
        if (!cancelled) setTenantsLoading(false);
      }
    }

    loadTenants();
    return () => {
      cancelled = true;
    };
  }, []);

  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const [notificationFilter, setNotificationFilter] = useState("All");
  const [notificationSort, setNotificationSort] = useState("latest");

  useEffect(() => {
    let cancelled = false;

    async function loadNotifications() {
      setNotificationsLoading(true);
      setNotificationError("");
      try {
        const response = await fetch("http://localhost:5000/api/super-admin/notifications");
        if (!response.ok) throw new Error(`Request failed: ${response.status}`);
        const result = await response.json();
        if (result.success === false) {
          throw new Error(result.message || "Unable to load notifications");
        }

        const records = Array.isArray(result.data)
          ? result.data
          : Array.isArray(result.notifications)
            ? result.notifications
            : [];

        const formattedRecords = records.map((item) => ({
          ...item,
          title: item.title || item.subject || item.name || "Notification",
          description: item.description || item.message || item.body || "No additional details.",
          category: item.category || item.type || item.source || "System",
          source: item.source || item.company || item.tenantName || "Platform",
          unread: item.unread ?? !(item.isRead ?? item.read ?? false),
          createdAt: item.createdAt || item.date || item.timestamp || null,
        }));

        if (!cancelled) setNotifications(formattedRecords);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        if (!cancelled) {
          setNotificationError(
            "Unable to load notifications. Check the notifications API route and backend connection."
          );
        }
      } finally {
        if (!cancelled) setNotificationsLoading(false);
      }
    }

    loadNotifications();
    return () => { cancelled = true; };
  }, []);

  const markNotificationRead = async (notification) => {
    const notificationId = notification._id || notification.id;
    if (!notificationId) {
      setNotificationError("This notification has no database ID, so its read status cannot be saved.");
      return;
    }

    setNotificationError("");
    try {
      const response = await fetch(
        `http://localhost:5000/api/super-admin/notifications/${notificationId}/read`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        }
      );
      const result = await response.json();
      if (!response.ok || result.success === false) {
        throw new Error(result.message || `Request failed: ${response.status}`);
      }

      setNotifications((current) =>
        current.map((item) =>
          String(item._id || item.id) === String(notificationId)
            ? { ...item, unread: false, isRead: true, read: true }
            : item
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
      setNotificationError(error.message || "Could not save notification read status.");
    }
  };

  const markAllNotificationsRead = async () => {
    const unreadNotifications = notifications.filter((item) => item.unread);
    if (unreadNotifications.length === 0) return;

    setNotificationError("");
    for (const notification of unreadNotifications) {
      const notificationId = notification._id || notification.id;
      if (!notificationId) {
        setNotificationError("One notification has no database ID, so its read status cannot be saved.");
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:5000/api/super-admin/notifications/${notificationId}/read`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
          }
        );
        const result = await response.json();
        if (!response.ok || result.success === false) {
          throw new Error(result.message || `Request failed: ${response.status}`);
        }

        setNotifications((current) =>
          current.map((item) =>
            String(item._id || item.id) === String(notificationId)
              ? { ...item, unread: false, isRead: true, read: true }
              : item
          )
        );
      } catch (error) {
        console.error("Error marking all notifications as read:", error);
        setNotificationError(error.message || "Some notifications could not be marked as read.");
        return;
      }
    }
  };

  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [announcementError, setAnnouncementError] = useState("");
  const [announcementFilter, setAnnouncementFilter] = useState("All");
  const [announcementSort, setAnnouncementSort] = useState("latest");
  const [activePage, setActivePage] = useState("dashboard");

  // Load announcements when the user opens this module. This also retries the
  // request after the backend has started, instead of failing only on first mount.
  useEffect(() => {
    if (activePage !== "announcements") return;
    let cancelled = false;
    async function loadAnnouncements() {
      setAnnouncementsLoading(true);
      setAnnouncementError("");
      try {
        const response = await fetch("http://localhost:5000/api/super-admin/announcements");
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(result.message || `Announcements API returned HTTP ${response.status}`);
        }
        if (result.success === false) {
          throw new Error(result.message || "Announcements API reported a failure");
        }
        const records = Array.isArray(result.data)
          ? result.data
          : Array.isArray(result.announcements)
            ? result.announcements
            : [];
        if (!cancelled) setAnnouncements(records);
      } catch (error) {
        console.error("Error fetching announcements:", error);
        if (!cancelled) {
          setAnnouncementError(error.message || "Unable to load announcements. Check the backend connection.");
        }
      } finally {
        if (!cancelled) setAnnouncementsLoading(false);
      }
    }
    loadAnnouncements();
    return () => { cancelled = true; };
  }, [activePage]);

  const [activeSetting, setActiveSetting] = useState("General");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  // If the parent app supplies its existing logout handler, use it.
  // Otherwise return to the login route without clearing unrelated browser data.
  const handleAdminLogout = () => {
    setProfileMenuOpen(false);
    if (typeof onLogout === "function") {
      onLogout();
      return;
    }
    window.location.assign("/login");
  };

  // Subscription & Billing — reads real subscription records from the existing API.
  const [subscriptions, setSubscriptions] = useState([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);
  const [subscriptionsError, setSubscriptionsError] = useState("");

  useEffect(() => {
    if (activePage !== "billing") return;
    let cancelled = false;

    async function loadSubscriptions() {
      setSubscriptionsLoading(true);
      setSubscriptionsError("");
      try {
        const response = await fetch("http://localhost:5000/api/super-admin/subscriptions");
        const result = await response.json();
        if (!response.ok || result.success === false) {
          throw new Error(result.message || `Request failed: ${response.status}`);
        }
        const records = Array.isArray(result.data)
          ? result.data
          : Array.isArray(result.subscriptions)
            ? result.subscriptions
            : [];
        if (!cancelled) setSubscriptions(records);
      } catch (error) {
        console.error("Error loading subscriptions:", error);
        if (!cancelled) setSubscriptionsError(error.message || "Unable to load subscriptions from the backend.");
      } finally {
        if (!cancelled) setSubscriptionsLoading(false);
      }
    }

    loadSubscriptions();
    return () => { cancelled = true; };
  }, [activePage]);

  const refreshSubscriptions = async () => {
    setSubscriptionsLoading(true);
    setSubscriptionsError("");
    try {
      const response = await fetch("http://localhost:5000/api/super-admin/subscriptions");
      const result = await response.json();
      if (!response.ok || result.success === false) {
        throw new Error(result.message || `Request failed: ${response.status}`);
      }
      const records = Array.isArray(result.data)
        ? result.data
        : Array.isArray(result.subscriptions)
          ? result.subscriptions
          : [];
      setSubscriptions(records);
    } catch (error) {
      console.error("Error refreshing subscriptions:", error);
      setSubscriptionsError(error.message || "Unable to refresh subscriptions.");
    } finally {
      setSubscriptionsLoading(false);
    }
  };

  const formatINR = (value) => new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 2,
  }).format(Number(value) || 0);

  const activeSubscriptions = subscriptions.filter((item) => String(item.status || "Pending").toLowerCase() === "active");
  const attentionSubscriptions = subscriptions.filter((item) => ["pending", "expired"].includes(String(item.status || "").toLowerCase()));
  const monthlyRecurringRevenue = activeSubscriptions.reduce((total, item) => {
    const amount = Number(item.amount) || 0;
    return total + (String(item.billingCycle || "Monthly").toLowerCase() === "yearly" ? amount / 12 : amount);
  }, 0);
  const billingPlanSummary = ["Starter", "Pro", "Enterprise"]
    .map((planName) => {
      const matching = activeSubscriptions.filter((item) => String(item.plan || "").toLowerCase() === planName.toLowerCase());
      const monthlyRevenue = matching.reduce((total, item) => {
        const amount = Number(item.amount) || 0;
        return total + (String(item.billingCycle || "Monthly").toLowerCase() === "yearly" ? amount / 12 : amount);
      }, 0);
      const totalAmount = matching.reduce((total, item) => total + (Number(item.amount) || 0), 0);
      const cycle = matching.length && matching.every((item) => String(item.billingCycle || "Monthly").toLowerCase() === "yearly")
        ? "Yearly"
        : "Monthly";
      return { name: planName, subscribers: matching.length, monthlyRevenue, averageAmount: matching.length ? totalAmount / matching.length : 0, cycle };
    })
    .concat([...new Set(activeSubscriptions.map((item) => String(item.plan || "").trim()).filter((name) => name && !["Starter", "Pro", "Enterprise"].some((known) => known.toLowerCase() === name.toLowerCase())))].map((planName) => {
      const matching = activeSubscriptions.filter((item) => String(item.plan || "").toLowerCase() === planName.toLowerCase());
      const monthlyRevenue = matching.reduce((total, item) => {
        const amount = Number(item.amount) || 0;
        return total + (String(item.billingCycle || "Monthly").toLowerCase() === "yearly" ? amount / 12 : amount);
      }, 0);
      const totalAmount = matching.reduce((total, item) => total + (Number(item.amount) || 0), 0);
      const cycle = matching.length && matching.every((item) => String(item.billingCycle || "Monthly").toLowerCase() === "yearly") ? "Yearly" : "Monthly";
      return { name: planName, subscribers: matching.length, monthlyRevenue, averageAmount: matching.length ? totalAmount / matching.length : 0, cycle };
    }));

  // Plans & Feature Flags — uses the existing plans API.
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState("");
  const [plansMessage, setPlansMessage] = useState("");
  const [plansSaving, setPlansSaving] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planDraft, setPlanDraft] = useState({ name: "", price: "", billingCycle: "Monthly", description: "", isActive: true });
  const [featureDrafts, setFeatureDrafts] = useState({});

  const featureDefinitions = featureAccess.map(({ feature, description }) => ({ feature, description }));

  useEffect(() => {
    if (activePage !== "features") return;
    let cancelled = false;
    async function loadPlans() {
      setPlansLoading(true);
      setPlansError("");
      setPlansMessage("");
      try {
        const response = await fetch("http://localhost:5000/api/super-admin/plans");
        const result = await response.json();
        if (!response.ok || result.success === false) {
          throw new Error(result.message || `Request failed: ${response.status}`);
        }
        const records = Array.isArray(result.data) ? result.data : Array.isArray(result.plans) ? result.plans : [];
        if (!cancelled) {
          setPlans(records);
          const drafts = {};
          records.forEach((plan) => {
            drafts[String(plan._id || plan.name)] = Array.isArray(plan.features) ? [...plan.features] : [];
          });
          setFeatureDrafts(drafts);
        }
      } catch (error) {
        console.error("Error loading plans:", error);
        if (!cancelled) setPlansError(error.message || "Unable to load plans from the backend.");
      } finally {
        if (!cancelled) setPlansLoading(false);
      }
    }
    loadPlans();
    return () => { cancelled = true; };
  }, [activePage]);

  const openPlanEditor = (plan) => {
    setEditingPlan(plan);
    setPlanDraft({
      name: plan.name || "",
      price: plan.price == null ? "" : String(plan.price),
      billingCycle: plan.billingCycle || "Monthly",
      description: plan.description || "",
      isActive: plan.isActive !== false,
    });
    setPlansError("");
    setPlansMessage("");
  };

  const savePlan = async () => {
    if (!editingPlan?._id) {
      setPlansError("This plan has no database ID and cannot be updated.");
      return;
    }
    setPlansSaving(true);
    setPlansError("");
    setPlansMessage("");
    try {
      const response = await fetch(`http://localhost:5000/api/super-admin/plans/${editingPlan._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...planDraft, price: planDraft.price === "" ? 0 : Number(planDraft.price) }),
      });
      const result = await response.json();
      if (!response.ok || result.success === false) throw new Error(result.message || `Request failed: ${response.status}`);
      const updated = result.data || result.plan || { ...editingPlan, ...planDraft, price: Number(planDraft.price) };
      setPlans((current) => current.map((plan) => String(plan._id) === String(editingPlan._id) ? { ...plan, ...updated } : plan));
      setEditingPlan(null);
      setPlansMessage("Plan updated successfully.");
    } catch (error) {
      console.error("Error saving plan:", error);
      setPlansError(error.message || "Unable to save plan changes.");
    } finally {
      setPlansSaving(false);
    }
  };

  const togglePlanFeature = (plan, feature, checked) => {
    const key = String(plan._id || plan.name);
    setFeatureDrafts((current) => {
      const existing = current[key] || (Array.isArray(plan.features) ? plan.features : []);
      return { ...current, [key]: checked ? [...new Set([...existing, feature])] : existing.filter((item) => item !== feature) };
    });
  };

  const saveFeatureFlags = async () => {
    const unsavedPlans = plans.filter((plan) => plan._id);
    if (unsavedPlans.length === 0) {
      setPlansError("No saved plan records with database IDs were found.");
      return;
    }
    setPlansSaving(true);
    setPlansError("");
    setPlansMessage("");
    try {
      for (const plan of unsavedPlans) {
        const key = String(plan._id || plan.name);
        const features = featureDrafts[key] || (Array.isArray(plan.features) ? plan.features : []);
        const response = await fetch(`http://localhost:5000/api/super-admin/plans/${plan._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ features }),
        });
        const result = await response.json();
        if (!response.ok || result.success === false) throw new Error(result.message || `Could not save ${plan.name}: ${response.status}`);
        const updated = result.data || result.plan || { ...plan, features };
        setPlans((current) => current.map((item) => String(item._id) === String(plan._id) ? { ...item, ...updated, features } : item));
      }
      setPlansMessage("Feature flags saved successfully.");
    } catch (error) {
      console.error("Error saving feature flags:", error);
      setPlansError(error.message || "Unable to save feature flags.");
    } finally {
      setPlansSaving(false);
    }
  };

  // Global Super Admin settings (not tenant-specific CRM preferences).
  // The Settings API stores organization/regional/security/notifications/dataSharing.
  // This adapter keeps the existing dashboard UI fields compatible with that API.
  const defaultSettings = {
    general: {
      platformName: "Cliently",
      supportEmail: "",
      supportUrl: "",
    },
    regional: {
      timezone: "Asia/Kolkata",
      currency: "INR",
      dateFormat: "DD/MM/YYYY",
      timeFormat: "24-hour",
      language: "English",
    },
    security: {
      sessionTimeoutMinutes: 30,
      passwordMinLength: 8,
      requireTwoFactor: false,
    },
    notifications: {
      adminEmail: true,
      systemAlerts: true,
      securityAlerts: true,
      billingAlerts: true,
    },
    data: {
      auditRetentionDays: 365,
      dataRetentionDays: 365,
      maintenanceMode: false,
    },
  };

  const normalizeDashboardSettings = (saved = {}) => {
    const source = saved?.data && typeof saved.data === "object" ? saved.data : saved;
    const organization = source.organization || {};
    const regional = source.regional || {};
    const security = source.security || {};
    const notifications = source.notifications || {};
    const dataSharing = source.dataSharing || {};

    return {
      general: {
        ...defaultSettings.general,
        ...(source.general || {}),
        platformName: source.general?.platformName ?? organization.companyName ?? "Cliently",
        supportEmail: source.general?.supportEmail ?? organization.supportEmail ?? "",
        supportUrl: source.general?.supportUrl ?? organization.supportUrl ?? "",
      },
      regional: { ...defaultSettings.regional, ...regional },
      security: {
        ...defaultSettings.security,
        ...security,
        requireTwoFactor: security.requireTwoFactor ?? security.twoFactorRequired ?? false,
      },
      notifications: {
        ...defaultSettings.notifications,
        ...notifications,
        adminEmail: notifications.adminEmail ?? notifications.emailEnabled ?? true,
        systemAlerts: notifications.systemAlerts ?? notifications.systemAlertsEnabled ?? true,
      },
      data: {
        ...defaultSettings.data,
        ...(source.data || {}),
        maintenanceMode: source.data?.maintenanceMode ?? false,
      },
    };
  };

  const toApiSettings = (value) => ({
    organization: {
      companyName: value.general.platformName,
      supportEmail: value.general.supportEmail,
      supportUrl: value.general.supportUrl,
    },
    regional: value.regional,
    security: {
      ...value.security,
      twoFactorRequired: value.security.requireTwoFactor,
    },
    notifications: {
      emailEnabled: value.notifications.adminEmail,
      systemAlertsEnabled: value.notifications.systemAlerts,
    },
    dataSharing: {
      allowDataExport: true,
      allowExternalSharing: false,
    },
  });

  const [settings, setSettings] = useState(defaultSettings);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [settingsMessage, setSettingsMessage] = useState("");

  useEffect(() => {
    if (activePage !== "settings") return;

    let cancelled = false;

    async function loadSettings() {
      setSettingsLoading(true);
      setSettingsError("");
      setSettingsMessage("");

      try {
        const saved = await getSettings();
        if (!cancelled) setSettings(normalizeDashboardSettings(saved));
      } catch (error) {
        console.error("Error loading Super Admin settings:", error);

        if (!cancelled) {
          setSettingsError(
            error.status === 401
              ? `${error.message || "The Settings API rejected this request."} Check that the CRM session token is present and that the backend Settings route accepts it for the SUPER_ADMIN role.`
              : error.message || "Unable to load settings."
          );
        }
      } finally {
        if (!cancelled) setSettingsLoading(false);
      }
    }

    loadSettings();
    return () => { cancelled = true; };
  }, [activePage]);

  const updateSettingsSection = (section, field, value) => {
    setSettings((current) => ({
      ...current,
      [section]: { ...current[section], [field]: value },
    }));
    setSettingsError("");
    setSettingsMessage("");
  };

  const saveSettings = async () => {
    setSettingsSaving(true);
    setSettingsError("");
    setSettingsMessage("");
    try {
      const saved = await updateSettings(toApiSettings(settings));
      if (saved && typeof saved === "object") setSettings(normalizeDashboardSettings(saved));
      setSettingsMessage("Settings saved successfully.");
    } catch (error) {
      console.error("Error saving Super Admin settings:", error);
      setSettingsError(error.message || "Unable to save settings.");
    } finally {
      setSettingsSaving(false);
    }
  };

  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [integrationRecords, setIntegrationRecords] = useState([]);
  const [integrationsLoading, setIntegrationsLoading] = useState(false);
  const [integrationError, setIntegrationError] = useState("");
  const [integrationMessage, setIntegrationMessage] = useState("");
  const [integrationSaving, setIntegrationSaving] = useState(false);
  const [integrationDraft, setIntegrationDraft] = useState({
    name: "",
    description: "",
    enabled: false,
  });

  useEffect(() => {
    if (activePage !== "integrations") return;

    let cancelled = false;
    async function loadIntegrations() {
      setIntegrationsLoading(true);
      setIntegrationError("");
      setIntegrationMessage("");
      try {
        const response = await fetch("http://localhost:5000/api/super-admin/integrations");
        const result = await response.json();
        if (!response.ok || result.success === false) {
          throw new Error(result.message || `Request failed: ${response.status}`);
        }

        const records = Array.isArray(result.data)
          ? result.data
          : Array.isArray(result.integrations)
            ? result.integrations
            : [];

        if (!cancelled) setIntegrationRecords(records);
      } catch (error) {
        console.error("Error fetching integrations:", error);
        if (!cancelled) {
          setIntegrationError(
            error.message || "Unable to load integrations. Check the backend connection."
          );
        }
      } finally {
        if (!cancelled) setIntegrationsLoading(false);
      }
    }

    loadIntegrations();
    return () => {
      cancelled = true;
    };
  }, [activePage]);

  const openIntegrationConfig = (integration) => {
    setSelectedIntegration(integration);
    setIntegrationDraft({
      name: integration.name || "",
      description: integration.description || "",
      enabled: Boolean(integration.enabled),
    });
    setIntegrationError("");
    setIntegrationMessage("");
  };

  const saveIntegration = async () => {
    if (!selectedIntegration?._id) {
      setIntegrationError("This integration has no database ID and cannot be saved.");
      return;
    }

    setIntegrationSaving(true);
    setIntegrationError("");
    setIntegrationMessage("");
    try {
      const response = await fetch(
        `http://localhost:5000/api/super-admin/integrations/${selectedIntegration._id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(integrationDraft),
        }
      );
      const result = await response.json();
      if (!response.ok || result.success === false) {
        throw new Error(result.message || `Request failed: ${response.status}`);
      }

      const updated = result.data || result.integration || {
        ...selectedIntegration,
        ...integrationDraft,
      };
      const savedIntegration = { ...selectedIntegration, ...updated, ...integrationDraft };
      setIntegrationRecords((current) =>
        current.map((item) => String(item._id) === String(selectedIntegration._id) ? savedIntegration : item)
      );
      setSelectedIntegration(savedIntegration);
      setIntegrationMessage("Integration updated successfully.");
    } catch (error) {
      console.error("Error saving integration:", error);
      setIntegrationError(error.message || "Unable to save integration changes.");
    } finally {
      setIntegrationSaving(false);
    }
  };

  // System Health: load live values only from the existing backend APIs.
  const [systemHealth, setSystemHealth] = useState(null);
  const [systemHealthLoading, setSystemHealthLoading] = useState(false);
  const [systemHealthError, setSystemHealthError] = useState("");
  const [systemHealthCheckedAt, setSystemHealthCheckedAt] = useState(null);
  const [securityLogs, setSecurityLogs] = useState([]);
  const [securityLogsError, setSecurityLogsError] = useState("");

  useEffect(() => {
    if (activePage !== "health") return;
    let cancelled = false;

    async function loadSystemHealth() {
      setSystemHealthLoading(true);
      setSystemHealthError("");
      setSecurityLogsError("");
      const healthStartedAt = Date.now();

      try {
        const response = await fetch("http://localhost:5000/api/super-admin/system-health");
        const elapsedMs = Date.now() - healthStartedAt;
        const result = await response.json();
        if (!response.ok || result.success === false) {
          throw new Error(result.message || `System health request failed: ${response.status}`);
        }

        // Support either a direct data object or common response wrappers.
        const rawHealth = result.data || result.health || result.systemHealth || result;
        const isPlaceholder = !rawHealth || (rawHealth.message &&
          !rawHealth.status && !rawHealth.services && !rawHealth.metrics &&
          rawHealth.uptime === undefined && rawHealth.storage === undefined);
        const healthData = isPlaceholder
          ? { apiAvailable: true, apiResponseMs: elapsedMs }
          : { ...rawHealth, apiAvailable: true, apiResponseMs: elapsedMs };

        if (!cancelled) {
          setSystemHealth(healthData);
          setSystemHealthCheckedAt(new Date());
        }
      } catch (error) {
        console.error("Error fetching system health:", error);
        if (!cancelled) {
          setSystemHealth(null);
          setSystemHealthError(error.message || "Unable to load system health.");
          setSystemHealthCheckedAt(new Date());
        }
      } finally {
        if (!cancelled) setSystemHealthLoading(false);
      }

      try {
        const response = await fetch("http://localhost:5000/api/super-admin/security-logs");
        const result = await response.json();
        if (!response.ok || result.success === false) {
          throw new Error(result.message || `Security logs request failed: ${response.status}`);
        }
        const records = Array.isArray(result.data)
          ? result.data
          : Array.isArray(result.logs)
            ? result.logs
            : Array.isArray(result.securityLogs)
              ? result.securityLogs
              : [];
        if (!cancelled) setSecurityLogs(records);
      } catch (error) {
        console.error("Error fetching security logs:", error);
        if (!cancelled) {
          setSecurityLogs([]);
          setSecurityLogsError(error.message || "Unable to load security logs.");
        }
      }
    }

    loadSystemHealth();
    return () => { cancelled = true; };
  }, [activePage]);

  const refreshSystemHealth = () => {
    // Changing away and back to this page triggers a fresh read without changing other modules.
    setActivePage("dashboard");
    window.setTimeout(() => setActivePage("health"), 0);
  };

  const readHealthValue = (...values) => {
    const value = values.find((item) => item !== undefined && item !== null && item !== "");
    return value === undefined ? "Not reported by API" : value;
  };

  const formatSecurityEventTime = (item) => {
    const value = item.createdAt || item.timestamp || item.date || item.time;
    if (!value) return "Time not provided";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  };

  const pageHeaders = {
    dashboard: {
      eyebrow: "ADMINISTRATION",
      title: "Super Admin Dashboard",
      subtitle: "Platform overview and administration controls.",
    },
    tenants: {
      eyebrow: "PLATFORM MANAGEMENT",
      title: "Tenant Management",
      subtitle: "Manage subscribed companies and their environments.",
    },
    billing: {
      eyebrow: "FINANCIAL MANAGEMENT",
      title: "Subscription & Billing",
      subtitle: "Manage subscription plans, revenue and tenant billing.",
    },
    features: {
      eyebrow: "PLATFORM CONFIGURATION",
      title: "Plans & Feature Flags",
      subtitle: "Control plan access and platform feature availability.",
    },
    health: {
      eyebrow: "SYSTEM MONITORING",
      title: "System Health",
      subtitle: "Monitor platform performance, infrastructure and security.",
    },
    integrations: {
      eyebrow: "PLATFORM SERVICES",
      title: "Integrations",
      subtitle: "Manage global integrations and connected services.",
    },
    notifications: {
      eyebrow: "COMMUNICATION",
      title: "Notifications",
      subtitle: "Review important platform alerts and system activity.",
    },
    announcements: {
      eyebrow: "COMMUNICATION",
      title: "Announcements",
      subtitle: "Manage platform-wide announcements and updates.",
    },
    settings: {
      eyebrow: "ADMINISTRATION",
      title: "Settings",
      subtitle: "Configure Cliently platform administration and security.",
    },
  };

  return (
    <div className="super-admin-layout">
      {/* SIDEBAR */}
      <aside className="super-admin-sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">CRM</div>

          <div className="brand-text">
            <strong>Cliently</strong>
            <span>Administration</span>
          </div>
        </div>

        <nav className="sidebar-nav">


  <button
  className={`nav-item ${activePage === "dashboard" ? "active" : ""}`}
  onClick={() => setActivePage("dashboard")}
>
  <span>▦</span>
  Dashboard
</button>


  <button
    className={`nav-item ${activePage === "tenants" ? "active" : ""}`}
    onClick={() => setActivePage("tenants")}
  >
    <span>▣</span>
    Tenant Management
  </button>

  <button
    className={`nav-item ${activePage === "billing" ? "active" : ""}`}
    onClick={() => setActivePage("billing")}
  >
    <span>◫</span>
    Subscription & Billing
  </button>

  <button
    className={`nav-item ${activePage === "features" ? "active" : ""}`}
    onClick={() => setActivePage("features")}
  >
    <span>⚙</span>
    Plans & Feature Flags
  </button>

  <button
    className={`nav-item ${activePage === "health" ? "active" : ""}`}
    onClick={() => setActivePage("health")}
  >
    <span>◉</span>
    System Health
  </button>

  <button
    className={`nav-item ${activePage === "integrations" ? "active" : ""}`}
    onClick={() => setActivePage("integrations")}
  >
    <span>⊞</span>
    Integrations
  </button>


  <button
    className={`nav-item ${activePage === "notifications" ? "active" : ""}`}
    onClick={() => setActivePage("notifications")}
  >
    <span>♢</span>
    Notifications
  </button>

  <button
    className={`nav-item ${activePage === "announcements" ? "active" : ""}`}
    onClick={() => setActivePage("announcements")}
  >
    <span>◌</span>
    Announcements
  </button>


  <button
    className={`nav-item ${activePage === "settings" ? "active" : ""}`}
    onClick={() => setActivePage("settings")}
  >
    <span>⚙</span>
    Settings
  </button>

</nav>
      </aside>

      {/* MAIN */}
      <main className={`super-admin-main page-${activePage}`}>
        {/* HEADER */}
        <header className="dashboard-header">
          <div>
            <p className="section-eyebrow">ADMINISTRATION</p>
            <h1>{pageHeaders[activePage].title}</h1>
            <p className="dashboard-subtitle">
  {pageHeaders[activePage].subtitle}
</p>

        
          </div>

          <div className="dashboard-header-actions">
            <div className="admin-menu-wrapper">
              <button
                type="button"
                className="admin-profile admin-profile-trigger"
                aria-haspopup="menu"
                aria-expanded={profileMenuOpen}
                onClick={() => setProfileMenuOpen((open) => !open)}
              >
                <span className="admin-avatar">SA</span>
                <span className="admin-profile-info">
                  <strong>Super Admin</strong>
                  <span>Platform Administrator</span>
                </span>
                <span className="profile-arrow" aria-hidden="true">⌄</span>
              </button>

              {profileMenuOpen && (
                <>
                  <button
                    type="button"
                    className="profile-menu-backdrop"
                    aria-label="Close profile menu"
                    onClick={() => setProfileMenuOpen(false)}
                  />
                  <div className="admin-profile-menu" role="menu">
                    <div className="profile-menu-heading">
                      <strong>Super Admin</strong>
                      <span>Platform Administrator</span>
                    </div>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        setProfileDialogOpen(true);
                      }}
                    >
                      <span aria-hidden="true">◉</span> Profile
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="profile-menu-logout"
                      onClick={handleAdminLogout}
                    >
                      <span aria-hidden="true">↪</span> Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
</header>

        {/* OVERVIEW */}
       <section
  className={`dashboard-section ${
    activePage === "dashboard" ? "page-active" : ""
  }`}
  id="overview"
>
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">OVERVIEW</p>
             <h2>Platform Overview</h2>
            </div>
          </div>

          <div className="overview-grid">
            <div className="overview-card">
              <div className="overview-card-top">
                <span>Total Tenants</span>
                <span className="metric-icon">▣</span>
              </div>
              <strong>116</strong>
              <small>All subscribed companies</small>
            </div>

            <div className="overview-card">
              <div className="overview-card-top">
                <span>Active Subscriptions</span>
                <span className="metric-icon">✓</span>
              </div>
              <strong>116</strong>
              <small>Currently active plans</small>
            </div>

            <div className="overview-card">
              <div className="overview-card-top">
                <span>Monthly Recurring Revenue</span>
                <span className="metric-icon">$</span>
              </div>
              <strong>$42.8K</strong>
              <small>Current MRR</small>
            </div>

            <div className="overview-card">
              <div className="overview-card-top">
                <span>Platform Uptime</span>
                <span className="metric-icon">◉</span>
              </div>
              <strong>99.9%</strong>
              <small>Last 30 days</small>
            </div>
          </div>
        </section>

        {/* TENANTS */}
        <section
  className={`dashboard-section ${
    activePage === "tenants" ? "page-active" : ""
  }`}
  id="tenants"
>
          <div className="section-heading section-heading-row">
            <div>
              <p className="section-eyebrow">PLATFORM MANAGEMENT</p>
              <h2>Tenant Management</h2>
              <p>Manage subscribed companies and their environments.</p>
            </div>

            <button className="secondary-button">View All Tenants</button>
          </div>

          <div className="tenant-summary-grid">
            <div>
              <span>Total Tenants</span>
              <strong>{tenantsLoading ? "…" : totalTenants}</strong>
            </div>
            <div>
              <span>Active</span>
              <strong>{tenantsLoading ? "…" : activeTenants}</strong>
            </div>
            <div>
              <span>Pending</span>
              <strong>{tenantsLoading ? "…" : pendingTenants}</strong>
            </div>
            <div>
              <span>Blocked</span>
              <strong>{tenantsLoading ? "…" : blockedTenants}</strong>
            </div>
          </div>

          <div className="dashboard-card table-card">
            <div className="table-header">
              <div>
                <h3>Recent Tenants</h3>
                <p>Latest tenant environments created on the platform.</p>
              </div>
              <button className="text-button">Export</button>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Plan</th>
                    <th>Environment</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {tenantsLoading ? (
                    <tr><td colSpan={6}>Loading tenants...</td></tr>
                  ) : tenantError ? (
                    <tr><td colSpan={6}>{tenantError}</td></tr>
                  ) : tenants.length === 0 ? (
                    <tr><td colSpan={6}>No tenants found.</td></tr>
                  ) : (
                    tenants.map((tenant) => (
                    <tr key={tenant._id || tenant.company}>
                      <td>
                        <div className="company-cell">
                          <div className="company-avatar">
                            {tenant.company.charAt(0)}
                          </div>

                          <div>
                            <strong>{tenant.company}</strong>
                            <span>{tenant.admin}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={`plan-badge ${tenant.plan.toLowerCase()}`}>
                          {tenant.plan}
                        </span>
                      </td>

                      <td>{tenant.environment}</td>

                      <td>
                        <span
                          className={`status-badge ${tenant.status.toLowerCase()}`}
                        >
                          <span></span>
                          {tenant.status}
                        </span>
                      </td>

                      <td>{tenant.date}</td>

                      <td>
                        <button
                          type="button"
                          className="table-action"
                          onClick={() => setSelectedTenant(tenant)}
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {selectedTenant && (
          <div
            role="presentation"
            onClick={() => setSelectedTenant(null)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 2000,
              background: "rgba(15, 23, 42, 0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="tenant-details-title"
              onClick={(event) => event.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: "480px",
                background: "var(--card-bg, #ffffff)",
                color: "var(--text-color, #172033)",
                borderRadius: "14px",
                padding: "24px",
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.25)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
                <h2 id="tenant-details-title" style={{ margin: 0 }}>Tenant Details</h2>
                <button type="button" className="table-action" onClick={() => setSelectedTenant(null)} aria-label="Close tenant details">Close</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(110px, 1fr) 2fr", gap: "12px 16px", overflowWrap: "anywhere" }}>
                <strong>Company</strong><span>{selectedTenant.company || "—"}</span>
                <strong>Administrator</strong><span>{selectedTenant.admin || "—"}</span>
                <strong>Email</strong><span>{selectedTenant.email || "—"}</span>
                <strong>Plan</strong><span>{selectedTenant.plan || "—"}</span>
                <strong>Environment</strong><span>{selectedTenant.environment || "—"}</span>
                <strong>Status</strong><span>{selectedTenant.status || "—"}</span>
                <strong>Created</strong><span>{selectedTenant.date || "—"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
                <button type="button" className="secondary-button" onClick={() => setSelectedTenant(null)}>Done</button>
              </div>
            </div>
          </div>
        )}

        {/* BILLING — subscription counts and revenue are calculated from MongoDB records */}
        {activePage === "billing" && (
          <section className="dashboard-card" id="billing">
            <div className="section-heading section-heading-row">
              <div>
                <p className="section-eyebrow">FINANCIAL OVERVIEW</p>
                <h2>Subscription &amp; Billing Control</h2>
                <p>Monitor subscription records, recurring revenue and billing status.</p>
              </div>
              <button type="button" className="secondary-button" onClick={refreshSubscriptions} disabled={subscriptionsLoading}>
                {subscriptionsLoading ? "Refreshing..." : "Refresh Subscriptions"}
              </button>
            </div>

            {subscriptionsError && <p role="alert" style={{ color: "#c0392b", margin: "12px 0" }}>{subscriptionsError}</p>}

            <div className="billing-summary-grid">
              {billingPlanSummary.slice(0, 3).map((plan) => (
                <div className="billing-summary-card" key={plan.name}>
                  <span>{plan.name}</span>
                  <strong>{subscriptionsLoading ? "…" : plan.subscribers}</strong>
                  <small>Active subscriptions</small>
                </div>
              ))}
              <div className="billing-summary-card highlight">
                <span>Monthly Recurring Revenue</span>
                <strong>{subscriptionsLoading ? "…" : formatINR(monthlyRecurringRevenue)}</strong>
                <small>Calculated from active subscriptions</small>
              </div>
            </div>

            <div className="billing-alert">
              <div className="billing-alert-indicator">!</div>
              <div>
                <strong>Subscriptions needing attention</strong>
                <p>{subscriptionsLoading ? "Checking subscription statuses..." : `${attentionSubscriptions.length} subscription(s) have Pending or Expired status.`}</p>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="table-header">
                <div>
                  <h3>Subscription Plans</h3>
                  <p>Distribution and revenue calculated from saved subscription records.</p>
                </div>
                <span className="integration-count">{subscriptions.length} record{subscriptions.length === 1 ? "" : "s"}</span>
              </div>

              <div className="table-wrapper">
                <table className="billing-table">
                  <thead>
                    <tr>
                      <th>Plan</th>
                      <th>Active Subscribers</th>
                      <th>Average Price</th>
                      <th>Monthly Revenue</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptionsLoading ? (
                      <tr><td colSpan={5}>Loading subscriptions from MongoDB...</td></tr>
                    ) : subscriptionsError ? (
                      <tr><td colSpan={5}>Subscriptions could not be loaded. Check the backend API.</td></tr>
                    ) : billingPlanSummary.length === 0 || subscriptions.length === 0 ? (
                      <tr><td colSpan={5}>No subscription records found in the database yet.</td></tr>
                    ) : billingPlanSummary.map((plan) => (
                      <tr key={plan.name}>
                        <td><strong>{plan.name}</strong></td>
                        <td>{plan.subscribers}</td>
                        <td>{plan.subscribers ? `${formatINR(plan.averageAmount)} / ${plan.cycle.toLowerCase()}` : "—"}</td>
                        <td>{formatINR(plan.monthlyRevenue)}</td>
                        <td><span className="billing-status">{plan.subscribers ? "Active" : "No active subscriptions"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="billing-revenue-grid">
              <div className="revenue-card">
                <span>Annual Recurring Revenue</span>
                <strong>{subscriptionsLoading ? "…" : formatINR(monthlyRecurringRevenue * 12)}</strong>
                <small>Monthly recurring revenue × 12</small>
              </div>
              <div className="revenue-card">
                <span>Total Subscriptions</span>
                <strong>{subscriptionsLoading ? "…" : subscriptions.length}</strong>
                <small>{activeSubscriptions.length} active · {subscriptions.length - activeSubscriptions.length} non-active</small>
              </div>
            </div>

            {!subscriptionsLoading && !subscriptionsError && subscriptions.length > 0 && (
              <div className="dashboard-card" style={{ marginTop: "20px" }}>
                <div className="table-header">
                  <div>
                    <h3>Subscription Records</h3>
                    <p>Individual records returned by the subscriptions API.</p>
                  </div>
                </div>
                <div className="table-wrapper">
                  <table className="billing-table">
                    <thead><tr><th>Company</th><th>Plan</th><th>Billing Cycle</th><th>Amount</th><th>Status</th><th>Start Date</th><th>End Date</th></tr></thead>
                    <tbody>
                      {subscriptions.map((item, index) => (
                        <tr key={item._id || `${item.company}-${index}`}>
                          <td><strong>{item.company || "Unnamed company"}</strong></td>
                          <td>{item.plan || "—"}</td>
                          <td>{item.billingCycle || "Monthly"}</td>
                          <td>{formatINR(item.amount)}</td>
                          <td><span className="billing-status">{item.status || "Pending"}</span></td>
                          <td>{item.startDate ? new Date(item.startDate).toLocaleDateString("en-IN") : "—"}</td>
                          <td>{item.endDate ? new Date(item.endDate).toLocaleDateString("en-IN") : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* PLANS & FEATURE FLAGS — connected to the existing plans API */}
        {activePage === "features" && (
          <section className="dashboard-section features-page" id="features">
            <div className="section-heading section-heading-row">
              <div>
                <p className="section-eyebrow">PLATFORM CONFIGURATION</p>
                <h2>Plans &amp; Feature Flags</h2>
                <p>Manage subscription plan details and feature availability.</p>
              </div>
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
                      <button type="button" className="table-action" onClick={() => openPlanEditor(plan)}>Edit Plan</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {editingPlan && (
              <div className="dashboard-card" style={{ marginTop: "20px", padding: "20px" }}>
                <div className="card-title-area">
                  <h3>Edit {editingPlan.name}</h3>
                  <p>Changes are saved to the existing Plans API.</p>
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
                      <option value="Monthly">Monthly</option><option value="Yearly">Yearly</option><option value="Custom">Custom</option>
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
                  <button type="button" className="primary-button" onClick={savePlan} disabled={plansSaving}>{plansSaving ? "Saving..." : "Save Plan"}</button>
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

    {/* SYSTEM HEALTH — connected to the existing backend APIs only */}
    {activePage === "health" && (
      <section className="dashboard-section" id="health">
        <div className="section-heading section-heading-row">
          <div>
            <p className="section-eyebrow">SYSTEM MONITORING</p>
            <h2>System Health</h2>
            <p>Live API availability and security activity from the backend.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <span className="last-checked">
              {systemHealthCheckedAt ? `Last checked: ${systemHealthCheckedAt.toLocaleTimeString("en-IN")}` : "Not checked yet"}
            </span>
            <button type="button" className="secondary-button" onClick={refreshSystemHealth}>
              Refresh Health
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
            <div className="health-status-dot"></div>
            <div>
              <strong>
                {systemHealthLoading ? "Checking backend services…" : systemHealthError ? "Health check unavailable" : "Backend health endpoint reachable"}
              </strong>
              <p>
                {systemHealthError
                  ? "The frontend could not confirm system health. Check the backend route and server."
                  : systemHealthLoading
                    ? "Waiting for the System Health API response."
                    : "Only values returned by the backend are shown; unavailable metrics are not fabricated."}
              </p>
            </div>
          </div>
          <span className="health-status-badge">
            {systemHealthLoading ? "Checking" : systemHealthError ? "Unavailable" : "API reachable"}
          </span>
        </div>

        <div className="health-metrics-grid">
          <div className="health-metric-card">
            <div className="health-metric-top">
              <span>System Health API</span>
              <span className={`metric-status ${systemHealthError ? "normal" : "healthy"}`}>
                {systemHealthLoading ? "Checking" : systemHealthError ? "Unavailable" : "Reachable"}
              </span>
            </div>
            <strong>{systemHealthLoading ? "…" : systemHealthError ? "—" : `${readHealthValue(systemHealth?.apiResponseMs)}${typeof systemHealth?.apiResponseMs === "number" ? " ms" : ""}`}</strong>
            <small>Response time measured by this dashboard</small>
          </div>

          <div className="health-metric-card">
            <div className="health-metric-top">
              <span>Server Uptime</span>
              <span className="metric-status normal">Backend metric</span>
            </div>
           {systemHealth?.data?.server?.uptimeSeconds != null
  ? `${Math.floor(systemHealth.data.server.uptimeSeconds / 3600)}h ${Math.floor((systemHealth.data.server.uptimeSeconds % 3600) / 60)}m`
  : "Not reported by API"}
            <small>Shown only when supplied by the API</small>
          </div>

          <div className="health-metric-card">
            <div className="health-metric-top">
              <span>Storage Capacity</span>
              <span className="metric-status normal">Backend metric</span>
            </div>
           <strong>
  {systemHealth?.system?.totalMemoryMB != null
    ? `${systemHealth.system.totalMemoryMB} MB total RAM`
    : "Not reported by API"}
</strong>
     <small>Shown only when supplied by the API</small>
          </div>
        </div>

        <div className="health-content-grid">
          <div className="dashboard-card">
            <div className="card-title-area">
              <h3>Service Status</h3>
              <p>Services reported by the System Health API.</p>
            </div>
            <div className="service-status-table">
              {systemHealthLoading ? (
                <p style={{ padding: "16px" }}>Loading system health…</p>
              ) : systemHealthError ? (
                <p style={{ padding: "16px" }}>Service status is unavailable because the health request failed.</p>
              ) : (() => {
                const rawServices = systemHealth?.services || systemHealth?.data?.services || systemHealth?.metrics?.services || [];
                const serviceRows = Array.isArray(rawServices)
                  ? rawServices.map((item) => typeof item === "string"
                    ? { name: item, status: "Reported by API", responseTime: "Not reported by API" }
                    : { name: item.name || item.service || item.label || "Unnamed service", status: item.status || item.state || "Not reported by API", responseTime: item.responseTime ?? item.latency ?? item.response ?? "Not reported by API" })
                  : Object.entries(rawServices).map(([name, item]) => typeof item === "object" && item !== null
                    ? { name, status: item.status || item.state || "Not reported by API", responseTime: item.responseTime ?? item.latency ?? "Not reported by API" }
                    : { name, status: String(item), responseTime: "Not reported by API" });
                return serviceRows.length ? serviceRows.map((service, index) => (
                  <div className="service-status-row" key={`${service.name}-${index}`}>
                    <div><strong>{service.name}</strong></div>
                    <span className="service-operational"><span></span>{service.status}</span>
                    <span>{service.responseTime}</span>
                  </div>
                )) : <p style={{ padding: "16px" }}>The health endpoint did not provide individual service metrics.</p>;
              })()}
            </div>
          </div>
          
      <div className="dashboard-card health-memory-card">
  <div className="card-title-area">
    <h3>Server Memory Usage</h3>
    <p>Live memory metrics reported by the backend.</p>
  </div>

  <div className="health-memory-grid">
    <div className="health-memory-item">
      <span>Total Memory</span>
      <strong>
       {systemHealth?.system?.totalMemoryMB ?? "—"} MB
      </strong>
    </div>

    <div className="health-memory-item">
      <span>Free Memory</span>
      <strong>
        {systemHealth?.system?.freeMemoryMB ?? "—"} MB
      </strong>
    </div>

    <div className="health-memory-item">
      <span>Process Memory</span>
      <strong>
        {systemHealth?.system?.processMemoryMB ?? "—"} MB
      </strong>
    </div>

    <div className="health-memory-item">
      <span>Database Status</span>
      <strong>
        {systemHealth?.database?.status ?? "Unknown"}
      </strong>
    </div>
  </div>
</div>
        <div className="dashboard-card security-events-card">
            <div className="card-title-area">
              <h3>Security Events</h3>
              <p>Recent records returned by the Security Logs API.</p>
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
        </div>
      </section>
    )}
        {/* INTEGRATIONS */}
        {activePage === "integrations" && (
          <section className="dashboard-section" id="integrations">
            <div className="section-heading section-heading-row">
              <div>
                <p className="section-eyebrow">PLATFORM SERVICES</p>
                <h2>Global Integrations</h2>
                <p>Manage third-party services available across Cliently tenants.</p>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setIntegrationsLoading(true);
                  setIntegrationError("");
                  fetch("http://localhost:5000/api/super-admin/integrations")
                    .then(async (response) => {
                      const result = await response.json();
                      if (!response.ok || result.success === false) {
                        throw new Error(result.message || `Request failed: ${response.status}`);
                      }
                      const records = Array.isArray(result.data)
                        ? result.data
                        : Array.isArray(result.integrations)
                          ? result.integrations
                          : [];
                      setIntegrationRecords(records);
                    })
                    .catch((error) => {
                      console.error("Error refreshing integrations:", error);
                      setIntegrationError(error.message || "Could not refresh integrations.");
                    })
                    .finally(() => setIntegrationsLoading(false));
                }}
              >
                Refresh Integrations
              </button>
            </div>

            {integrationError && (
              <p role="alert" style={{ color: "#c0392b", margin: "12px 0" }}>
                {integrationError}
              </p>
            )}
            {integrationMessage && (
              <p role="status" style={{ color: "#218838", margin: "12px 0" }}>
                {integrationMessage}
              </p>
            )}

            <div className="integration-overview">
              <div className="integration-overview-item">
                <span className="integration-overview-label">Configured Integrations</span>
                <strong>{integrationRecords.length}</strong>
                <small>Stored in the database</small>
              </div>
              <div className="integration-overview-item">
                <span className="integration-overview-label">Enabled Integrations</span>
                <strong>{integrationRecords.filter((item) => item.enabled).length}</strong>
                <small>Platform-level availability</small>
              </div>
              <div className="integration-overview-item">
                <span className="integration-overview-label">API Status</span>
                <strong className="integration-status-text">
                  {integrationsLoading ? "Checking…" : integrationError ? "Check API" : "Connected"}
                </strong>
                <small>Integration API response</small>
              </div>
            </div>

            <div className="integration-section-header">
              <div>
                <h3>Configured Integrations</h3>
                <p>Names, descriptions and enabled status are loaded from MongoDB.</p>
              </div>
              <span className="integration-count">
                {integrationRecords.length} integration{integrationRecords.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="integration-card-grid">
              {integrationsLoading ? (
                <div className="dashboard-card" style={{ padding: "20px" }}>
                  Loading integrations from the database...
                </div>
              ) : integrationRecords.length === 0 ? (
                <div className="dashboard-card" style={{ padding: "20px" }}>
                  {integrationError
                    ? "Integrations could not be loaded. Check the backend API."
                    : "No integrations found. Add records to the Integrations collection first."}
                </div>
              ) : (
                integrationRecords.map((integration) => {
                  const isEnabled = Boolean(integration.enabled);
                  const rawStatus = String(integration.status || "").toLowerCase();
                  const status = ["error", "pending"].includes(rawStatus)
                    ? integration.status
                    : (isEnabled ? "Connected" : "Disconnected");
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
                          <span></span>
                          {status}
                        </span>
                      </div>

                      <div className="integration-divider"></div>
                      <p className="integration-description">
                        {integration.description || "No description provided."}
                      </p>

                      <div className="integration-details">
                        <div>
                          <span>Enabled</span>
                          <strong>{isEnabled ? "Yes" : "No"}</strong>
                        </div>
                        <div>
                          <span>Last Sync</span>
                          <strong>
                            {integration.lastSyncAt
                              ? new Date(integration.lastSyncAt).toLocaleString("en-IN", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })
                              : "Not synced"}
                          </strong>
                        </div>
                      </div>

                      <div className="integration-card-footer">
                        <span className="integration-api-status">
                          <span></span>
                          {isEnabled ? "Enabled on platform" : "Disabled on platform"}
                        </span>
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => openIntegrationConfig(integration)}
                        >
                          Configure
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {selectedIntegration && (
              <div className="dashboard-card integration-config-panel">
                <div className="table-header">
                  <div>
                    <h3>Configure {selectedIntegration.name}</h3>
                    <p>Update the integration record stored in the backend.</p>
                  </div>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => {
                      setSelectedIntegration(null);
                      setIntegrationError("");
                      setIntegrationMessage("");
                    }}
                  >
                    Close
                  </button>
                </div>

                <div className="settings-form-grid">
                  <div className="settings-field">
                    <label htmlFor="integration-name">Integration Name</label>
                    <input
                      id="integration-name"
                      type="text"
                      value={integrationDraft.name}
                      onChange={(event) =>
                        setIntegrationDraft((current) => ({ ...current, name: event.target.value }))
                      }
                    />
                  </div>
                  <div className="settings-field">
                    <label htmlFor="integration-description">Description</label>
                    <input
                      id="integration-description"
                      type="text"
                      value={integrationDraft.description}
                      onChange={(event) =>
                        setIntegrationDraft((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="settings-field">
                    <label htmlFor="integration-enabled">Platform Availability</label>
                    <select
                      id="integration-enabled"
                      value={integrationDraft.enabled ? "true" : "false"}
                      onChange={(event) =>
                        setIntegrationDraft((current) => ({
                          ...current,
                          enabled: event.target.value === "true",
                        }))
                      }
                    >
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={saveIntegration}
                    disabled={integrationSaving}
                  >
                    {integrationSaving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setIntegrationDraft({
                        name: selectedIntegration.name || "",
                        description: selectedIntegration.description || "",
                        enabled: Boolean(selectedIntegration.enabled),
                      });
                      setIntegrationError("");
                      setIntegrationMessage("");
                    }}
                    disabled={integrationSaving}
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* NOTIFICATIONS */}
{activePage === "notifications" && (
  <section className="dashboard-section" id="notifications">
    <div className="section-heading section-heading-row">
      <div>
        <p className="section-eyebrow">ACTIVITY CENTER</p>
        <h2>Notifications</h2>
        <p>Monitor important platform events, billing alerts and system activity.</p>
      </div>
      <button
        className="secondary-button"
        onClick={markAllNotificationsRead}
        disabled={notificationsLoading || notifications.every((item) => !item.unread)}
        title="Save read status for all unread notifications in MongoDB."
      >
        Mark All as Read
      </button>
    </div>

    {notificationError && (
      <p role="alert" style={{ color: "#c0392b", margin: "12px 0" }}>{notificationError}</p>
    )}

    <div className="notification-summary">
      <div className="notification-summary-card">
        <div><span>Total Notifications</span><strong>{notifications.length}</strong></div>
        <div className="notification-summary-icon">N</div>
      </div>
      <div className="notification-summary-card">
        <div><span>Unread</span><strong className="notification-unread-count">{notifications.filter((item) => item.unread).length}</strong></div>
        <div className="notification-summary-icon unread">{notifications.filter((item) => item.unread).length}</div>
      </div>
      <div className="notification-summary-card">
        <div><span>Critical Alerts</span><strong>{notifications.filter((item) => /critical|urgent|high/i.test(String(item.priority || item.severity || ""))).length}</strong></div>
        <div className="notification-summary-icon alert">!</div>
      </div>
    </div>

    <div className="notification-toolbar">
      <div className="notification-tabs">
        {["All", "Unread", "Billing", "System"].map((filter) => (
          <button
            key={filter}
            className={`notification-tab ${notificationFilter === filter ? "active" : ""}`}
            onClick={() => setNotificationFilter(filter)}
          >
            {filter}
            {filter === "Unread" && <span>{notifications.filter((item) => item.unread).length}</span>}
          </button>
        ))}
      </div>
      <select
        className="notification-filter"
        value={notificationSort}
        onChange={(event) => setNotificationSort(event.target.value)}
        aria-label="Sort notifications"
      >
        <option value="latest">Latest first</option>
        <option value="oldest">Oldest first</option>
      </select>
    </div>

    <div className="notification-panel">
      {notificationsLoading ? (
        <p style={{ padding: "20px" }}>Loading notifications from the database...</p>
      ) : (() => {
        const filtered = notifications.filter((item) => {
          if (notificationFilter === "Unread") return item.unread;
          if (notificationFilter === "Billing") return /billing|payment|subscription|invoice/i.test(`${item.category} ${item.title} ${item.description}`);
          if (notificationFilter === "System") return /system|security|maintenance|platform/i.test(`${item.category} ${item.title} ${item.description}`);
          return true;
        }).sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return notificationSort === "latest" ? bTime - aTime : aTime - bTime;
        });

        if (filtered.length === 0) {
          return <p style={{ padding: "20px" }}>{notificationError ? "Notifications could not be loaded." : "No notifications found for this filter."}</p>;
        }

        return filtered.map((item, index) => {
          const categoryText = String(item.category || "System");
          const categoryClass = /billing|payment/i.test(categoryText) ? "billing" : /tenant|company/i.test(categoryText) ? "tenant" : /security|critical/i.test(categoryText) ? "security" : /plan|feature|config/i.test(categoryText) ? "plan" : "system";
          const timestamp = item.createdAt
            ? new Date(item.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
            : (item.time || "Time unavailable");
          const id = item._id || item.id || `${item.title}-${index}`;

          return (
            <div key={id} className={`notification-item ${item.unread ? "unread" : ""}`}>
              <div className={`notification-item-icon ${categoryClass}`}>
                {categoryClass === "billing" ? "$" : categoryClass === "tenant" ? "+" : categoryClass === "security" ? "!" : categoryClass === "plan" ? "P" : "i"}
              </div>
              <div className="notification-item-content">
                <div className="notification-item-title">
                  <h3>{item.title}</h3>
                  <span className={`notification-priority ${/critical|urgent|high/i.test(String(item.priority || item.severity || "")) ? "critical" : categoryClass === "billing" ? "attention" : "normal"}`}>
                    {item.priority || item.severity || categoryText}
                  </span>
                </div>
                <p>{item.description}</p>
                <div className="notification-meta">
                  <span>{item.source}</span><span>•</span><span>{timestamp}</span>
                </div>
              </div>
              <div className="notification-item-actions">
                {item.unread && <span className="notification-unread-dot"></span>}
                <button
                  onClick={() => item.unread ? markNotificationRead(item) : undefined}
                  disabled={!item.unread}
                  title={item.unread ? "Mark this notification as read" : "Already read"}
                >
                  {item.unread ? "Mark Read" : "Read"}
                </button>
              </div>
            </div>
          );
        });
      })()}
    </div>

    <div className="notification-footer">
      <span>Showing {notifications.filter((item) => {
        if (notificationFilter === "Unread") return item.unread;
        if (notificationFilter === "Billing") return /billing|payment|subscription|invoice/i.test(`${item.category} ${item.title} ${item.description}`);
        if (notificationFilter === "System") return /system|security|maintenance|platform/i.test(`${item.category} ${item.title} ${item.description}`);
        return true;
      }).length} notification(s) from the API</span>
      <button className="text-button" onClick={() => setNotificationFilter("All")}>View All Notifications →</button>
    </div>
  </section>
)}

{/* ANNOUNCEMENTS */}
 {activePage === "announcements" && (
  <section className="dashboard-section" id="announcements">
    <div className="section-heading section-heading-row">
      <div>
        <p className="section-eyebrow">PLATFORM COMMUNICATION</p>
        <h2>Announcements</h2>
        <p>Publish important updates and platform communications to Cliently tenants.</p>
      </div>
      <button
        className="primary-button"
        onClick={async () => {
          const title = window.prompt("Announcement title:");
          if (!title || !title.trim()) return;
          const message = window.prompt("Announcement message:");
          if (!message || !message.trim()) return;
          const type = window.prompt("Announcement type (General, Billing, Security, Feature):", "General") || "General";
          const statusInput = window.prompt("Status (Draft or Published):", "Draft") || "Draft";
          const status = statusInput.trim().toLowerCase() === "published" ? "Published" : "Draft";
          try {
            const response = await fetch("http://localhost:5000/api/super-admin/announcements", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ title: title.trim(), message: message.trim(), type: type.trim(), status, ...(status === "Published" ? { publishedAt: new Date().toISOString() } : {}) })
            });
            const result = await response.json();
            if (!response.ok || result.success === false) throw new Error(result.message || `Request failed: ${response.status}`);
            const created = result.data || result.announcement;
            if (created) setAnnouncements((current) => [created, ...current]);
            else {
              const refreshed = await fetch("http://localhost:5000/api/super-admin/announcements");
              const refreshedResult = await refreshed.json();
              setAnnouncements(Array.isArray(refreshedResult.data) ? refreshedResult.data : []);
            }
            window.alert("Announcement saved successfully.");
          } catch (error) {
            console.error("Create announcement error:", error);
            window.alert("Could not save announcement. Check whether the backend supports POST on this route.");
          }
        }}
      >+ New Announcement</button>
    </div>

    <div className="announcement-summary">
      <div className="announcement-summary-card"><div><span>Total Announcements</span><strong>{announcements.length}</strong></div><div className="announcement-summary-icon">A</div></div>
      <div className="announcement-summary-card"><div><span>Published</span><strong className="announcement-published-count">{announcements.filter((item) => String(item.status || "").toLowerCase() === "published").length}</strong></div><div className="announcement-summary-icon published">✓</div></div>
      <div className="announcement-summary-card"><div><span>Drafts</span><strong>{announcements.filter((item) => String(item.status || "").toLowerCase() === "draft").length}</strong></div><div className="announcement-summary-icon draft">D</div></div>
    </div>

    <div className="announcement-toolbar">
      <div className="announcement-tabs">
        {["All", "Published", "Drafts"].map((filter) => (
          <button key={filter} className={`announcement-tab ${announcementFilter === filter ? "active" : ""}`} onClick={() => setAnnouncementFilter(filter)}>{filter}</button>
        ))}
      </div>
      <select className="announcement-filter" value={announcementSort} onChange={(event) => setAnnouncementSort(event.target.value)}>
        <option value="latest">Latest first</option><option value="oldest">Oldest first</option>
      </select>
    </div>

    <div className="announcement-panel">
      {announcementsLoading ? <p>Loading announcements...</p> : announcementError ? <p role="alert">{announcementError}</p> : (() => {
        let visible = announcements.filter((item) => announcementFilter === "All" || String(item.status || "").toLowerCase() === announcementFilter.toLowerCase().replace(/s$/, ""));
        visible = [...visible].sort((a, b) => {
          const aDate = new Date(a.publishedAt || a.updatedAt || a.createdAt || 0).getTime();
          const bDate = new Date(b.publishedAt || b.updatedAt || b.createdAt || 0).getTime();
          return announcementSort === "latest" ? bDate - aDate : aDate - bDate;
        });
        if (!visible.length) return <p>{announcements.length ? "No announcements match this filter." : "No announcements found."}</p>;
        return visible.map((item) => {
          const status = String(item.status || "Draft");
          const type = String(item.type || "General");
          const date = item.publishedAt || item.updatedAt || item.createdAt;
          return <div className="announcement-row" key={item._id || `${item.title}-${date || "item"}`}>
            <div className={`announcement-type ${type.toLowerCase()}`}>{type.charAt(0).toUpperCase()}</div>
            <div className="announcement-main">
              <div className="announcement-title-line"><h3>{item.title || "Untitled announcement"}</h3><span className={`announcement-status ${status.toLowerCase()}`}>{status}</span></div>
              <p>{item.message || item.description || "No message provided."}</p>
              <div className="announcement-details"><span>Type: {type}</span><span>•</span><span>{date ? `${status === "Published" ? "Published" : "Updated"} ${new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}` : "Date unavailable"}</span></div>
           {status.toLowerCase() === "draft" && (
  <button
    type="button"
    className="secondary-button"
    onClick={async () => {
      const confirmed = window.confirm(
        `Publish "${item.title}"?`
      );

      if (!confirmed) return;

      try {
        const response = await fetch(
          `http://localhost:5000/api/super-admin/announcements/${item._id}/publish`,
          { method: "PATCH" }
        );

        const result = await response.json();

        if (!response.ok || result.success === false) {
          throw new Error(
            result.message || "Failed to publish announcement"
          );
        }

        const refreshed = await fetch(
          "http://localhost:5000/api/super-admin/announcements"
        );
        const refreshedResult = await refreshed.json();

        if (!refreshed.ok || !refreshedResult.success) {
          throw new Error("Published, but failed to refresh the list");
        }

        setAnnouncements(refreshedResult.data || []);
        window.alert("Announcement published successfully.");
      } catch (error) {
        console.error("Publish announcement error:", error);
        window.alert(error.message || "Could not publish announcement.");
      }
    }}
  >
    Publish
  </button>
)}
            </div>
          </div>;
        });
      })()}
    </div>
    <div className="announcement-footer"><span>Showing {announcements.filter((item) => announcementFilter === "All" || String(item.status || "").toLowerCase() === announcementFilter.toLowerCase().replace(/s$/, "")).length} of {announcements.length} announcements</span></div>
  </section>
)}
 {activePage === "settings" && (
  <section className="settings-page" id="settings">
    <div className="settings-page-header">
      <div>
        <span className="section-eyebrow">PLATFORM ADMINISTRATION</span>
        <h2>Settings</h2>
        <p>Manage Cliently-wide defaults, security preferences and platform operations.</p>
      </div>
      <span className="settings-admin-badge">● Super Admin</span>
    </div>

    <div className="settings-layout">
      <aside className="settings-menu">
        <div className="settings-menu-group">
          <h4>PLATFORM CONFIGURATION</h4>
          {["General", "Regional Defaults", "Security", "Notifications", "Data & Audit"].map((item) => (
            <button type="button" key={item}
              className={`settings-menu-item ${activeSetting === item ? "active" : ""}`}
              onClick={() => { setActiveSetting(item); setSettingsMessage(""); }}>
              <span>{item === "General" ? "▣" : item === "Regional Defaults" ? "◷" : item === "Security" ? "⌾" : item === "Notifications" ? "♢" : "⇅"}</span>
              {item}
            </button>
          ))}
        </div>
      </aside>

      <div className="settings-content">
        <div className="settings-content-header">
          <div>
            <span className="settings-content-eyebrow">CLIENTLY PLATFORM SETTINGS</span>
            <h3>{activeSetting}</h3>
            <p>
              {activeSetting === "General" && "Manage platform identity and support contact details."}
              {activeSetting === "Regional Defaults" && "Set default timezone, currency, date and language preferences."}
              {activeSetting === "Security" && "Configure platform security policy defaults."}
              {activeSetting === "Notifications" && "Choose which platform-wide alerts should be enabled."}
              {activeSetting === "Data & Audit" && "Configure data retention defaults and maintenance mode."}
            </p>
          </div>
          <button type="button" className="primary-button" onClick={saveSettings} disabled={settingsSaving || settingsLoading}>
            {settingsSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {settingsLoading && <p role="status">Loading saved settings from MongoDB. You can view the default settings while this request completes...</p>}
        {settingsError && (
          <div role="alert" style={{ color: "#c0392b", marginBottom: 12 }}>
            <p>{settingsError}</p>
            <button
              type="button"
              className="secondary-button"
              onClick={async () => {
                setSettingsLoading(true);
                setSettingsError("");
                try {
                  const saved = await getSettings();
                  setSettings(normalizeDashboardSettings(saved));
                } catch (error) {
                  setSettingsError(error.message || "Unable to load settings.");
                } finally {
                  setSettingsLoading(false);
                }
              }}
              disabled={settingsLoading || settingsSaving}
            >
              {settingsLoading ? "Retrying..." : "Retry loading settings"}
            </button>
          </div>
        )}
        {settingsMessage && <p role="status" style={{ color: "#218838", marginBottom: 12 }}>{settingsMessage}</p>}

        {activeSetting === "General" && (
          <div className="settings-card">
            <div className="settings-card-header"><div><h3>Platform Identity</h3><p>Global Cliently platform details, not individual tenant details.</p></div><span className="settings-card-status">Database</span></div>
            <div className="settings-form-grid">
              <div className="settings-field"><label htmlFor="platform-name">Platform Name</label><input id="platform-name" value={settings.general.platformName} maxLength={80} onChange={(e) => updateSettingsSection("general", "platformName", e.target.value)} disabled={settingsSaving} /></div>
              <div className="settings-field"><label htmlFor="support-email">Support Email</label><input id="support-email" type="email" value={settings.general.supportEmail} onChange={(e) => updateSettingsSection("general", "supportEmail", e.target.value)} disabled={settingsSaving} /></div>
              <div className="settings-field"><label htmlFor="support-url">Support URL</label><input id="support-url" type="url" placeholder="https://support.cliently.com" value={settings.general.supportUrl} onChange={(e) => updateSettingsSection("general", "supportUrl", e.target.value)} disabled={settingsSaving} /></div>
            </div>
          </div>
        )}

        {activeSetting === "Regional Defaults" && (
          <div className="settings-card">
            <div className="settings-card-header"><div><h3>Regional Defaults</h3><p>Defaults for newly created tenant workspaces where applicable.</p></div></div>
            <div className="settings-form-grid">
              <div className="settings-field"><label htmlFor="regional-timezone">Timezone</label><select id="regional-timezone" value={settings.regional.timezone} onChange={(e) => updateSettingsSection("regional", "timezone", e.target.value)} disabled={settingsSaving}><option value="Asia/Kolkata">Asia/Kolkata — India</option><option value="UTC">UTC</option><option value="America/New_York">America/New_York</option><option value="Europe/London">Europe/London</option><option value="Asia/Singapore">Asia/Singapore</option></select></div>
              <div className="settings-field"><label htmlFor="regional-currency">Currency</label><select id="regional-currency" value={settings.regional.currency} onChange={(e) => updateSettingsSection("regional", "currency", e.target.value)} disabled={settingsSaving}><option value="INR">INR — Indian Rupee</option><option value="USD">USD — US Dollar</option><option value="EUR">EUR — Euro</option><option value="GBP">GBP — Pound Sterling</option><option value="SGD">SGD — Singapore Dollar</option></select></div>
              <div className="settings-field"><label htmlFor="regional-date">Date Format</label><select id="regional-date" value={settings.regional.dateFormat} onChange={(e) => updateSettingsSection("regional", "dateFormat", e.target.value)} disabled={settingsSaving}><option value="DD/MM/YYYY">DD/MM/YYYY</option><option value="MM/DD/YYYY">MM/DD/YYYY</option><option value="YYYY-MM-DD">YYYY-MM-DD</option></select></div>
              <div className="settings-field"><label htmlFor="regional-time">Time Format</label><select id="regional-time" value={settings.regional.timeFormat} onChange={(e) => updateSettingsSection("regional", "timeFormat", e.target.value)} disabled={settingsSaving}><option value="12-hour">12-hour</option><option value="24-hour">24-hour</option></select></div>
              <div className="settings-field"><label htmlFor="regional-language">Language</label><select id="regional-language" value={settings.regional.language} onChange={(e) => updateSettingsSection("regional", "language", e.target.value)} disabled={settingsSaving}><option value="English">English</option></select></div>
            </div>
          </div>
        )}

        {activeSetting === "Security" && (
          <div className="settings-card">
            <div className="settings-card-header"><div><h3>Security Defaults</h3><p>These preferences must also be enforced by the authentication provider/backend.</p></div></div>
            <div className="settings-form-grid">
              <div className="settings-field"><label htmlFor="session-timeout">Session Timeout (minutes)</label><input id="session-timeout" type="number" min="5" max="1440" value={settings.security.sessionTimeoutMinutes} onChange={(e) => updateSettingsSection("security", "sessionTimeoutMinutes", Math.max(5, Number(e.target.value) || 5))} disabled={settingsSaving} /></div>
              <div className="settings-field"><label htmlFor="password-minimum">Minimum Password Length</label><input id="password-minimum" type="number" min="8" max="64" value={settings.security.passwordMinLength} onChange={(e) => updateSettingsSection("security", "passwordMinLength", Math.max(8, Number(e.target.value) || 8))} disabled={settingsSaving} /></div>
            </div>
            <div className="settings-option-row"><div><strong>Require Two-Factor Authentication</strong><p>Policy preference for platform accounts.</p></div><label className="settings-switch"><input type="checkbox" checked={settings.security.requireTwoFactor} onChange={(e) => updateSettingsSection("security", "requireTwoFactor", e.target.checked)} disabled={settingsSaving} /><span></span></label></div>
          </div>
        )}

        {activeSetting === "Notifications" && (
          <div className="settings-card">
            <div className="settings-card-header"><div><h3>Platform Notifications</h3><p>Enable or disable platform-wide notification categories.</p></div></div>
            {[
              ["adminEmail", "Administrator Email Notifications", "Email notifications for platform administrators."],
              ["systemAlerts", "System Alerts", "Service availability, errors and infrastructure alerts."],
              ["securityAlerts", "Security Alerts", "Authentication and suspicious activity alerts."],
              ["billingAlerts", "Subscription & Billing Alerts", "Payment, renewal and subscription alerts."],
            ].map(([field, label, description]) => (
              <div className="settings-option-row" key={field}><div><strong>{label}</strong><p>{description}</p></div><label className="settings-switch"><input type="checkbox" checked={settings.notifications[field]} onChange={(e) => updateSettingsSection("notifications", field, e.target.checked)} disabled={settingsSaving} /><span></span></label></div>
            ))}
          </div>
        )}

        {activeSetting === "Data & Audit" && (
          <div className="settings-card">
            <div className="settings-card-header"><div><h3>Data Retention & Operations</h3><p>Configure retention defaults and platform maintenance preference.</p></div></div>
            <div className="settings-form-grid">
              <div className="settings-field"><label htmlFor="audit-retention">Audit Log Retention (days)</label><input id="audit-retention" type="number" min="30" max="3650" value={settings.data.auditRetentionDays} onChange={(e) => updateSettingsSection("data", "auditRetentionDays", Math.max(30, Number(e.target.value) || 30))} disabled={settingsSaving} /></div>
              <div className="settings-field"><label htmlFor="data-retention">Default Data Retention (days)</label><input id="data-retention" type="number" min="30" max="3650" value={settings.data.dataRetentionDays} onChange={(e) => updateSettingsSection("data", "dataRetentionDays", Math.max(30, Number(e.target.value) || 30))} disabled={settingsSaving} /></div>
            </div>
            <div className="settings-option-row"><div><strong>Maintenance Mode</strong><p>Preference only; backend middleware must enforce it before tenant access changes.</p></div><label className="settings-switch"><input type="checkbox" checked={settings.data.maintenanceMode} onChange={(e) => updateSettingsSection("data", "maintenanceMode", e.target.checked)} disabled={settingsSaving} /><span></span></label></div>
          </div>
        )}
      </div>
    </div>
  </section>
)}
</main>
      {profileDialogOpen && (
        <ProfileDialog
          onClose={() => setProfileDialogOpen(false)}
          onOpenSettings={() => { setProfileDialogOpen(false); setActivePage("settings"); }}
        />
      )}
</div>
  );
}

