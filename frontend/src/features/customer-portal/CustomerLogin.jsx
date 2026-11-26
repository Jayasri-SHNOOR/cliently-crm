import { useEffect, useState } from "react";
import { useLocation, useParams, useSearchParams } from "react-router-dom";
import PortalLayout from "./PortalLayout";
import { formatLoginId, getSite, loginCustomer, logoutCustomer, restoreSession } from "./portalApi";

const REASON_MESSAGES = {
    SIGNED_OUT: "You have been signed out.",
    SESSION_IDLE: "You were logged out after a period of inactivity. Please sign in again.",
    SESSION_EXPIRED: "Your session has expired. Please sign in again.",
    SESSION_REVOKED: "Your session has ended. Please sign in again.",
    NO_SESSION: "Please sign in to continue.",
    ACCOUNT_INACTIVE: "Your account is not active. Please contact us.",
};

function formatCountdown(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
}

function CustomerLogin() {
    const { slug } = useParams();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [reason, setReason] = useState(() => searchParams.get("reason"));
    const [site, setSite] = useState({ slug: null, company: null, missing: false });
    const [signedIn, setSignedIn] = useState(null);
    const [loginId, setLoginId] = useState(() => location.state?.loginId || "");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (searchParams.has("reason")) {
            const next = new URLSearchParams(searchParams);
            next.delete("reason");
            setSearchParams(next, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    useEffect(() => {
        let active = true;
        getSite(slug)
            .then((data) => {
                if (active) setSite({ slug, company: data?.company || null, missing: false });
            })
            .catch((err) => {
                if (active) setSite({ slug, company: null, missing: err?.status === 404 });
            });
        restoreSession()
            .then((profile) => {
                if (active && profile?.company?.slug === slug) setSignedIn(profile);
            })
            .catch(() => {});
        return () => {
            active = false;
        };
    }, [slug]);

    useEffect(() => {
        if (cooldown <= 0) return undefined;
        const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    const company = site.slug === slug ? site.company : null;

    if (site.slug === slug && site.missing) {
        return (
            <PortalLayout slug={slug} company={null}>
                <div className="login-heading">
                    <h1>Portal not found</h1>
                    <p>This company page doesn't exist or is not available right now.</p>
                </div>
            </PortalLayout>
        );
    }

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (cooldown > 0) return;
        setError("");
        setNotice("");
        setReason(null);
        setLoading(true);
        try {
            const profile = await loginCustomer(slug, loginId, password);
            setPassword("");
            setSignedIn(profile);
        } catch (err) {
            if (err.status === 429 && err.retryAfter > 0) {
                setCooldown(err.retryAfter);
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        setLoading(true);
        try {
            await logoutCustomer();
        } finally {
            setSignedIn(null);
            setReason("SIGNED_OUT");
            setLoading(false);
        }
    };

    const handleForgot = () => {
        setError("");
        const contact = company?.phone || company?.email;
        setNotice(
            `Please contact ${company?.companyName || "us"}${contact ? ` at ${contact}` : ""} and ask your sales executive for a new password link.`
        );
    };

    if (signedIn) {
        return (
            <PortalLayout slug={slug} company={company}>
                <div className="login-heading">
                    <h1>Signed in</h1>
                    <p>
                        Welcome, {signedIn.name}. Your login ID is <strong>{signedIn.loginId}</strong>.
                    </p>
                </div>
                <button type="button" className="sign-in-button" onClick={handleSignOut} disabled={loading}>
                    <span>{loading ? "Signing out..." : "Sign out"}</span>
                </button>
            </PortalLayout>
        );
    }

    const reasonMessage = REASON_MESSAGES[reason] || "";

    return (
        <PortalLayout slug={slug} company={company}>
            <div className="login-heading">
                <h1>Welcome back</h1>
                <p>Sign in with the login ID we shared with you.</p>
            </div>

            {reasonMessage && !error && (
                <div className={`login-alert ${reason === "SIGNED_OUT" ? "login-success" : "login-error"}`} role="status">
                    {reasonMessage}
                </div>
            )}
            {error && (
                <div className="login-alert login-error" role="alert">
                    {error}
                </div>
            )}
            {cooldown > 0 && (
                <div className="login-alert login-error" role="alert">
                    Too many attempts. You can try again in{" "}
                    <strong className="countdown">{formatCountdown(cooldown)}</strong>
                </div>
            )}
            {notice && (
                <div className="login-alert login-success" role="status">
                    {notice}
                </div>
            )}

            <form className="login-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="loginId">Login ID</label>
                    <div className="input-wrapper">
                        <span className="input-icon" aria-hidden="true">#</span>
                        <input
                            id="loginId"
                            type="text"
                            autoComplete="username"
                            placeholder="e.g. K7QM-3P9X"
                            value={loginId}
                            onChange={(event) => setLoginId(formatLoginId(event.target.value))}
                            disabled={loading}
                            spellCheck={false}
                            required
                        />
                    </div>
                </div>

                <div className="form-group">
                    <div className="password-header">
                        <label htmlFor="password">Password</label>
                        <button type="button" className="forgot-button" onClick={handleForgot} disabled={loading}>
                            Forgot password?
                        </button>
                    </div>
                    <div className="input-wrapper">
                        <span className="input-icon" aria-hidden="true">
                            <span className="input-icon-circle">P</span>
                        </span>
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            disabled={loading}
                            required
                        />
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? "Hide" : "Show"}
                        </button>
                    </div>
                </div>

                <button type="submit" className="sign-in-button" disabled={loading || cooldown > 0 || loginId.length !== 9}>
                    <span>
                        {loading ? "Signing in..." : cooldown > 0 ? `Try again in ${formatCountdown(cooldown)}` : "Sign In"}
                    </span>
                    {!loading && cooldown === 0 && (
                        <span className="button-arrow" aria-hidden="true">→</span>
                    )}
                </button>
            </form>
        </PortalLayout>
    );
}

export default CustomerLogin;