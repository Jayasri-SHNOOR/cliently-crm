import {logout} from "../../lib/auth";
import {useCurrentUser} from "../../lib/useSession";

function OperationsApp(){
    const user = useCurrentUser();

    const handleLogout = async () => {
        await logout();
        window.location.replace("/login?reason=SIGNED_OUT");
    };

    return(
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#F4FAF8" }}>
            <div style={{ textAlign: "center", color: "#183735" }}>
                <h1>Operations</h1>
                <p>
                    Signed in as <strong>{user?.name}</strong> ({user?.role})
                    {user?.company && <> - {user.company.name}</>}
                </p>
                <p style={{ color: "#637875" }}>The Operations dashboard is being built.</p>
                <button type="button" onClick={handleLogout} className="sign-in-button" style={{ maxWidth: 220 }}>
                    Log out
                </button>
            </div>
        </main>
    );
}

export default OperationsApp;