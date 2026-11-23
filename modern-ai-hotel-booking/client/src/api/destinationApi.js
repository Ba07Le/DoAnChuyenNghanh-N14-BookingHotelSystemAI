import api from './apiClient';
export const getDestinations = async () => (await api.get('/destinations')).data.data;
export const getDestination = async (slug) => (await api.get(`/destinations/${encodeURIComponent(slug)}`)).data.data;
export const getAdminDestinations = async () => (await api.get('/admin/destinations')).data.data;
export const createDestination = async (body) => (await api.post('/admin/destinations', body)).data;
export const updateDestination = async (id, body) => (await api.patch(`/admin/destinations/${id}`, body)).data;
export const deleteDestination = async (id) => (await api.delete(`/admin/destinations/${id}`)).data;
