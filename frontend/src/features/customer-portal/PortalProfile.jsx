import { useState } from "react";
import { changePassword, checkPasswordRules, updateProfile } from "./portalApi";

function PortalProfile({ ctx }) {
    const { profile, setProfile, onSessionEnd } = ctx;
    const [form, setForm] = useState({ phone: profile.phone || "", address: profile.address || "", city: profile.city || "" });
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState(null);

    const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
    const [changing, setChanging] = useState(false);
    const [passwordNotice, setPasswordNotice] = useState(null);

    const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    const changePw = (event) => setPasswords((current) => ({ ...current, [event.target.name]: event.target.value }));

    const save = async (event) => {
        event.preventDefault();
        setSaving(true);
        setNotice(null);
        try {
            const data = await updateProfile({ phone: form.phone.trim(), address: form.address.trim(), city: form.city.trim() });
            if (data?.customer) setProfile(data.customer);
            setNotice({ type: "success", text: data?.message || "Profile updated" });
        } catch (err) {
            if (err.status === 401) return onSessionEnd();
            setNotice({ type: "error", text: err.message });
        } finally {
            setSaving(false);
        }
    };

    const savePassword = async (event) => {
        event.preventDefault();
        setPasswordNotice(null);
        const rule = checkPasswordRules(passwords.next);
        if (rule) return setPasswordNotice({ type: "error", text: rule });
        if (passwords.next !== passwords.confirm) return setPasswordNotice({ type: "error", text: "The two new passwords do not match" });

        setChanging(true);
        try {
            const data = await changePassword(passwords.current, passwords.next);
            setPasswords({ current: "", next: "", confirm: "" });
            setPasswordNotice({ type: "success", text: data?.message || "Password changed" });
        } catch (err) {
            if (err.status === 401) return onSessionEnd();
            setPasswordNotice({ type: "error", text: err.message });
        } finally {
            setChanging(false);
        }
    };

    return (
        <section className="cp-profile">
            <div className="cp-page-head">
                <div>
                    <h1>My profile</h1>
                    <p>Keep your contact details up to date.</p>
                </div>
            </div>

            <div className="cp-profile-grid">
                <form className="cp-card cp-form cp-profile-card" onSubmit={save}>
                    <h2>Contact details</h2>
                    <dl className="cp-dl">
                        <div><dt>Name</dt><dd>{profile.name}</dd></div>
                        <div><dt>Email</dt><dd>{profile.email || "—"}</dd></div>
                        <div><dt>Login ID</dt><dd>{profile.loginId}</dd></div>
                        <div><dt>Customer code</dt><dd>{profile.customerCode || "—"}</dd></div>
                    </dl>
                    <div className="cp-field-row">
                        <label>
                            Phone
                            <input name="phone" value={form.phone} maxLength={20} onChange={change} disabled={saving} />
                        </label>
                        <label>
                            City
                            <input name="city" value={form.city} maxLength={80} onChange={change} disabled={saving} />
                        </label>
                    </div>
                    <label>
                        Address
                        <textarea name="address" rows={2} value={form.address} maxLength={300} onChange={change} disabled={saving} />
                    </label>
                    <div className="cp-profile-foot">
                        {notice ? <div className={`cp-alert cp-alert--${notice.type}`}>{notice.text}</div> : <p className="cp-hint">To change your name or email, contact your sales executive.</p>}
                        <button type="submit" className="cp-btn cp-btn--primary" disabled={saving}>{saving ? "Saving..." : "Save changes"}</button>
                    </div>
                </form>

                <form className="cp-card cp-form cp-profile-card" onSubmit={savePassword}>
                    <h2>Change password</h2>
                    <input type="text" autoComplete="username" value={profile.loginId} readOnly hidden />
                    <label>
                        Current password
                        <input type="password" name="current" autoComplete="current-password" value={passwords.current} onChange={changePw} disabled={changing} required />
                    </label>
                    <label>
                        New password
                        <input type="password" name="next" autoComplete="new-password" value={passwords.next} onChange={changePw} placeholder="8+ characters, a letter and a number" disabled={changing} required />
                    </label>
                    <label>
                        Confirm new password
                        <input type="password" name="confirm" autoComplete="new-password" value={passwords.confirm} onChange={changePw} disabled={changing} required />
                    </label>
                    <div className="cp-profile-foot">
                        {passwordNotice ? <div className={`cp-alert cp-alert--${passwordNotice.type}`}>{passwordNotice.text}</div> : <p className="cp-hint">You stay signed in here and are signed out on other devices.</p>}
                        <button type="submit" className="cp-btn cp-btn--primary" disabled={changing}>{changing ? "Changing..." : "Change password"}</button>
                    </div>
                </form>
            </div>
        </section>
    );
}

export default PortalProfile;