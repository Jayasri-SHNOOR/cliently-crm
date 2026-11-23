import api from './api'

const data = (res) => res.data

export const getDashboard = () => api.get('/manager/dashboard').then(data)
export const getLeads = (params) => api.get('/manager/leads', { params }).then(data)
export const getExecutives = () => api.get('/manager/leads/executives').then(data)
export const assignLead = (id, body) => api.patch(`/manager/leads/${id}/assign`, body).then(data)
export const getDeals = () => api.get('/manager/deals').then(data)
export const getTeam = () => api.get('/manager/team').then(data)
export const getQuotations = () => api.get('/manager/quotations').then(data)