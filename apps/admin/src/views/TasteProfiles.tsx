import React, { useEffect, useState } from 'react'
import { adminApi } from '../api'

interface AdminTasteProfile {
  userId: string
  signalCount: number
  confidence: number
  summaryText: string | null
  topMakes: string[]
  lastUpdatedAt: string
}

/** Hybrid: Geschmacksprofile — welche Profile entstehen, wie sicher sind sie. */
export function TasteProfilesView() {
  const [profiles, setProfiles] = useState<AdminTasteProfile[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    adminApi<AdminTasteProfile[]>('/taste-profiles').then(setProfiles).catch((e: Error) => setError(e.message))
  }, [])

  return (
    <>
      <h2>Geschmacksprofile</h2>
      <p className="muted">
        Entstehen aus Modell-Swipes (Inspirationsmodus) + Inseratsverhalten. Debugging einzelner
        Empfehlungen: Bereich „Statistiken" → Recommendation-Debug-API.
      </p>
      {error && <p className="error">{error}</p>}
      <table>
        <thead>
          <tr><th>Nutzer</th><th>Signale</th><th>Konfidenz</th><th>Top-Marken</th><th>Zusammenfassung</th><th>Aktualisiert</th></tr>
        </thead>
        <tbody>
          {profiles.map((p) => (
            <tr key={p.userId}>
              <td className="muted">{p.userId.slice(0, 10)}…</td>
              <td>{p.signalCount}</td>
              <td>
                <span className={`pill ${p.confidence >= 0.5 ? 'ok' : 'warn'}`}>
                  {Math.round(p.confidence * 100)} %
                </span>
              </td>
              <td>{p.topMakes.join(', ') || '–'}</td>
              <td>{p.summaryText ?? <span className="muted">noch kein Profil</span>}</td>
              <td>{new Date(p.lastUpdatedAt).toLocaleString('de-DE')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
