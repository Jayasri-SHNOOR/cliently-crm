const PERMISSIONS = {
  'leads.view': 'View leads',
  'leads.manage': 'Create and edit leads',
  'deals.view': 'View deals',
  'deals.manage': 'Create and edit deals',
  'team.view': 'View team performance',
  'reports.view': 'View reports and analytics',
  'tickets.view': 'View support tickets',
  'tickets.manage': 'Create, assign and resolve support tickets',
  'workorders.view': 'View work orders',
  'workorders.manage': 'Create and update work orders',
  'kb.view': 'View knowledge base articles',
  'kb.manage': 'Write and publish knowledge base articles',
  'assets.view': 'View inventory and assets',
  'assets.manage': 'Manage stock and assign assets'
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
  },
  OPERATIONAL_STAFF: {
    displayName: 'Operational Staff',
    description: 'Handles support tickets, project delivery, knowledge base and inventory after the sale',
    permissions: [
      'tickets.view',
      'tickets.manage',
      'workorders.view',
      'workorders.manage',
      'kb.view',
      'kb.manage',
      'assets.view',
      'assets.manage'
    ]
  }
};

module.exports = { PERMISSIONS, ROLES };