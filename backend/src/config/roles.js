const PERMISSIONS = {
    'leads.view': 'View leads',
    'leads.manage': 'Create and edit leads',
    'deals.view': 'View deals',
    'deals.manage': 'Create and edit deals',
    'team.view': 'View team performance',
    'reports.view': 'View reports and analytics'
}

const ROLES = {
    'Sales Executive': {
        description: 'Works on their assigned leads and deals',
        permissions: ['leads.view', 'leads.manage', 'deals.view', 'deals.manage']
    },
    'Sales Manager': {
        description: 'Leads the sales team and tracks its performance',
        permissions: ['leads.view', 'leads.manage', 'deals.view', 'deals.manage', 'team.view', 'reports.view']
    }
}

module.exports = {PERMISSIONS,ROLES}