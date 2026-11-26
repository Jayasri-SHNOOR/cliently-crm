import { useSyncExternalStore } from "react";
import { subscribe, getCurrentUser } from "./session";

export function useCurrentUser() {
    return useSyncExternalStore(subscribe, getCurrentUser);
}
