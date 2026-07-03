import React, { useCallback, useEffect, useState } from 'react'
import { adminApi } from '../api'

interface Flag {
  key: string
  enabled: boolean
  note: string | null
}

/** Feature-Flags: zentrale Schalter, z. B. sponsored_listings, premium_paywall. */
export function FlagsView() {
  const [flags, setFlags] = useState<Flag[]>([])
  const [newKey, setNewKey] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(() => {
    adminApi<Flag[]>('/feature-flags').then(setFlags).catch((e: Error) => setError(e.message))
  }, [])

  useEffect(load, [load])

  const save = async (key: string, enabled: boolean) => {
    await adminApi(`/feature-flags/${key}`, { method: 'PUT', body: JSON.stringify({ enabled }) })
    load()
  }

  return (
    <>
      <h2>Feature-Flags</h2>
      <div className="row-flex">
        <input
          type="text"
          placeholder="neuer Flag-Key, z. B. sponsored_listings"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        <button
          className="action secondary"
          disabled={!newKey.trim()}
          onClick={() => {
            void save(newKey.trim(), false).then(() => setNewKey(''))
          }}
        >
          Anlegen
        </button>
        {error && <span className="error">{error}</span>}
      </div>
      <table>
        <thead>
          <tr><th>Key</th><th>Status</th><th>Notiz</th><th></th></tr>
        </thead>
        <tbody>
          {flags.map((f) => (
            <tr key={f.key}>
              <td><code>{f.key}</code></td>
              <td><span className={`pill ${f.enabled ? 'ok' : ''}`}>{f.enabled ? 'aktiv' : 'aus'}</span></td>
              <td>{f.note ?? ''}</td>
              <td>
                <button className="action secondary" onClick={() => void save(f.key, !f.enabled)}>
                  {f.enabled ? 'Deaktivieren' : 'Aktivieren'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
