const STORAGE_KEY = "loginAttempts";
const MAX_FAILURES = 5;
const BASE_LOCK_SECONDS = 5;
const MAX_LOCK_SECONDS = 15 * 60;
const FORGET_AFTER_MS = 60 * 60 * 1000;
function normalize(email) {
    return email.trim().toLowerCase();
}

function readAll(){
    try{
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    }catch{
        return {};
    }
}

function writeAll(all){
    try{
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
        return true;
    }catch{
        return false;
    }
}

function isStale(entry, now){
    return now - entry.lastFailureAt > FORGET_AFTER_MS && entry.lockedUntil < now;
}

function freshEntry(){
    return {failures: 0, lockLevel: 0, lockedUntil: 0, lastFailureAt: 0};
}

function lockSecondsFor(lockLevel){
    return Math.min(BASE_LOCK_SECONDS * 2 ** lockLevel, MAX_LOCK_SECONDS);
}

export function getLockSeconds(email, now = Date.now()){
    const key = normalize(email);
    if(!key){
        return 0;
    }
    const entry = readAll()[key];
    if(!entry){
        return 0;
    }
    return Math.max(0, Math.ceil((entry.lockedUntil - now) / 1000));
}

export function recordFailure(email, now = Date.now()){
    const key = normalize(email);
    const all = readAll();

    for(const [savedKey, savedEntry] of Object.entries(all)){
        if (isStale(savedEntry, now)){
            delete all[savedKey];
        }
    }

    const entry = all[key] || freshEntry();
    const threshold = entry.lockLevel === 0 ? MAX_FAILURES : 1;

    entry.failures += 1;
    entry.lastFailureAt = now;

    let lockSeconds = 0;
    if(entry.failures >= threshold){
        lockSeconds = lockSecondsFor(entry.lockLevel);
        entry.lockedUntil = now + lockSeconds * 1000;
        entry.lockLevel += 1;
        entry.failures = 0;
    }
    all[key] = entry;
    writeAll(all);
    return{
        lockSeconds,
        attemptsLeft: MAX_FAILURES - entry.failures,
        nextLockSeconds: lockSecondsFor(entry.lockLevel),
    };
}

export function clearAttempts(email){
    const key = normalize(email);
    const all = readAll();
    if(all[key]){
        delete all[key];
        writeAll(all);
    }
}