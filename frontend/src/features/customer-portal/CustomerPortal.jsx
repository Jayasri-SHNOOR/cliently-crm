import { useCallback, useEffect, useState } from "react";
import { NavLink, Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { LogOut, Package, UserRound, Wrench } from "lucide-react";
import { getProfile, initials, logoutCustomer, restoreSession } from "./portalApi";
import PortalProducts from "./PortalProducts";
import PortalRequests from "./PortalRequests";
import PortalRequestDetail from "./PortalRequestDetail";
import PortalProfile from "./PortalProfile";
import "./CustomerPortal.css";

function CustomerPortal() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [session, setSession] = useState(() => ({ status: getProfile() ? "ready" : "checking", profile: getProfile() }));
    const [signingOut, setSigningOut] = useState(false);

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

    const ctx = {
        slug,
        base,
        profile,
        setProfile,
        onSessionEnd,
    };

    const signOut = async () => {
        setSigningOut(true);
        try {
            await logoutCustomer();
        } finally {
            navigate(`/site/${slug}/login?reason=SIGNED_OUT`, { replace: true });
        }
    };

    return (
        <div className="cp-app">
            <header className="cp-topbar">
                <div className="cp-brand">
                    <div className="cp-brand-mark">{initials(profile.company?.name)}</div>
                    <div>
                        <strong>{profile.company?.name || "Customer Portal"}</strong>
                        <span>Customer Portal</span>
                    </div>
                </div>
                <div className="cp-user">
                    <div className="cp-user-text">
                        <strong>{profile.name}</strong>
                        <span>{profile.loginId}</span>
                    </div>
                    <button type="button" className="cp-btn" onClick={signOut} disabled={signingOut}>
                        <LogOut size={16} /> {signingOut ? "Signing out..." : "Sign out"}
                    </button>
                </div>
            </header>

            <nav className="cp-nav" aria-label="Customer portal">
                <NavLink to={base} end className={({ isActive }) => (isActive ? "active" : "")}>
                    <Package size={17} /> My products
                </NavLink>
                <NavLink to={`${base}/requests`} className={({ isActive }) => (isActive ? "active" : "")}>
                    <Wrench size={17} /> Service requests
                </NavLink>
                <NavLink to={`${base}/profile`} className={({ isActive }) => (isActive ? "active" : "")}>
                    <UserRound size={17} /> My profile
                </NavLink>
            </nav>

            <main className="cp-main">
                <Routes>
                    <Route index element={<PortalProducts ctx={ctx} />} />
                    <Route path="requests" element={<PortalRequests ctx={ctx} />} />
                    <Route path="requests/:id" element={<PortalRequestDetail ctx={ctx} />} />
                    <Route path="profile" element={<PortalProfile ctx={ctx} />} />
                    <Route path="*" element={<Navigate to={base} replace />} />
                </Routes>
            </main>
        </div>
    );
}

export default CustomerPortal;
