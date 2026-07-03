import React, { useCallback, useEffect, useState } from 'react'
import { adminApi } from '../api'

interface AdminVehicleModel {
  id: string
  make: string
  model: string
  variant: string | null
  segment: string | null
  source: string
  imagesAreDemo: boolean
  likes: number
  dislikes: number
  listingMatches: number
}

/** Hybrid: Fahrzeugmodelle mit Like/Dislike-Bilanz und Inserats-Matches. */
export function VehicleModelsView() {
  const [models, setModels] = useState<AdminVehicleModel[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    adminApi<AdminVehicleModel[]>('/vehicle-models').then(setModels).catch((e: Error) => setError(e.message))
  }, [])

  useEffect(load, [load])

  const rebuild = async () => {
    setBusy(true)
    try {
      await adminApi('/vehicle-models/rebuild-matches', { method: 'POST' })
      load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <h2>Fahrzeugmodelle (Inspirationsmodus)</h2>
      <div className="row-flex">
        <button className="action" onClick={() => void rebuild()} disabled={busy}>
          {busy ? 'Matcht…' : 'Modell-Inserat-Matches neu berechnen'}
        </button>
        {error && <span className="error">{error}</span>}
      </div>
      <table>
        <thead>
          <tr><th>Modell</th><th>Segment</th><th>Quelle</th><th>Likes</th><th>Dislikes</th><th>Inserats-Matches</th></tr>
        </thead>
        <tbody>
          {models.map((m) => (
            <tr key={m.id}>
              <td>
                <strong>{m.make} {m.model}</strong> {m.variant && <span className="muted">{m.variant}</span>}
              </td>
              <td>{m.segment ?? '–'}</td>
              <td>
                <span className={`pill ${m.source === 'DEMO' ? 'warn' : 'ok'}`}>{m.source}</span>
              </td>
              <td style={{ color: 'var(--like)' }}>{m.likes}</td>
              <td style={{ color: '#ff6b7d' }}>{m.dislikes}</td>
              <td>{m.listingMatches}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
