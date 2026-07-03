import React, { useEffect, useState } from 'react'
import { adminApi } from '../api'

interface AdminUser {
  id: string
  email: string | null
  authProvider: string
  role: string
  locale: string
  createdAt: string
  _count: { swipes: number; favorites: number; leads: number }
}

export function UsersView() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    adminApi<AdminUser[]>('/users').then(setUsers).catch((e: Error) => setError(e.message))
  }, [])

  return (
    <>
      <h2>Nutzer</h2>
      {error && <p className="error">{error}</p>}
      <table>
        <thead>
          <tr><th>E-Mail</th><th>Login</th><th>Rolle</th><th>Sprache</th><th>Swipes</th><th>Favoriten</th><th>Leads</th><th>Registriert</th></tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.email ?? <span className="muted">Gast ({u.id.slice(0, 8)}…)</span>}</td>
              <td>{u.authProvider}</td>
              <td>{u.role !== 'USER' ? <span className="pill ok">{u.role}</span> : u.role}</td>
              <td>{u.locale}</td>
              <td>{u._count.swipes}</td>
              <td>{u._count.favorites}</td>
              <td>{u._count.leads}</td>
              <td>{new Date(u.createdAt).toLocaleDateString('de-DE')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
