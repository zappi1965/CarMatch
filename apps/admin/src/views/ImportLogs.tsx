import React, { useEffect, useState } from 'react'
import { adminApi } from '../api'

interface ImportLog {
  id: string
  provider: string
  status: string
  imported: number
  updated: number
  deactivated: number
  errorText: string | null
  startedAt: string
  finishedAt: string | null
}

export function ImportLogsView() {
  const [logs, setLogs] = useState<ImportLog[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    adminApi<ImportLog[]>('/import-logs').then(setLogs).catch((e: Error) => setError(e.message))
  }, [])

  return (
    <>
      <h2>Import-Logs</h2>
      {error && <p className="error">{error}</p>}
      <table>
        <thead>
          <tr><th>Provider</th><th>Status</th><th>Neu</th><th>Aktualisiert</th><th>Deaktiviert</th><th>Start</th><th>Fehler</th></tr>
        </thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id}>
              <td>{l.provider}</td>
              <td><span className={`pill ${l.status === 'ok' ? 'ok' : l.status === 'error' ? 'err' : 'warn'}`}>{l.status}</span></td>
              <td>{l.imported}</td>
              <td>{l.updated}</td>
              <td>{l.deactivated}</td>
              <td>{new Date(l.startedAt).toLocaleString('de-DE')}</td>
              <td className="error">{l.errorText ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
