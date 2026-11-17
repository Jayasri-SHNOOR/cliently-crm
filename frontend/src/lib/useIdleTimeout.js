import {useEffect} from "react";
import {apiFetch} from "./api";
import {logout} from "./auth";

const IDLE_MINUTES = Number(import.meta.env.VITE_SESSION_IDLE_MINUTES) || 30;
const IDLE_MS = IDLE_MINUTES * 60 * 1000;
const HEARTBEAT_MS = Math.min(5 * 60 * 1000, IDLE_MS / 2);
const CHECK_MS = 15 * 1000;
const SHARED_KEY = "cliently_last_activity";
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "wheel", "scroll", "touchstart"];

function readSharedActivity(){
    try{
        return Number(localStorage.getItem(SHARED_KEY)) || 0;
    }catch{
        return 0;
    }
}

function writeSharedActivity(time){
    try{
        localStorage.setItem(SHARED_KEY, String(time));
    }catch{
        return undefined;
    }
    return undefined;
}

export function useIdleTimeout(enabled){
    useEffect(() =>{
        if(!enabled){
            return undefined;
        }

        let lastActivity = Date.now();
        let lastShared = 0;
        let lastHeartbeat = Date.now();
        let loggingOut = false;
        writeSharedActivity(lastActivity);

        const onActivity = () => {
            lastActivity = Date.now();
            if(lastActivity - lastShared > 5000){
                lastShared = lastActivity;
                writeSharedActivity(lastActivity);
            }
        };

        const check = async () => {
            if(loggingOut){
                return;
            }
            const now = Date.now();
            const latest = Math.max(lastActivity, readSharedActivity());

            if(now - latest >= IDLE_MS){
                loggingOut = true;
                await logout();
                window.location.replace("/login?reason=IDLE");
                return;
            }

            if(latest > lastHeartbeat && now - lastHeartbeat >= HEARTBEAT_MS){
                lastHeartbeat = now;
                apiFetch("/api/auth/me").catch(() => null);
            }
        };

        ACTIVITY_EVENTS.forEach((name) => window.addEventListener(name, onActivity, { passive: true }));
        document.addEventListener("visibilitychange", check);
        const timer = setInterval(check, CHECK_MS);

        return () => {
            ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, onActivity));
            document.removeEventListener("visibilitychange", check);
            clearInterval(timer);
        };
    }, [enabled]);
}