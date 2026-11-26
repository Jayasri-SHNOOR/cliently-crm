import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import PortalLayout from "./PortalLayout";
import { activateAccount, checkActivation, checkPasswordRules, getSite } from "./portalApi";

function ActivateAccount() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [token] = useState(() => searchParams.get("token") || "");
    const [company, setCompany] = useState(null);
    const [check, setCheck] = useState({ status: "checking", info: null, message: "" });
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (searchParams.has("token")) {
            setSearchParams({}, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    useEffect(() => {
        let active = true;
        getSite(slug)
            .then((data) => {
                if (active) setCompany(data?.company || null);
            })
            .catch(() => {});

        const request = token
            ? checkActivation(slug, token)
            : Promise.reject(new Error("This link is invalid or has expired. Please ask us for a new one."));

        request
            .then((info) => {
                if (active) setCheck({ status: "ready", info, message: "" });
            })
            .catch((err) => {
                if (active) setCheck({ status: "invalid", info: null, message: err.message });
            });

        return () => {
            active = false;
        };
    }, [slug, token]);

    const info = check.info;
    const isReset = info?.mode === "reset";

    const copyLoginId = async () => {
        try {
            await navigator.clipboard.writeText(info.loginId);
            setCopied(true);
        } catch {
            setCopied(false);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        const rule = checkPasswordRules(password);
        if (rule) {
            setError(rule);
            return;
        }
        if (password !== confirm) {
            setError("The two passwords do not match");
            return;
        }
        setSaving(true);
        try {
            await activateAccount(slug, token, password);
            setPassword("");
            setConfirm("");
            setDone(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (check.status === "checking") {
        return (
            <PortalLayout slug={slug} company={company}>
                <div className="login-heading">
                    <h1>Checking your link...</h1>
                    <p>This will only take a moment.</p>
                </div>
            </PortalLayout>
        );
    }

    if (check.status === "invalid") {
        return (
            <PortalLayout slug={slug} company={company}>
                <div className="login-heading">
                    <h1>Link not valid</h1>
                    <p>{check.message}</p>
                </div>
                <button type="button" className="sign-in-button" onClick={() => navigate(`/site/${slug}/login`)}>
                    <span>Go to sign in</span>
                </button>
            </PortalLayout>
        );
    }

    if (done) {
        return (
            <PortalLayout slug={slug} company={company}>
                <div className="login-heading">
                    <h1>{isReset ? "Password changed" : "Account activated"}</h1>
                    <p>You can now sign in with your login ID and new password.</p>
                </div>
                <div className="cp-login-id" aria-label="Your login ID">
                    <span>Your login ID</span>
                    <strong>{info.loginId}</strong>
                </div>
                <button
                    type="button"
                    className="sign-in-button"
                    onClick={() => navigate(`/site/${slug}/login`, { state: { loginId: info.loginId } })}
                >
                    <span>Go to sign in</span>
                    <span className="button-arrow" aria-hidden="true">→</span>
                </button>
            </PortalLayout>
        );
    }

    return (
        <PortalLayout slug={slug} company={company}>
            <div className="login-heading">
                <h1>{isReset ? "Set a new password" : `Hello, ${info.name}`}</h1>
                <p>
                    {isReset
                        ? "Choose a new password for your account."
                        : "Set a password to activate your customer account."}
                </p>
            </div>

            <div className="cp-login-id">
                <span>Your login ID. Save it, you'll need it to sign in.</span>
                <strong>{info.loginId}</strong>
                <button type="button" className="forgot-button" onClick={copyLoginId}>
                    {copied ? "Copied" : "Copy"}
                </button>
            </div>

            {error && (
                <div className="login-alert login-error" role="alert">
                    {error}
                </div>
            )}

            <form className="login-form" onSubmit={handleSubmit}>
                <input type="text" autoComplete="username" value={info.loginId} readOnly hidden />
                <div className="form-group">
                    <label htmlFor="password">New password</label>
                    <div className="input-wrapper">
                        <span className="input-icon" aria-hidden="true">
                            <span className="input-icon-circle">P</span>
                        </span>
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="At least 8 characters"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            disabled={saving}
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

                <div className="form-group">
                    <label htmlFor="confirm">Confirm password</label>
                    <div className="input-wrapper">
                        <span className="input-icon" aria-hidden="true">
                            <span className="input-icon-circle">P</span>
                        </span>
                        <input
                            id="confirm"
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="Type the password again"
                            value={confirm}
                            onChange={(event) => setConfirm(event.target.value)}
                            disabled={saving}
                            required
                        />
                    </div>
                </div>

                <button type="submit" className="sign-in-button" disabled={saving}>
                    <span>{saving ? "Saving..." : isReset ? "Change password" : "Activate account"}</span>
                    {!saving && <span className="button-arrow" aria-hidden="true">→</span>}
                </button>
            </form>
        </PortalLayout>
    );
}

export default ActivateAccount;