
import api from '../../lib/api'

export const getMySettings = () => api.get('/api/me/settings')

export const saveMySettings = (payload) => api.put('/api/me/settings', payload)
  api.put('/api/me/settings/password', { currentPassword, newPassword })
