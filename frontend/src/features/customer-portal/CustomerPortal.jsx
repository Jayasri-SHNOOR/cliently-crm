import { useCallback, useEffect, useState } from "react";
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { LayoutDashboard, LogOut, Menu, Package, UserRound, Wrench } from "lucide-react";
import { getProfile, initials, logoutCustomer, restoreSession } from "./portalApi";
import PortalDashboard from "./PortalDashboard";
import PortalProducts from "./PortalProducts";
import PortalRequests from "./PortalRequests";
import PortalRequestDetail from "./PortalRequestDetail";
import PortalProfile from "./PortalProfile";
import "./CustomerPortal.css";

function crumbFor(pathname, base) {
    const rest = pathname.slice(base.length).replace(/^\/|\/$/g, "");
    if (!rest) return ["Dashboard", "Overview"];
    if (rest === "products") return ["My products", "All products"];
    if (rest === "requests") return ["Service requests", "All requests"];
    if (rest.startsWith("requests/")) return ["Service requests", "Details"];
    if (rest === "profile") return ["My profile", "Account"];
    return ["Dashboard", "Overview"];
}

function CustomerPortal() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [session, setSession] = useState(() => ({ status: getProfile() ? "ready" : "checking", profile: getProfile() }));
    const [signingOut, setSigningOut] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        let active = true;
        restoreSession()
            .then((profile) => {
                if (active) setSession(profile ? { status: "ready", profile } : { status: "out", profile: null });
            })
            .catch(() => {
                if (active) setSession({ status: "out", profile: null });
            });
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        setMenuOpen(false);
    }, [location.pathname]);

    const onSessionEnd = useCallback(
        () => navigate(`/site/${slug}/login?reason=SESSION_EXPIRED`, { replace: true }),
        [navigate, slug]
    );
    const setProfile = useCallback((next) => setSession({ status: "ready", profile: next }), []);

    if (session.status === "checking") {
        return <div className="cp-loading">Loading your account...</div>;
    }

    if (session.status === "out" || session.profile?.company?.slug !== slug) {
        return <Navigate to={`/site/${slug}/login?reason=NO_SESSION`} replace />;
    }

    const profile = session.profile;
    const base = `/site/${slug}/portal`;
    const ctx = { slug, base, profile, setProfile, onSessionEnd };
    const [crumbMain, crumbSub] = crumbFor(location.pathname, base);
    const companyName = profile.company?.name || "Customer Portal";

    const signOut = async () => {
        setSigningOut(true);
        try {
            await logoutCustomer();
        } finally {
            navigate(`/site/${slug}/login?reason=SIGNED_OUT`, { replace: true });
        }
    };

    const link = ({ isActive }) => `cp-side-link ${isActive ? "active" : ""}`;

    return (
        <div className="cp-app">
            <aside className={`cp-sidebar ${menuOpen ? "open" : ""}`}>
                <div className="cp-side-brand">
                    <div className="cp-brand-mark">{initials(companyName)}</div>
                    <div>
                        <strong>{companyName}</strong>
                        <span>Customer Portal</span>
                    </div>
                </div>

                <p className="cp-side-label">Main menu</p>
                <nav className="cp-side-nav" aria-label="Customer portal">
                    <NavLink to={base} end className={link}><LayoutDashboard size={20} /> Dashboard</NavLink>
                    <NavLink to={`${base}/products`} className={link}><Package size={20} /> My products</NavLink>
                    <NavLink to={`${base}/requests`} className={link}><Wrench size={20} /> Service requests</NavLink>
                    <NavLink to={`${base}/profile`} className={link}><UserRound size={20} /> My profile</NavLink>
                </nav>

                <button type="button" className="cp-side-logout" onClick={signOut} disabled={signingOut}>
                    <LogOut size={20} /> {signingOut ? "Signing out..." : "Logout"}
                </button>
            </aside>
            {menuOpen && <div className="cp-scrim" onClick={() => setMenuOpen(false)} aria-hidden="true" />}

            <div className="cp-body">
                <header className="cp-topbar">
                    <div className="cp-topbar-left">
                        <button type="button" className="cp-menu-btn" onClick={() => setMenuOpen(true)} aria-label="Open menu">
                            <Menu size={20} />
                        </button>
                        <div className="cp-crumb">
                            <strong>{crumbMain}</strong>
                            <span>/{crumbSub}</span>
                        </div>
                    </div>
                    <div className="cp-user">
                        <div className="cp-avatar">{initials(profile.name)}</div>
                        <div className="cp-user-text">
                            <strong>{profile.name}</strong>
                            <span>{profile.loginId}</span>
                        </div>
                    </div>
                </header>

                <main className="cp-main">
                    <Routes>
                        <Route index element={<PortalDashboard ctx={ctx} />} />
                        <Route path="products" element={<PortalProducts ctx={ctx} />} />
                        <Route path="requests" element={<PortalRequests ctx={ctx} />} />
                        <Route path="requests/:id" element={<PortalRequestDetail ctx={ctx} />} />
                        <Route path="profile" element={<PortalProfile ctx={ctx} />} />
                        <Route path="*" element={<Navigate to={base} replace />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
}

export default CustomerPortal;