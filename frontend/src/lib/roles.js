export const ROLE_HOME = {
    CLIENT_ADMIN: "/client-admin",
};

export function homeFor(user) {
    return (user && ROLE_HOME[user.role]) || null;
}
