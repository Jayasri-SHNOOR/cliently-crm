import { signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import { apiFetch } from "../../../lib/api";
import { setSession } from "../../../lib/session";



const FIREBASE_ERRORS = {
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/missing-email": "Please enter your work email.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
    "auth/network-request-failed": "Network error. Check your internet connection.",
};

export async function login(email, password,) {
    let credential;
    try {
        credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
        throw new Error(FIREBASE_ERRORS[err.code] || "Sign in failed. Please try again.", { cause: err });
    }

    try {
        const firebaseToken = await credential.user.getIdToken();
        const data = await apiFetch("/api/auth/login", {
            method: "POST",
            auth: false,
            token: firebaseToken,
            // body: { selectedRole: ROLE_MAP[selectedRoleId] },
        });
        setSession(data);
        return data.user;
    } finally {
        await signOut(auth).catch(() => null);
    }
}

export async function requestPasswordReset(email) {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
        throw new Error("Enter your work email above, then click Forgot password.");
    }

    try {
        await sendPasswordResetEmail(auth, cleanEmail, {
            url: `${window.location.origin}/`,
        });
    } catch (err) {
        throw new Error(FIREBASE_ERRORS[err.code] || "Could not send the reset email. Please try again.", { cause: err });
    }
}
