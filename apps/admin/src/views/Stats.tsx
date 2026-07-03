import React, { useEffect, useState } from 'react'
import { adminApi } from '../api'

interface Stats {
  dau: number
  mau: number
  totalUsers: number
  totalListings: number
  swipes: number
  likes: number
  superlikes: number
  dislikes: number
  favorites: number
  detailOpens: number
  moreOpens: number
  leads: number
  savedSearches: number
  pushOptIns: number
  leadConversionRate: number
}

const LABELS: Record<keyof Stats, string> = {
  dau: 'DAU', mau: 'MAU', totalUsers: 'Nutzer gesamt', totalListings: 'Aktive Inserate',
  swipes: 'Swipes', likes: 'Likes', superlikes: 'Super-Likes', dislikes: 'Dislikes',
  favorites: 'Favoriten', detailOpens: 'Detail-Öffnungen', moreOpens: '„Mehr"-Öffnungen',
  leads: 'Leads', savedSearches: 'Gespeicherte Suchen', pushOptIns: 'Push-Opt-ins',
  leadConversionRate: 'Lead-Conversion (%)',
}

export function StatsView() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    adminApi<Stats>('/stats').then(setStats).catch((e: Error) => setError(e.message))
  }, [])

  if (error) return <p className="error">Fehler: {error}</p>
  if (!stats) return <p className="muted">Lade…</p>

  return (
    <>
      <h2>Business-Kennzahlen</h2>
      <div className="cards">
        {(Object.keys(LABELS) as Array<keyof Stats>).map((key) => (
          <div className="stat" key={key}>
            <div className="num">{stats[key]}</div>
            <div className="lbl">{LABELS[key]}</div>
          </div>
        ))}
      </div>
    </>
  )
}
