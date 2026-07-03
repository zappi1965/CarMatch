import React, { useCallback, useEffect, useState } from 'react'
import { adminApi } from '../api'

interface Provider {
  key: string
  enabled: boolean
  configured: boolean
  attribution: { displayName: string; attributionText: string; allowsPersistentStorage: boolean }
  state: { lastSyncAt: string | null; lastError: string | null } | null
}

export function ProvidersView() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    adminApi<Provider[]>('/providers').then(setProviders).catch((e: Error) => setError(e.message))
  }, [])

  useEffect(load, [load])

  const sync = async () => {
    setSyncing(true)
    try {
      await adminApi('/providers/sync', { method: 'POST' })
      load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <>
      <h2>Datenquellen</h2>
      <div className="row-flex">
        <button className="action" onClick={() => void sync()} disabled={syncing}>
          {syncing ? 'Synchronisiert…' : 'Jetzt synchronisieren'}
        </button>
        {error && <span className="error">{error}</span>}
      </div>
      <table>
        <thead>
          <tr>
            <th>Provider</th><th>Status</th><th>Konfiguriert</th><th>Attribution</th>
            <th>Persistenz erlaubt</th><th>Letzter Sync</th><th>Letzter Fehler</th>
          </tr>
        </thead>
        <tbody>
          {providers.map((p) => (
            <tr key={p.key}>
              <td><strong>{p.attribution.displayName}</strong> <span className="muted">({p.key})</span></td>
              <td><span className={`pill ${p.enabled ? 'ok' : ''}`}>{p.enabled ? 'aktiv' : 'deaktiviert'}</span></td>
              <td><span className={`pill ${p.configured ? 'ok' : 'warn'}`}>{p.configured ? 'ja' : 'Credentials fehlen'}</span></td>
              <td>{p.attribution.attributionText}</td>
              <td>{p.attribution.allowsPersistentStorage ? 'ja' : 'nein (nur Cache)'}</td>
              <td>{p.state?.lastSyncAt ? new Date(p.state.lastSyncAt).toLocaleString('de-DE') : '–'}</td>
              <td className="error">{p.state?.lastError ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
