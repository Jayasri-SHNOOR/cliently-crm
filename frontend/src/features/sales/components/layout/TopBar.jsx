import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronDown, LogOut } from "lucide-react";

function TopBar() {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const handleLogout = () => {
    setProfileOpen(false);

    // Clear common session data.
    // Adjust these keys if your authentication uses different names.
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    sessionStorage.clear();

    navigate("/login?reason=SIGNED_OUT", { replace: true });
  };

  return (
    <header className="topbar">
      <div className="topbar-search">
        <Search size={19} />
        <input
          type="text"
          placeholder="Search customers, tasks, products..."
        />
      </div>

      <div className="topbar-right">
        <div className="topbar-profile-wrapper" ref={profileRef}>
          <button
            type="button"
            className="topbar-profile"
            onClick={() => setProfileOpen((open) => !open)}
            aria-expanded={profileOpen}
            aria-haspopup="true"
          >
            <div className="topbar-avatar">PS</div>

            <div className="topbar-profile-info">
              <strong>Priyanga</strong>
              <span>Sales Executive</span>
            </div>

            <ChevronDown size={16} />
          </button>

          {profileOpen && (
            <div className="profile-dropdown">
              <button
                type="button"
                className="profile-dropdown-item"
                onClick={handleLogout}
              >
                <LogOut size={17} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default TopBar;
