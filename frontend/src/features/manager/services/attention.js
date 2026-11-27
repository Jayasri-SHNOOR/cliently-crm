import { getDashboard, formatDate } from './managerApi'
import { managerCare } from '../../customer-care/careApi'

export function loadAttention() {
  return Promise.all([
    getDashboard(),
    managerCare.listRequests('Requested').catch(() => ({ serviceRequests: [] })),
  ]).then(([dashboard, requests]) => {
    const overdue = (dashboard.needsAttention?.overdue || []).map((lead) => ({
      id: `overdue-${lead.id}`,
      title: `Follow-up overdue: ${lead.company || lead.name}`,
      message: `${lead.executive || 'Unassigned'} · due ${formatDate(lead.nextFollowUp)}`,
      time: formatDate(lead.nextFollowUp),
      page: 'followups',
      read: false,
    }))

    const unassigned = (dashboard.needsAttention?.unassigned || []).map((lead) => ({
      id: `lead-${lead.id}`,
      title: `New enquiry not assigned: ${lead.company || lead.name}`,
      message: lead.product || 'General enquiry',
      time: formatDate(lead.createdAt),
      page: 'assignment',
      read: false,
    }))

    const service = (requests.serviceRequests || []).map((request) => ({
      id: `sr-${request.id}`,
      title: `Service request waiting: ${request.requestNumber}`,
      message: `${request.customer?.name || 'Customer'} · ${request.serviceType}${request.productName ? ` · ${request.productName}` : ''}`,
      time: formatDate(request.createdAt),
      page: 'service-requests',
      read: false,
    }))

    return [...service, ...overdue, ...unassigned]
  })
}
