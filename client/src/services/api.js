export const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const BASE = `${API_ORIGIN}/api`;
const TOKEN_KEY = 'renteasy_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details || {};
  }
}

async function request(path, { method = 'GET', body, params, formData } = {}) {
  const url = new URL(BASE + path, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
    });
  }

  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new ApiError('Serveur injoignable. Vérifiez que le backend est démarré.', 0);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) window.dispatchEvent(new Event('renteasy:unauthorized'));
    const fallback = res.status >= 500
      ? `Le serveur ne répond pas (code ${res.status}). Vérifiez que l’API et MongoDB sont démarrés.`
      : 'Erreur inattendue';
    throw new ApiError(data.message || fallback, res.status, data.details);
  }
  return data;
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: () => request('/auth/me'),

  listProperties: (params) => request('/properties', { params }),
  getProperty: (id) => request(`/properties/${id}`),
  myProperties: () => request('/properties/mine'),
  createProperty: (payload) => request('/properties', { method: 'POST', body: payload }),
  updateProperty: (id, payload) => request(`/properties/${id}`, { method: 'PUT', body: payload }),
  deleteProperty: (id) => request(`/properties/${id}`, { method: 'DELETE' }),

  favorites: () => request('/users/favorites'),
  toggleFavorite: (propertyId) => request(`/users/favorites/${propertyId}`, { method: 'POST' }),

  sendRequest: (propertyId, payload) =>
    request('/requests', { method: 'POST', body: { propertyId, ...payload } }),
  myRequests: () => request('/requests/my'),
  ownerRequests: (status) => request('/requests/owner', { params: { status } }),
  updateRequestStatus: (id, status, markUnavailable = true) =>
    request(`/requests/${id}`, { method: 'PATCH', body: { status, markUnavailable } }),
  cancelRequest: (id) => request(`/requests/${id}`, { method: 'DELETE' }),

  unread: () => request('/messages/unread'),
  thread: (requestId) => request(`/messages/${requestId}`),
  sendMessage: (requestId, body) => request(`/messages/${requestId}`, { method: 'POST', body: { body } }),

  reviews: (propertyId) => request(`/properties/${propertyId}/reviews`),
  addReview: (propertyId, payload) => request(`/properties/${propertyId}/reviews`, { method: 'POST', body: payload }),
  deleteMyReview: (propertyId) => request(`/properties/${propertyId}/reviews/mine`, { method: 'DELETE' }),

  uploadImages: (files) => {
    const formData = new FormData();
    [...files].forEach((file) => formData.append('images', file));
    return request('/uploads', { method: 'POST', formData });
  },

  ownerStats: () => request('/stats/owner'),

  adminOverview: () => request('/admin/overview'),
  adminUsers: (params) => request('/admin/users', { params }),
  adminProperties: (params) => request('/admin/properties', { params }),
  adminRemoveProperty: (id) => request(`/admin/properties/${id}`, { method: 'DELETE' }),
};
