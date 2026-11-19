import {Navigate, useLocation} from "react-router-dom";
import {useCurrentUser} from "../lib/useSession";
import {homeFor} from "../lib/roles";
import {useIdleTimeout} from "../lib/useIdleTimeout";

function ProtectedRoute({ roles, children }){
    const user = useCurrentUser();
    const location = useLocation();
    const allowed = Boolean(user) && (!roles || roles.includes(user.role));

    useIdleTimeout(allowed);

    if(!user){
        return <Navigate to="/login" replace state={{from: location.pathname}} />;
    }

    if(roles && !roles.includes(user.role)){
        return <Navigate to={homeFor(user) || "/login"} replace />;
    }

    return children;
}

export default ProtectedRoute;