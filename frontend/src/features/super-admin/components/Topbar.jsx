import "./Topbar.css";
export default function Topbar({
  activePage,
  pageHeaders,
  profileMenuOpen,
  setProfileMenuOpen,
  setProfileDialogOpen,
  handleAdminLogout,
}) {
  return (
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
  );
}
