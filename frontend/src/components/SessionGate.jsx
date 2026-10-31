import { useEffect, useState } from "react";
import { restoreSession } from "../lib/auth";

function SessionGate({ children }) {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        let active = true;
        restoreSession().finally(() => {
            if (active) {
                setReady(true);
            }
        });
        return () => {
            active = false;
        };
    }, []);

    if (!ready) {
        return (
            <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#64748b" }}>
                Loading...
            </div>
        );
    }

    return children;
}

export default SessionGate;
