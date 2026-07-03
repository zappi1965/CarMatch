import React, { useCallback, useEffect, useState } from 'react'
import { adminApi } from '../api'

interface Listing {
  id: string
  provider: string
  title: string
  price: number
  city: string | null
  isAvailable: boolean
  imagesAreDemo: boolean
  qualityScore: number
  createdAt: string
  specs: { confidence: number; source: string | null; verified: boolean } | null
}

export function ListingsView() {
  const [listings, setListings] = useState<Listing[]>([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(() => {
    const q = query ? `&query=${encodeURIComponent(query)}` : ''
    adminApi<Listing[]>(`/listings?pageSize=50${q}`).then(setListings).catch((e: Error) => setError(e.message))
  }, [query])

  useEffect(() => {
    const handle = setTimeout(load, 300)
    return () => clearTimeout(handle)
  }, [load])

  const verifySpecs = async (id: string) => {
    await adminApi(`/listings/${id}/specs`, { method: 'PATCH', body: JSON.stringify({ verified: true }) })
    load()
  }

  return (
    <>
      <h2>Inserate</h2>
      <div className="row-flex">
        <input type="text" placeholder="Suche (Titel/Marke)…" value={query} onChange={(e) => setQuery(e.target.value)} style={{ maxWidth: 320 }} />
        {error && <span className="error">{error}</span>}
      </div>
      <table>
        <thead>
          <tr>
            <th>Titel</th><th>Provider</th><th>Preis</th><th>Ort</th><th>Status</th>
            <th>Qualität</th><th>Enrichment</th><th></th>
          </tr>
        </thead>
        <tbody>
          {listings.map((l) => (
            <tr key={l.id}>
              <td>
                {l.title} {l.imagesAreDemo && <span className="pill warn">DEMO</span>}
              </td>
              <td>{l.provider}</td>
              <td>{l.price.toLocaleString('de-DE')} €</td>
              <td>{l.city ?? '–'}</td>
              <td><span className={`pill ${l.isAvailable ? 'ok' : 'err'}`}>{l.isAvailable ? 'verfügbar' : 'offline'}</span></td>
              <td>{Math.round(l.qualityScore * 100)} %</td>
              <td>
                {l.specs ? (
                  <span className={`pill ${l.specs.verified ? 'ok' : l.specs.confidence >= 0.6 ? '' : 'warn'}`}>
                    {l.specs.verified ? 'verifiziert' : `Konfidenz ${Math.round(l.specs.confidence * 100)} % (${l.specs.source ?? '?'})`}
                  </span>
                ) : (
                  <span className="muted">–</span>
                )}
              </td>
              <td>
                {l.specs && !l.specs.verified && (
                  <button className="action secondary" onClick={() => void verifySpecs(l.id)}>
                    Verifizieren
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
