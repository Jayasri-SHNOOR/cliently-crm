function RoleSelector({ selectedRole,onRoleChange}){
    const roles = [
        {id: "SUPER-ADMIN", label: "Super-Admin",active: true},
        {id: "CLIENT-ADMIN", label: "Client-Admin",active: true},
        {id: "CLIENT-USER", label: "Sales Executive", active: true},
    ];
    return (
        <div className="role-selector">
            {roles.map((role) => (
                <button
                    key={role.id}
                    type="button"
                    className={`role-option ${
                        selectedRole === role.id ? "selected" : ""
                    } ${!role.active ? "coming-soon" : ""}`}
                    onClick={() => role.active && onRoleChange(role.id)}
                    disabled={!role.active}
                    aria-pressed={selectedRole === role.id}
                >
                    <span className="role-label">{role.label}</span>
                    
                </button>
            ))}
        </div>
    );
}

export default RoleSelector;