export const ROLE_HOME = {
    CLIENT_ADMIN: "/client-admin",
    SUPER_ADMIN: "/super-admin",
    MANAGER: "/manager",
    SALES_EXECUTIVE: "/salesExecutive",
    OPERATIONAL_STAFF: "/operations",
};

export function homeFor(user) {
    return (user && ROLE_HOME[user.role]) || null;
}
