import React, { useState } from 'react'
import { getAdminToken, setAdminToken } from './api'
import { StatsView } from './views/Stats'
import { ProvidersView } from './views/Providers'
import { ListingsView } from './views/Listings'
import { UsersView } from './views/Users'
import { LeadsView } from './views/Leads'
import { ImportLogsView } from './views/ImportLogs'
import { FlagsView } from './views/Flags'

const VIEWS = {
  stats: { label: 'Statistiken', component: StatsView },
  providers: { label: 'Datenquellen', component: ProvidersView },
  listings: { label: 'Inserate', component: ListingsView },
  users: { label: 'Nutzer', component: UsersView },
  leads: { label: 'Leads', component: LeadsView },
  logs: { label: 'Import-Logs', component: ImportLogsView },
  flags: { label: 'Feature-Flags', component: FlagsView },
} as const

type ViewKey = keyof typeof VIEWS

export function App() {
  const [authed, setAuthed] = useState(Boolean(getAdminToken()))
  const [view, setView] = useState<ViewKey>('stats')
  const [tokenInput, setTokenInput] = useState('')

  if (!authed) {
    return (
      <div className="login">
        <h1>
          Car<span style={{ color: 'var(--accent)' }}>Match</span> Admin
        </h1>
        <p className="muted">
          Zugang per ADMIN_TOKEN (ENV des API-Servers) oder Admin-JWT. MVP-Setup — vollwertige
          Admin-Accounts folgen in v0.2.
        </p>
        <input
          type="password"
          placeholder="Admin-Token"
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
        />
        <button
          className="action"
          onClick={() => {
            setAdminToken(tokenInput)
            setAuthed(true)
          }}
        >
          Anmelden
        </button>
      </div>
    )
  }

  const ViewComponent = VIEWS[view].component

  return (
    <div className="layout">
      <nav className="sidebar">
        <h1>
          Car<span>Match</span> Admin
        </h1>
        {(Object.keys(VIEWS) as ViewKey[]).map((key) => (
          <button key={key} className={`navbtn ${view === key ? 'active' : ''}`} onClick={() => setView(key)}>
            {VIEWS[key].label}
          </button>
        ))}
        <button
          className="navbtn"
          style={{ marginTop: 24 }}
          onClick={() => {
            setAdminToken('')
            setAuthed(false)
          }}
        >
          Abmelden
        </button>
      </nav>
      <main className="content">
        <ViewComponent />
      </main>
    </div>
  )
}
