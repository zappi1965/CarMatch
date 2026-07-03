import Constants from 'expo-constants'
import { useSession } from './store'

const API_URL: string =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? 'http://localhost:4100'

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code)
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useSession.getState().token
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; data?: T }
  if (!res.ok || data.ok === false) throw new ApiError(res.status, data.error ?? `HTTP_${res.status}`)
  return (data.data ?? data) as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body != null ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

/** Query-String aus Standort + Filtern für discover/search. */
export function buildQuery(params: Record<string, unknown>): string {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v == null || v === '') continue
    q.set(k, Array.isArray(v) ? v.join(',') : String(v))
  }
  const s = q.toString()
  return s ? `?${s}` : ''
}

/** Stellt sicher, dass eine Session existiert (Gastmodus als Default). */
export async function ensureSession(locale: string): Promise<void> {
  const state = useSession.getState()
  if (state.token) return
  const res = await request<{ token: string; user: { id: string } }>('/auth/guest', {
    method: 'POST',
    body: JSON.stringify({ locale }),
  })
  useSession.getState().setSession(res.token, res.user.id, true)
}
