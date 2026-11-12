// Backend base URL from Frontend/.env (VITE_API_URL), e.g. http://localhost:8000.
// If empty, requests stay relative and go through the Vite dev proxy.
export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(status, message, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

const NO_REFRESH = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
];

let refreshInFlight = null;
let onSessionExpired = () => {};

export function setSessionExpiredHandler(fn) {
  onSessionExpired = fn;
}

function formatDetail(detail) {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) => {
        const field = (d.loc || []).filter((p) => p !== 'body').join('.');
        const msg = String(d.msg || '').replace(/^Value error, /, '');
        return field ? `${field.replace(/_/g, ' ')}: ${msg}` : msg;
      })
      .join('\n');
  }
  return 'Something went wrong. Please try again.';
}

function send(path, { method = 'GET', body, params } = {}) {
  let url = API_BASE_URL + path;
  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
    ).toString();
    if (qs) url += `?${qs}`;
  }
  return fetch(url, {
    method,
    credentials: 'include',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

/** JSON API call. Transparently refreshes the session once on a 401. */
export async function api(path, options = {}) {
  let res;
  try {
    res = await send(path, options);
    if (res.status === 401 && !NO_REFRESH.includes(path)) {
      refreshInFlight ??= send('/api/auth/refresh', { method: 'POST' }).finally(() => {
        refreshInFlight = null;
      });
      const refreshed = await refreshInFlight;
      if (refreshed.ok) {
        res = await send(path, options);
      } else {
        onSessionExpired();
      }
    }
  } catch {
    throw new ApiError(
      0,
      `Cannot reach the server${API_BASE_URL ? ` at ${API_BASE_URL}` : ''}. Check that the backend is running.`,
    );
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    let message = formatDetail(data?.detail);
    if (res.status === 429) {
      const wait = res.headers.get('Retry-After');
      message = `Too many attempts. Please wait${wait ? ` ${wait}s` : ''} and try again.`;
    }
    throw new ApiError(res.status, message, data);
  }
  return data;
}
