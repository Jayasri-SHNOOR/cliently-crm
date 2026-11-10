const tenant = {
  slug: 'devhub',
  companyName: 'DevHub',
  adminName: 'Jeyka',
  adminEmail: 'jeyka@devhub.com',
  plan: 'Professional',
  seats: 15,
  email: 'contact@devhub.com',
  phone: '+91 9876543210',
  website: 'https://www.devhub.com',
  industry: 'software',
  address: '12, Anna Salai, Tiruchirappalli, Tamil Nadu 620001',
  nextBillingDate: '2026-11-01',
  paymentMethod: { type: 'UPI', upiId: 'devhub@upi' }
}

const leads = [
    {name: 'Krishnaji S',email: 'krishna@gmail.com',company: 'Techlead Solutions',phone: '+91 9876543217',status: 'Contacted',value: 80000,  productInterested: 'Website Development', executive: 'Anitha', minutesAgo: 1 },
    {name: 'Geethavarshini R',email: 'geethu@gmail.com',company: 'CloudBridge',phone: '+91 9876543213', status: 'Proposal',value: 450000,productInterested:'CRM Software',executive: 'Arjun',minutesAgo: 2 },
    {name: 'Joshua Jenisus R',email: 'jenisusjr07@gmail.com',company: 'Vertex Labs',phone: '+91 9876543214', status: 'Qualified',value: 210000, productInterested: 'Website Development', executive: 'Anitha',  minutesAgo: 3 },
    {name: 'Mounika M',email: 'mouni@gmail.com',company: 'BlueWave Pvt Ltd',phone: '+91 9876543211', status: 'New', value: 180000, productInterested: 'CRM Software', executive: 'Anitha',  minutesAgo: 4 },
    {name: 'ArunBalaji',email: 'arun@gmail.com',company: 'Tech Solutions', phone: '+91 9876543210', status: 'Qualified', value: 250000, productInterested: 'CRM Software', executive: 'Arjun', minutesAgo: 5 },
    {name: 'Jeya Kartika G',email: 'jeykagovinda@gmail.com', company: 'NextGen Systems', phone: '+91 9876543212', status: 'Contacted', value: 320000, productInterested: 'Website Development', executive: 'Vignesh', minutesAgo: 6 },
    {name: 'Gocegin Sanjay N', email: 'goce@gmail.com',company: 'Embedded Pvt Ltd',phone: '+91 9876543215', status: 'New',value: 180000, productInterested: 'CRM Software',executive: 'Vignesh', minutesAgo: 7 },
    {name: 'Kiruthika K',email: 'kiki@gmail.com',company: 'Photonic Solutions', phone: '+91 9876543216', status: 'Proposal',  value: 300000, productInterested: 'Website Development', executive: 'Arjun',   minutesAgo: 8 }
]
  
const deals = [
    {name: 'CRM Deal',customer: 'ABC Corp',product: 'CRM Software',value: 5999,status: 'Won',assignedTo: 'Arjun',expectedClose: '2026-10-15', activities: ['Payment received', 'Deal closed'] },
    {name: 'Website Deal',customer: 'FashionHub',product: 'Website Development',value: 75000,status: 'Proposal', assignedTo: 'Jayshree', expectedClose: '2026-10-20', activities: ['Proposal sent', 'Requirement discussed'] },
    {name: 'CRM Deal',customer: 'XYZ Ltd',product: 'CRM Software',value: 2999,status: 'Negotiation',assignedTo: 'Anitha',expectedClose: '2026-10-25',activities: ['Pricing discussed', 'Demo completed'] },
    {name: 'Website Deal',customer: 'StyleMart',product: 'Website Development',value: 120000,status: 'Qualified',assignedTo: 'Vignesh', expectedClose: '2026-10-30',activities: ['Requirement collected', 'Client qualified'] },
    {name: 'CRM Deal',customer: 'NextGen Systems', product: 'CRM Software',value: 8999,status: 'New',assignedTo: 'Vignesh',expectedClose: '2026-11-05', activities: ['Lead converted to deal'] },
    {name: 'Website Deal',customer:'TechBridge',product: 'Website Development',value: 95000,status:'Lost',assignedTo: 'Jayshree',expectedClose: '2026-10-10', activities: ['Budget issue', 'Deal lost'] }
]

const invoices = [
  { invoiceNumber: 'INV-2026-10', issuedAt: '2026-10-01', periodStart: '2026-10-01', periodEnd: '2026-10-31', plan: 'Professional', amount: 2999, status: 'Paid', paymentMethod: 'UPI' },
  { invoiceNumber: 'INV-2026-09', issuedAt: '2026-09-01', periodStart: '2026-09-01', periodEnd: '2026-09-30', plan: 'Professional', amount: 2999, status: 'Paid', paymentMethod: 'UPI' },
  { invoiceNumber: 'INV-2026-08', issuedAt: '2026-08-01', periodStart: '2026-08-01', periodEnd: '2026-08-31', plan: 'Professional', amount: 2999, status: 'Paid', paymentMethod: 'UPI' }
]
module.exports = { tenant, leads, deals, invoices }