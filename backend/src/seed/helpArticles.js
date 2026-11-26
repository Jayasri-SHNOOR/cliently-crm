module.exports = [
    {
      slug: 'managing-leads',
      title: 'Managing Leads',
      summary: 'Add, assign and track your leads.',
      category: 'Leads',
      tags: ['leads', 'assign', 'status', 'pipeline'],
      quickGuide: true,
      order: 1,
      content: 'A lead is a person or company interested in your products or services.\n\nOpen the Leads page to see every lead in your company. Use the status filter to show only New, Contacted, Qualified or Proposal leads, and the search box to find a lead by name, email or company.\n\nEach lead is assigned to a sales executive, who is responsible for following up. Update the status as the conversation progresses so your dashboard stays accurate.'
    },
    {
      slug: 'managing-deals',
      title: 'Managing Deals',
      summary: 'Track opportunities and sales progress.',
      category: 'Deals',
      tags: ['deals', 'opportunities', 'pipeline', 'won', 'lost'],
      quickGuide: true,
      order: 2,
      content: 'A deal is a qualified opportunity with an expected value and close date.\n\nThe Deals page shows the total number of deals, deals in progress, deals won and the total pipeline value. Filter by status, product or sales executive to focus on what matters.\n\nEvery status change is recorded in the deal activity history automatically. Add your own activities, such as calls or demos, from the deal details panel.'
    },
    {
      slug: 'understanding-analytics',
      title: 'Analytics',
      summary: "Understand your company's sales performance.",
      category: 'Analytics',
      tags: ['analytics', 'reports', 'revenue', 'performance'],
      quickGuide: true,
      order: 3,
      content: 'The dashboard summarises your sales performance in real time.\n\nTotal revenue is the sum of all deals marked Won. Open deals are deals that are not yet Won or Lost. Leads by status shows how your leads are distributed across the pipeline.\n\nAll numbers are calculated from your live data, so they update as soon as your team updates a lead or deal.'
    },
    {
      slug: 'managing-settings',
      title: 'Settings',
      summary: 'Manage company, users and billing settings.',
      category: 'Settings',
      tags: ['settings', 'company', 'profile', 'users', 'billing'],
      quickGuide: true,
      order: 4,
      content: 'The Settings page has three sections.\n\nCompany Profile holds your company name, contact details, website, industry and address.\n\nUsers and Permissions lets you manage who can access your CRM.\n\nSubscription and Billing shows your current plan, seat usage, payment method and invoice history.'
    },
    {
      slug: 'getting-started',
      title: 'Getting Started with Cliently',
      summary: 'Set up your Cliently workspace in a few minutes.',
      category: 'Getting Started',
      tags: ['setup', 'onboarding', 'start'],
      order: 1,
      content: 'Welcome to Cliently CRM.\n\nStart by completing your company profile in Settings. Then add your sales executives from the Employees page so you can assign leads to them.\n\nNext, add your first leads. As leads become qualified, convert them into deals and track them through to Won.'
    },
    {
      slug: 'billing-and-invoices',
      title: 'Billing and Invoices',
      summary: 'Understand your plan, seats and invoices.',
      category: 'Billing',
      tags: ['billing', 'invoice', 'plan', 'seats', 'upi', 'payment'],
      order: 1,
      content: 'Your plan decides your monthly price and the number of seats included.\n\nA seat is used by each active employee. Deactivating an employee frees their seat.\n\nInvoices are created on each billing date and appear in your billing history. Open an invoice to see the billing period, amount and payment method. You can change your UPI payment method at any time from Subscription and Billing.'
    },
    {
      slug: 'search-not-finding-records',
      title: 'Search is not finding a record',
      summary: 'What to check when a lead or deal does not appear in search.',
      category: 'Troubleshooting',
      tags: ['search', 'troubleshooting', 'missing'],
      order: 1,
      content: 'Search needs at least two characters and ignores upper and lower case.\n\nLead search looks at the lead name, email and company. Deal search looks at the deal name, customer and product.\n\nIf a record still does not appear, check that no status or executive filter is active, and that the record has not been deleted.'
    }
  ]