export const executives = [
  { id: 1, name: 'Priya', status: 'Active', leads: 30, deals: 9, followups: 6, won: 5, quotes: 12, accepted: 7, salesValue: 840000, target: 82 },
  { id: 2, name: 'Ravi', status: 'Active', leads: 8, deals: 3, followups: 2, won: 3, quotes: 5, accepted: 3, salesValue: 310000, target: 64 },
  { id: 3, name: 'Karthik', status: 'Active', leads: 21, deals: 6, followups: 4, won: 4, quotes: 9, accepted: 4, salesValue: 560000, target: 71 },
  { id: 4, name: 'Divya', status: 'Inactive', leads: 12, deals: 2, followups: 5, won: 1, quotes: 6, accepted: 1, salesValue: 120000, target: 45 },
];

export const products = [
  {
    id: '6ac763079d0b89c011741da4',
    name: 'Water Purifier',
    code: 'WP-DH-001',
    type: 'Service',
    category: 'Appliances',
    description: 'Filters water with replaceable water filters.',
    price: 18000,
    duration: '15 Days',
    status: 'Active',
    showOnWebsite: false,
  },
  {
    id: '6afdac4f6ac91e6c2b3a10db',
    name: 'CCTV',
    code: 'CCTV-DH-001',
    type: 'Service',
    category: 'Security',
    description: 'Surveillance and security in everywhere',
    price: 10000,
    duration: '20 Days',
    status: 'Active',
    showOnWebsite: true,
  },
];

export const leads = [
  { id: 1, customer: 'Arun Constructions', product: 'CCTV', qty: 10, source: 'Website', status: 'New', priority: 'High', executive: 'Unassigned', deadline: '' },
  { id: 2, customer: 'Sri Textiles', product: 'Water Purifier', qty: 5, source: 'Website', status: 'New', priority: 'Medium', executive: 'Unassigned', deadline: '' },
  { id: 3, customer: 'Kumar Steels', product: 'CCTV', qty: 15, source: 'Referral', status: 'Qualified', priority: 'High', executive: 'Priya', deadline: '2026-11-22' },
  { id: 4, customer: 'Metro Infra', product: 'CCTV', qty: 30, source: 'Sales Executive', status: 'Qualified', priority: 'High', executive: 'Karthik', deadline: '2026-11-20' },
  { id: 5, customer: 'Balaji Fabrication', product: 'Water Purifier', qty: 8, source: 'Website', status: 'Unqualified', priority: 'Low', executive: 'Ravi', deadline: '' },
  { id: 6, customer: 'Chennai Port Works', product: 'CCTV', qty: 12, source: 'Website', status: 'Contacted', priority: 'Medium', executive: 'Priya', deadline: '2026-11-25' },
];

export const followups = [
  { id: 1, customer: 'Kumar Steels', executive: 'Priya', type: 'Call', due: '2026-11-19', status: 'Upcoming', note: 'Follow up on CCTV quotation' },
  { id: 2, customer: 'Metro Infra', executive: 'Karthik', type: 'Meeting', due: '2026-11-20', status: 'Upcoming', note: 'CCTV site visit and installation discussion' },
  { id: 3, customer: 'Chennai Port Works', executive: 'Priya', type: 'Email', due: '2026-11-19', status: 'Upcoming', note: 'Send revised CCTV price quotation' },
  { id: 4, customer: 'Balaji Fabrication', executive: 'Ravi', type: 'Call', due: '2026-11-18', status: 'Completed', note: 'Water Purifier requirement confirmed' },
];

export const deals = [
  { id: 1, customer: 'Kumar Steels', product: 'CCTV', value: 150000, executive: 'Priya', stage: 'Negotiation', closing: '2026-11-28' },
  { id: 2, customer: 'Metro Infra', product: 'CCTV', value: 300000, executive: 'Karthik', stage: 'Proposal', closing: '2026-12-05' },
  { id: 3, customer: 'Sri Textiles', product: 'Water Purifier', value: 90000, executive: 'Ravi', stage: 'Won', closing: '2026-11-10' },
  { id: 4, customer: 'Balaji Fabrication', product: 'Water Purifier', value: 36000, executive: 'Ravi', stage: 'Lost', closing: '2026-11-08' },
  { id: 5, customer: 'Chennai Port Works', product: 'CCTV', value: 120000, executive: 'Priya', stage: 'Qualified', closing: '2026-12-12' },
];

export const quotations = [
  { id: 1, number: 'QT-1021', customer: 'Kumar Steels', product: 'CCTV', quantity: 15, amount: 150000, date: '2026-11-12', status: 'Sent' },
  { id: 2, number: 'QT-1022', customer: 'Sri Textiles', product: 'Water Purifier', quantity: 5, amount: 90000, date: '2026-11-15', status: 'Accepted' },
  { id: 3, number: 'QT-1023', customer: 'Balaji Fabrication', product: 'Water Purifier', quantity: 2, amount: 36000, date: '2026-11-13', status: 'Rejected' },
  { id: 4, number: 'QT-1024', customer: 'Metro Infra', product: 'CCTV', quantity: 30, amount: 300000, date: '2026-11-16', status: 'Pending' },
  { id: 5, number: 'QT-1019', customer: 'Arun Constructions', product: 'CCTV', quantity: 5, amount: 50000, date: '2026-11-10', status: 'Expired' },
];

export const invoices = [
  { id: 1, number: 'INV-3001', customer: 'Sri Textiles', product: 'Water Purifier', date: '2026-11-10', due: '2026-11-25', amount: 90000, paid: 90000, status: 'Paid' },
  { id: 2, number: 'INV-3002', customer: 'Kumar Steels', product: 'CCTV', date: '2026-10-28', due: '2026-11-25', amount: 150000, paid: 60000, status: 'Partial' },
  { id: 3, number: 'INV-3003', customer: 'Metro Infra', product: 'CCTV', date: '2026-11-14', due: '2026-11-29', amount: 300000, paid: 0, status: 'Pending' },
  { id: 4, number: 'INV-2994', customer: 'Chennai Port Works', product: 'CCTV', date: '2026-10-05', due: '2026-10-20', amount: 120000, paid: 0, status: 'Overdue' },
];

export const payments = [
  { id: 1, ref: 'PAY-501', invoice: 'INV-3001', customer: 'Sri Textiles', date: '2026-11-12', amount: 90000, mode: 'Bank Transfer', status: 'Received' },
  { id: 2, ref: 'PAY-502', invoice: 'INV-3002', customer: 'Kumar Steels', date: '2026-11-08', amount: 60000, mode: 'UPI', status: 'Partial' },
];

export const monthlySales = [
  { label: 'Jun', value: 3.2 },
  { label: 'Jul', value: 4.1 },
  { label: 'Aug', value: 3.8 },
  { label: 'Sep', value: 5.3 },
  { label: 'Oct', value: 6.0 },
  { label: 'Nov', value: 4.6 },
];

export const notifications = [
  { id: 1, title: 'Quotation follow-up', message: 'Kumar Steels has not responded to the CCTV quotation QT-1021.', time: '2h ago', read: false },
  { id: 2, title: 'New enquiry', message: 'Arun Constructions requested 10 CCTV units.', time: '5h ago', read: false },
  { id: 3, title: 'Payment received', message: 'Sri Textiles paid ₹90,000 for Water Purifier invoice INV-3001.', time: 'Yesterday', read: true },
];