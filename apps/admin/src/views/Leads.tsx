import React, { useEffect, useState } from 'react'
import { adminApi } from '../api'

interface SellRequest {
  id: string
  make: string
  model: string
  year: number | null
  mileage: number | null
  estimatedValue: number | null
  status: string
  createdAt: string
}

interface Lead {
  id: string
  type: string
  status: string
  monetizationStatus: string
  createdAt: string
  listing: { title: string; provider: string }
  dealer: { name: string } | null
}

export function LeadsView() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [sellRequests, setSellRequests] = useState<SellRequest[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    adminApi<Lead[]>('/leads').then(setLeads).catch((e: Error) => setError(e.message))
    adminApi<SellRequest[]>('/sell-requests').then(setSellRequests).catch(() => {})
  }, [])

  return (
    <>
      <h2>Händler-Leads</h2>
      <p className="muted">
        Grundlage der Monetarisierung: jede Anfrage wird mit monetizationStatus getrackt und ist
        später abrechenbar (v0.6).
      </p>
      {error && <p className="error">{error}</p>}
      <table>
        <thead>
          <tr><th>Fahrzeug</th><th>Händler</th><th>Typ</th><th>Status</th><th>Abrechnung</th><th>Quelle</th><th>Datum</th></tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr key={l.id}>
              <td>{l.listing.title}</td>
              <td>{l.dealer?.name ?? '–'}</td>
              <td><span className="pill">{l.type}</span></td>
              <td><span className={`pill ${l.status === 'NEW' ? 'warn' : 'ok'}`}>{l.status}</span></td>
              <td>{l.monetizationStatus}</td>
              <td>{l.listing.provider}</td>
              <td>{new Date(l.createdAt).toLocaleString('de-DE')}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: 32 }}>Verkaufsanfragen (C2B-Ankauf)</h2>
      <table>
        <thead>
          <tr><th>Fahrzeug</th><th>Baujahr</th><th>km</th><th>Schätzwert</th><th>Status</th><th>Datum</th></tr>
        </thead>
        <tbody>
          {sellRequests.map((r) => (
            <tr key={r.id}>
              <td>{r.make} {r.model}</td>
              <td>{r.year ?? '–'}</td>
              <td>{r.mileage?.toLocaleString('de-DE') ?? '–'}</td>
              <td>{r.estimatedValue != null ? `${r.estimatedValue.toLocaleString('de-DE')} €` : '–'}</td>
              <td><span className={`pill ${r.status === 'NEW' ? 'warn' : 'ok'}`}>{r.status}</span></td>
              <td>{new Date(r.createdAt).toLocaleString('de-DE')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
