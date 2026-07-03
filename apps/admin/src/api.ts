/** Admin-API-Client: authentifiziert über X-Admin-Token (MVP). */
let adminToken = localStorage.getItem('carmatch_admin_token') ?? ''

export function setAdminToken(token: string) {
  adminToken = token
  localStorage.setItem('carmatch_admin_token', token)
}

export function getAdminToken() {
  return adminToken
}

export async function adminApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api/admin${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      'x-admin-token': adminToken,
      ...options.headers,
    },
  })
  const data = (await res.json()) as { ok: boolean; data: T; error?: string; total?: number }
  if (!res.ok || !data.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
  return data.data
}
