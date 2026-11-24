import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { initials, logoutCustomer, restoreSession } from "./portalApi";
import "../public-site/PublicSite.css";
import "./CustomerPortal.css";

function CustomerPortal() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [state, setState] = useState({ slug: null, profile: null });
    const [signingOut, setSigningOut] = useState(false);

    useEffect(() => {
        let active = true;
        restoreSession()
            .then((profile) => {
                if (!active) return;
                if (!profile || profile.company?.slug !== slug) {
                    navigate(`/site/${slug}/login?reason=NO_SESSION`, { replace: true });
                    return;
                }
                setState({ slug, profile });
            })
            .catch(() => {
                if (active) navigate(`/site/${slug}/login?reason=NO_SESSION`, { replace: true });
            });
        return () => {
            active = false;
        };
    }, [slug, navigate]);

    const profile = state.slug === slug ? state.profile : null;

    useEffect(() => {
        if (profile?.company?.name) document.title = `My account · ${profile.company.name}`;
    }, [profile]);

    const handleLogout = async () => {
        setSigningOut(true);
        try {
            await logoutCustomer();
        } finally {
            navigate(`/site/${slug}/login?reason=SIGNED_OUT`, { replace: true });
        }
    };

    if (!profile) {
        return (
            <div className="public-site ps-center">
                <div className="ps-spinner" aria-label="Loading" />
            </div>
        );
    }

    const lastLogin = profile.lastLoginAt
        ? new Date(profile.lastLoginAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
        : null;

    return (
        <div className="public-site cp-portal">
            <header className="ps-header">
                <div className="ps-container ps-header-inner">
                    <Link to={`/site/${slug}`} className="ps-brand">
                        <span className="ps-logo ps-logo-text">{initials(profile.company.name)}</span>
                        <span>{profile.company.name}</span>
                    </Link>
                    <span className="cp-header-user">{profile.name}</span>
                    <button
                        type="button"
                        className="ps-button ps-button-small ps-button-ghost"
                        onClick={handleLogout}
                        disabled={signingOut}
                    >
                        {signingOut ? "Signing out..." : "Sign out"}
                    </button>
                </div>
            </header>

            <main className="ps-container cp-main">
                <section className="cp-welcome">
                    <div>
                        <h1>Hello, {profile.name}</h1>
                        <p>Welcome to your {profile.company.name} customer account.</p>
                    </div>
                    {lastLogin && <small>Signed in {lastLogin}</small>}
                </section>

                <section className="cp-grid">
                    <article className="cp-card">
                        <h2>My details</h2>
                        <dl className="cp-details">
                            <dt>Customer ID</dt>
                            <dd>{profile.customerCode || "-"}</dd>
                            <dt>Login ID</dt>
                            <dd>{profile.loginId}</dd>
                            <dt>Email</dt>
                            <dd>{profile.email || "-"}</dd>
                            <dt>Phone</dt>
                            <dd>{profile.phone || "-"}</dd>
                            <dt>Address</dt>
                            <dd>{[profile.address, profile.city].filter(Boolean).join(", ") || "-"}</dd>
                        </dl>
                    </article>

                    <article className="cp-card">
                        <h2>My orders</h2>
                        <p className="cp-muted">Your orders and payments will appear here soon.</p>
                    </article>

                    <article className="cp-card">
                        <h2>Service requests</h2>
                        <p className="cp-muted">You'll be able to book installation and repair visits here soon.</p>
                    </article>
                </section>
            </main>
        </div>
    );
}

export default CustomerPortal;