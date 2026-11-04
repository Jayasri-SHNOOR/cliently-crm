
const PERMISSIONS = {
  'leads.view': 'View leads',
  'leads.manage': 'Create and edit leads',
  'deals.view': 'View deals',
  'deals.manage': 'Create and edit deals',
  'team.view': 'View team performance',
  'reports.view': 'View reports and analytics'
};

const ROLES = {
  SALES_EXECUTIVE: {
    displayName: 'Sales Executive',
    description: 'Manages assigned leads, deals, customers, tasks and sales activities',
    permissions: [
      'leads.view',
      'leads.manage',
      'deals.view',
      'deals.manage',
      'team.view',
      'reports.view'
    ]
  }
};

module.exports = { PERMISSIONS, ROLES };