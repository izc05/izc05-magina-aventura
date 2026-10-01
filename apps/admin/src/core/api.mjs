const SESSION_KEY = 'magina_admin_session';

function config() {
  const value = globalThis.MAGINA_ADMIN_CONFIG;
  if (!value?.supabaseUrl || !value?.publishableKey) {
    throw new Error('Missing MAGINA_ADMIN_CONFIG.supabaseUrl/publishableKey');
  }
  return value;
}

export function getSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null'); }
  catch { return null; }
}

export function setSession(session) {
  if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else sessionStorage.removeItem(SESSION_KEY);
}

export async function signIn(email, password) {
  const { supabaseUrl, publishableKey } = config();
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', apikey: publishableKey },
    body: JSON.stringify({ email, password })
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body?.msg || body?.message || 'No se pudo iniciar sesión');
  setSession(body);
  return body;
}

export async function refreshSession() {
  const current = getSession();
  if (!current?.refresh_token) {
    setSession(null);
    throw new Error('La sesión ha caducado. Inicia sesión de nuevo.');
  }
  const { supabaseUrl, publishableKey } = config();
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', apikey: publishableKey },
    body: JSON.stringify({ refresh_token: current.refresh_token })
  });
  const body = await response.json();
  if (!response.ok || !body?.access_token) {
    setSession(null);
    throw new Error(body?.msg || body?.message || 'La sesión ha caducado. Inicia sesión de nuevo.');
  }
  setSession({ ...current, ...body });
  return getSession();
}

export async function signOut() {
  const current = getSession();
  setSession(null);
  if (!current?.access_token) return;
  const { supabaseUrl, publishableKey } = config();
  try {
    await fetch(`${supabaseUrl}/auth/v1/logout`, {
      method: 'POST',
      headers: { apikey: publishableKey, authorization: `Bearer ${current.access_token}` }
    });
  } catch {
    // The local session is already cleared; remote revocation is best effort.
  }
}

function authHeaders(extra = {}) {
  const { publishableKey } = config();
  const session = getSession();
  if (!session?.access_token) throw new Error('Sesión administrativa no iniciada');
  return { apikey: publishableKey, authorization: `Bearer ${session.access_token}`, ...extra };
}

async function authorizedFetch(url, options = {}, allowRefresh = true) {
  const response = await fetch(url, {
    ...options,
    headers: authHeaders(options.headers ?? {})
  });
  if (response.status === 401 && allowRefresh && getSession()?.refresh_token) {
    await refreshSession();
    return authorizedFetch(url, options, false);
  }
  return response;
}

async function parseResponse(response) {
  const text = await response.text();
  let parsed = null;
  if (text) {
    try { parsed = JSON.parse(text); }
    catch { parsed = text; }
  }
  if (!response.ok) {
    if (response.status === 401) setSession(null);
    const error = new Error(parsed?.message || parsed?.error_description || (typeof parsed === 'string' ? parsed : `HTTP ${response.status}`));
    error.status = response.status;
    error.details = parsed;
    throw error;
  }
  return parsed;
}

export async function api(path, { method = 'GET', body, headers = {} } = {}) {
  const { supabaseUrl } = config();
  const response = await authorizedFetch(`${supabaseUrl}${path}`, {
    method,
    headers: { 'content-type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return parseResponse(response);
}

export async function rpc(name, args = {}) {
  return api(`/rest/v1/rpc/${name}`, { method: 'POST', body: args });
}

export async function table(name, query = '') {
  return api(`/rest/v1/${name}${query}`);
}

export async function insert(name, row) {
  return api(`/rest/v1/${name}`, { method: 'POST', body: row, headers: { Prefer: 'return=representation' } });
}

export async function patch(name, filter, row) {
  return api(`/rest/v1/${name}?${filter}`, { method: 'PATCH', body: row, headers: { Prefer: 'return=representation' } });
}

export async function uploadMedia(file, objectKey) {
  const { supabaseUrl } = config();
  const response = await authorizedFetch(`${supabaseUrl}/storage/v1/object/media/${encodeURIComponent(objectKey).replaceAll('%2F', '/')}`, {
    method: 'POST',
    headers: { 'content-type': file.type || 'application/octet-stream', 'x-upsert': 'false' },
    body: file
  });
  const parsed = await parseResponse(response);
  return parsed;
}
