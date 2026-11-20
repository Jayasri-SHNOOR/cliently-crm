import { useState, useEffect } from "react";
import { Navigate, useLocation, useSearchParams } from "react-router-dom";
import { login, requestPasswordReset } from "../services/authService";
import { getLockSeconds, recordFailure, clearAttempts } from "../services/loginAttempts";
import { useCurrentUser } from "../../../lib/useSession";
import { homeFor } from "../../../lib/roles";
import "../styles/login.css";

const REASON_MESSAGES = {
    SIGNED_OUT: "You have been signed out.",
    SESSION_IDLE: "You were logged out after 30 minutes of inactivity. Please sign in again.",
    IDLE: "You were logged out after 30 minutes of inactivity. Please sign in again.",
    SESSION_EXPIRED: "Your session has expired. Please sign in again.",
    SESSION_REVOKED: "Your session has ended. Please sign in again.",
    NO_SESSION: "Please sign in to continue.",
    NO_TOKEN: "Please sign in to continue.",
    INVALID_TOKEN: "Please sign in to continue.",
    USER_INACTIVE: "Your account is inactive. Contact your administrator.",
    TENANT_INACTIVE: "Your company account is not active. Contact Cliently for support.",
};

function formatCountdown(totalSeconds){
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
}

function Login(){
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [cooldown, setCooldown] = useState(0);

    const currentUser = useCurrentUser();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [reason] = useState(() => searchParams.get("reason"));
    const reasonMessage = REASON_MESSAGES[reason] || "";

    useEffect(() => {
        if (searchParams.has("reason")) {
            const next = new URLSearchParams(searchParams);
            next.delete("reason");
            setSearchParams(next, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    const home = homeFor(currentUser);
    if (home) {
        return <Navigate to={location.state?.from || home} replace />;
    }

    const clearMessages = () => {
        setError("");
        setNotice("");
    };

    const handleWrongPassword = (message) => {
        const result = recordFailure(email);
        if (result.lockSeconds > 0) {
            setCooldown(result.lockSeconds);
            return;
        }
        const plural = result.attemptsLeft === 1 ? "" : "s";
        setError(`${message} ${result.attemptsLeft} attempt${plural} left.`);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (cooldown > 0) {
            return;
        }
        clearMessages();

        const lockedFor = getLockSeconds(email);
        if (lockedFor > 0) {
            setCooldown(lockedFor);
            return;
        }

        setLoading(true);

        try{
            await login(email, password);
            clearAttempts(email);
            setPassword("");
        } catch (err) {
            if (err.status === 429 && err.retryAfter > 0) {
                setCooldown(err.retryAfter);
            } else if (err.cause?.code === "auth/invalid-credential") {
                handleWrongPassword(err.message);
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        clearMessages();
        setLoading(true);

        try {
            await requestPasswordReset(email);
            setNotice(`If an account exists for ${email.trim()}, a password reset link has been sent. Check your inbox and spam folder.`);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return(
        <main className="login-page">
            <section className="login-section">
            <div className="login-bg-shape login-bg-shape-one" aria-hidden="true"></div>
                <div className="login-bg-shape login-bg-shape-two" aria-hidden="true"></div>
                <div className="login-card">
                <div className="login-card-corner" aria-hidden="true"></div>
                <div className="login-content">
                    <div className="brand">
                        <div className="brand-logo">
                            CRM
                        </div>
                        <div>
                            <span className="brand-name">
                                CLIENTLY
                            </span>
                            <span className="brand-subtitle">
                                Organization Portal
                            </span>
                        </div>
                    </div>
                    <div className="login-heading">
                        <h1>
                            Welcome!
                        </h1>
                        <h2>Your Business, Connected.</h2>
                        <p>
                            Sign in to access your workspace.
                        </p>
                    </div>

                    {reasonMessage && !error && !currentUser && (
                        <div
                        className={`login-alert ${reason === "SIGNED_OUT" ? "login-success" : "login-error"}`}
                            role="status"
                        >
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
                    {currentUser && (
                        <div className="login-alert login-success" role="status">
                            Signed in as <strong>{currentUser.name}</strong> ({currentUser.role})
                            {currentUser.company && <> · {currentUser.company.name}</>}
                        </div>
                    )}

                    <form
                        className="login-form"
                        onSubmit={handleSubmit}
                    >
                        <div className="form-group">
                            <label htmlFor="email">
                                Work Email
                            </label>
                            <div className="input-wrapper">
                                <span className="input-icon">
                                    @
                                </span>
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="Enter your work email"
                                    value={email}
                                    onChange={(event) =>
                                        setEmail(event.target.value)
                                    }
                                    disabled={loading}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <div className="password-header">
                                <label htmlFor="password">
                                    Password
                                </label>
                                <button
                                    type="button"
                                    className="forgot-button"
                                    onClick={handleForgotPassword}
                                    disabled={loading}
                                >
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
                                    onChange={(event) =>
                                        setPassword(event.target.value)
                                    }
                                    disabled={loading}
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? "Hide" : "Show"}
                                
                                </button>
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="sign-in-button"
                            disabled={loading || cooldown > 0}
                        >
                            <span>
                                {loading ? "Signing in..."
                                : cooldown > 0 ? `Try Again in ${formatCountdown(cooldown)}`:"Sign In"}
                            </span>
                            {!loading && cooldown===0 && (
                                <span className="button-arrow">
                                    →
                                </span>
                            )}
                        </button>
                    </form>
                </div>
                <div className="login-footer">
                    © 2026 Cliently. All rights reserved.
                </div>
                </div>
            </section>
            <section className="crm-showcase">
                <div className="showcase-content">
                    <div className="showcase-label">
                        SMART CRM FOR MODERN ORGANIZATIONS
                    </div>
                    <h2>
                        Manage relationships.
                        <br />
                        <span>
                            Grow your business.
                        </span>
                    </h2>
                    <p className="showcase-description">
                        Bring your teams, customers, sales activities,
                        and business operations together in one
                        organized workspace.
                    </p>
                    <div className="crm-features">
                        <div className="feature-card">
                            <div className="feature-number">
                                01
                            </div>
                            <div className="feature-text">
                                <h3>
                                    Customer Management
                                </h3>
                                <p>
                                    Keep customer information,
                                    interactions, and activities
                                    organized in one place.
                                </p>
                            </div>
                        </div>
                        <div className="feature-card">
                            <div className="feature-number">
                                02
                            </div>
                            <div className="feature-text">
                                <h3>
                                    Sales & Lead Tracking
                                </h3>
                                <p>
                                    Track leads, opportunities,
                                    follow-ups, and sales progress
                                    with greater visibility.
                                </p>
                            </div>
                        </div>
                        <div className="feature-card">
                            <div className="feature-number">
                                03
                            </div>
                            <div className="feature-text">
                                <h3>
                                    Organization Insights
                                </h3>
                                <p>
                                    Turn operational data into
                                    meaningful insights for better
                                    business decisions.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="showcase-bottom">
                        <div>
                            <strong>
                                One workspace. Complete visibility.
                            </strong>
                            <span>
                                Built to simplify everyday CRM operations.
                            </span>
                        </div>
                    </div>
                </div>
                <div className="showcase-arc showcase-arc-top" aria-hidden="true"></div>
                <div className="showcase-arc showcase-arc-bottom" aria-hidden="true"></div>
                <div className="showcase-spark showcase-spark-top" aria-hidden="true"></div>
                <div className="showcase-spark showcase-spark-bottom" aria-hidden="true"></div>
                <div className="decorative-grid" aria-hidden="true"></div>
            </section>
        </main>
    );
}

export default Login;
