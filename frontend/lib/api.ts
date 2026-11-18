const ENV_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const API_BASE_STORAGE_KEY = 'goatfarm_api_base_url';

function stripTrailingSlashes(value: string) {
  return value.replace(/\/+$/, '');
}

/**
 * Accepts `192.168.1.10:3001`, `http://192.168.1.10:3001` or a full
 * `https://farm.example.com/api` URL and returns a clean base URL.
 * If no path is given, `/api` is appended automatically.
 */
export function normalizeApiBaseUrl(raw: string): string {
  let value = (raw || '').trim();
  if (!value) return '';

  if (!/^https?:\/\//i.test(value)) {
    value = `http://${value}`;
  }

  value = stripTrailingSlashes(value);

  try {
    const url = new URL(value);
    if (!url.pathname || url.pathname === '/') {
      url.pathname = '/api';
    }
    return stripTrailingSlashes(url.toString());
  } catch {
    return value;
  }
}

/** The saved server address (phone app) or the build-time default (web). */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem(API_BASE_STORAGE_KEY);
    if (stored) return normalizeApiBaseUrl(stored);
  }
  return normalizeApiBaseUrl(ENV_API_BASE_URL);
}

/** Save a server address on this device. Pass an empty string to reset. */
export function setApiBaseUrl(raw: string): string {
  const normalized = normalizeApiBaseUrl(raw);
  if (typeof window !== 'undefined') {
    if (normalized) {
      window.localStorage.setItem(API_BASE_STORAGE_KEY, normalized);
    } else {
      window.localStorage.removeItem(API_BASE_STORAGE_KEY);
    }
  }
  return normalized;
}

/**
 * Core authenticated fetch wrapper.
 * Automatically attaches the JWT token from localStorage (set on login) and
 * redirects to /login if the session is missing/expired (401).
 */
export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const url = `${getApiBaseUrl()}${endpoint}`;

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 && typeof window !== 'undefined') {
    // Session missing or expired - force re-login.
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
    throw new Error(error.message || 'API request failed');
  }

  // Some endpoints (e.g. 204) may not return a body.
  const text = await response.text();
  return text ? JSON.parse(text) : { status: 'success', data: null };
}

function get(endpoint: string) {
  return fetchApi(endpoint);
}
function post(endpoint: string, data: any) {
  return fetchApi(endpoint, { method: 'POST', body: JSON.stringify(data) });
}
function put(endpoint: string, data: any) {
  return fetchApi(endpoint, { method: 'PUT', body: JSON.stringify(data) });
}
function del(endpoint: string) {
  return fetchApi(endpoint, { method: 'DELETE' });
}

// ---- Auth / current user helpers -----------------------------------------

export function getCurrentUser(): any {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isAdmin(): boolean {
  return getCurrentUser()?.role === 'admin';
}

/** Mirrors the backend's 1-day edit lock so the UI can disable actions proactively. */
export function canEditRecord(createdAt: string | null | undefined): boolean {
  if (isAdmin()) return true;
  if (!createdAt) return true;
  const createdTime = new Date(createdAt).getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;
  return Date.now() - createdTime <= oneDayMs;
}

export const authApi = {
  login: (username: string, password: string) =>
    fetchApi('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  me: () => get('/auth/me'),
  updatePassword: (data: { current_password?: string; new_password: string }) =>
    put('/auth/password', data),
};

export const goatApi = {
  list: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return get(`/goats${q}`);
  },
  get: (id: number | string) => get(`/goats/${id}`),
  qr: (id: number | string) => get(`/goats/${id}/qr`),
  create: (data: any) => post('/goats', data),
  update: (id: number | string, data: any) => put(`/goats/${id}`, data),
  remove: (id: number | string) => del(`/goats/${id}`),
};

export const breedingApi = {
  list: () => get('/breeding'),
  create: (data: any) => post('/breeding', data),
  update: (id: number | string, data: any) => put(`/breeding/${id}`, data),
  remove: (id: number | string) => del(`/breeding/${id}`),
};

export const pregnancyApi = {
  list: () => get('/pregnancy'),
  alerts: () => get('/pregnancy/alerts'),
  create: (data: any) => post('/pregnancy', data),
  update: (id: number | string, data: any) => put(`/pregnancy/${id}`, data),
  remove: (id: number | string) => del(`/pregnancy/${id}`),
};

export const deliveryApi = {
  list: () => get('/kiddings'),
  create: (data: any) => post('/kiddings', data),
  update: (id: number | string, data: any) => put(`/kiddings/${id}`, data),
  remove: (id: number | string) => del(`/kiddings/${id}`),
};

export const healthApi = {
  list: () => get('/health'),
  create: (data: any) => post('/health', data),
  update: (id: number | string, data: any) => put(`/health/${id}`, data),
  remove: (id: number | string) => del(`/health/${id}`),
};

export const financeApi = {
  list: () => get('/finance'),
  create: (data: any) => post('/finance', data),
  update: (id: number | string, data: any) => put(`/finance/${id}`, data),
  remove: (id: number | string) => del(`/finance/${id}`),
};

export const feedingApi = {
  inventory: () => get('/feeding/inventory'),
  addInventory: (data: any) => post('/feeding/inventory', data),
  updateInventory: (id: number | string, data: any) => put(`/feeding/inventory/${id}`, data),
  removeInventory: (id: number | string) => del(`/feeding/inventory/${id}`),
  records: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return get(`/feeding/records${q}`);
  },
  addRecord: (data: any) => post('/feeding/records', data),
  updateRecord: (id: number | string, data: any) => put(`/feeding/records/${id}`, data),
  removeRecord: (id: number | string) => del(`/feeding/records/${id}`),
  alerts: () => get('/feeding/alerts'),
};

export const calendarApi = {
  list: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return get(`/calendar${q}`);
  },
  create: (data: any) => post('/calendar', data),
  update: (id: number | string, data: any) => put(`/calendar/${id}`, data),
  remove: (id: number | string) => del(`/calendar/${id}`),
};

export const analyticsApi = {
  goatScorecard: (id: number | string) => get(`/analytics/goat/${id}`),
  farm: () => get('/analytics/farm'),
  malePerformance: () => get('/analytics/male-performance'),
  femaleFertility: () => get('/analytics/female-fertility'),
  growth: () => get('/analytics/growth'),
};

export const genealogyApi = {
  tree: (id: number | string, maxGenerations?: number) =>
    get(`/genealogy/${id}${maxGenerations ? `?max_generations=${maxGenerations}` : ''}`),
  related: (id: number | string) => get(`/genealogy/${id}/related`),
};

export const reportsApi = {
  summary: () => get('/reports/summary'),
  monthlyBirths: () => get('/reports/monthly-births'),
  breedingSuccess: () => get('/reports/breeding-success'),
  breedPerformance: () => get('/reports/breed-performance'),
  monthlyFinancials: () => get('/reports/monthly-financials'),
  activities: () => get('/reports/activities'),
};

export const settingsApi = {
  list: () => get('/settings'),
  update: (key: string, value: string) => put(`/settings/${key}`, { value }),
};

export const breedsApi = {
  list: () => get('/breeds'),
  create: (name: string) => post('/breeds', { name }),
  remove: (id: number | string) => del(`/breeds/${id}`),
};

export const usersApi = {
  list: () => get('/users'),
  create: (data: any) => post('/users', data),
  update: (id: number | string, data: any) => put(`/users/${id}`, data),
  remove: (id: number | string) => del(`/users/${id}`),
};
