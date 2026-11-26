const MAX_ATTEMPTS = 5;
const LOCK_SECONDS = 60;
const STORAGE_KEY = "cliently_login_attempts";

function keyFor(email) {
    return email.trim().toLowerCase();
}

function readAll() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
        return {};
    }
}

function writeAll(all) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch {
        return undefined;
    }
    return undefined;
}

export function getLockSeconds(email) {
    const entry = readAll()[keyFor(email)];
    if (!entry || !entry.lockedUntil) {
        return 0;
    }
    return Math.max(0, Math.ceil((entry.lockedUntil - Date.now()) / 1000));
}

export function recordFailure(email) {
    const all = readAll();
    const key = keyFor(email);
    const entry = all[key] || { count: 0, lockedUntil: 0 };

    entry.count += 1;
    if (entry.count >= MAX_ATTEMPTS) {
        all[key] = { count: 0, lockedUntil: Date.now() + LOCK_SECONDS * 1000 };
        writeAll(all);
        return { lockSeconds: LOCK_SECONDS, attemptsLeft: 0 };
    }

    all[key] = entry;
    writeAll(all);
    return { lockSeconds: 0, attemptsLeft: MAX_ATTEMPTS - entry.count };
}

export function clearAttempts(email) {
    const all = readAll();
    delete all[keyFor(email)];
    writeAll(all);
}