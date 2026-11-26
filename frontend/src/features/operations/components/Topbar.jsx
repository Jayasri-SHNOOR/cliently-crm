
import "./Topbar.css";
import { useEffect, useRef, useState } from "react";
import {
  Search,
  UserRound,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useLocation } from "react-router-dom";

const pageTitles = {
  "/operations": "Dashboard",
  "/operations/tickets": "Support Tickets",
  "/operations/work-orders": "Work Orders",
  "/operations/knowledge-base": "Knowledge Base",
  "/operations/assets": "Inventory & Assets",
};

function Topbar({ user, onLogout, onProfile }) {
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const currentPath =
    location.pathname.replace(/\/+$/, "") ||
    "/operations";

  const pageTitle =
    pageTitles[currentPath] ||
    (currentPath.startsWith("/operations/tickets/")
      ? "Ticket Details"
      : currentPath.startsWith("/operations/work-orders/")
        ? "Work Order Details"
        : currentPath.startsWith("/operations/knowledge-base/")
          ? "Knowledge Base"
          : currentPath.startsWith("/operations/assets/")
            ? "Asset Details"
            : "Operations");

  const displayName = user?.name || "Staff";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleLogoutClick() {
    setProfileOpen(false);
    onLogout?.();
  }

  function handleProfileClick() {
    setProfileOpen(false);
    onProfile?.();
  }

  return (
    <header className="ops-topbar">
      <div className="ops-topbar-left">
        <div className="ops-breadcrumb">
          <span className="ops-breadcrumb-active">
            {pageTitle}
          </span>
          <span className="ops-breadcrumb-separator">
            /
          </span>
          <span>Operations</span>
        </div>

        <div className="ops-search-box">
          <Search
            size={18}
            className="ops-search-icon"
          />
          <input
            type="search"
            placeholder="Search operations..."
            aria-label="Operations search (coming soon)"
            disabled
          />
        </div>
      </div>

      <div
        className="ops-topbar-right ops-profile-container"
        ref={profileRef}
      >
        <button
          type="button"
          className="ops-profile-trigger"
          onClick={() => setProfileOpen((open) => !open)}
          aria-expanded={profileOpen}
          aria-haspopup="menu"
        >
          <div className="ops-profile-pic">
            {avatarLetter}
          </div>

          <div className="ops-profile-info">
            <span className="ops-profile-name">
              {displayName}
            </span>
            <span className="ops-profile-role">
              Operational Staff
            </span>
          </div>

          <ChevronDown
            size={16}
            className={
              profileOpen
                ? "ops-profile-chevron open"
                : "ops-profile-chevron"
            }
          />
        </button>

        {profileOpen && (
          <div
            className="ops-profile-dropdown"
            role="menu"
          >
            <div className="ops-profile-dropdown-header">
              <strong>{displayName}</strong>
              <span>
                {user?.email || "Operational Staff"}
              </span>
            </div>

            <button
              type="button"
              className="ops-profile-menu-item"
              role="menuitem"
              onClick={handleProfileClick}
              disabled={!onProfile}
            >
              <UserRound size={17} />
              <span>My Profile</span>
            </button>

            <div className="ops-profile-menu-divider" />

            <button
              type="button"
              className="ops-profile-menu-item ops-profile-logout"
              role="menuitem"
              onClick={handleLogoutClick}
              disabled={!onLogout}
            >
              <LogOut size={17} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Topbar;
