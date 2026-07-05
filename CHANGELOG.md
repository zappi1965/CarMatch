# Changelog

## v0.2.0 — Release-Kandidat (Firebase-Test)

### Produkt
- **Hybrid-Discovery**: Inspirationsmodus (20 Fahrzeugmodelle, Wikimedia-Fotos mit
  Attribution) + Kaufmodus (Inserate), lernendes Geschmacksprofil mit Summary & Insights
- **Quartett-Karten** nach Mockup: Fakten-Zeile, Chips, Flip-Rückseite mit
  zweispaltiger Datentabelle, Score-Ringen (0–10) und Marktpreis-Zeile
- **Kaufhilfe**: Marktpreis-Einschätzung, Risiko-Hinweise, 10 Scores mit Konfidenz,
  Monatskosten-Schätzung inkl. Monatsbudget-Filter, regelbasierter **Kaufcheck**
  (Checkliste, versteckte Kosten, Verhandlung, Finanzierungsrechner)
- **Duell-Modus** (Paarvergleich), **Markttrend + Sparziele**, **Gemeinsame Suche**
  (Einladungscode, Favoriten-Matches), **Mein Auto** (Marktwert, TÜV-Hinweis),
  **C2B-Verkaufsbewertung**, **EV-Alltagscheck**, Besitzer-Reviews & bekannte
  Schwachstellen je Baureihe
- i18n Deutsch/Englisch, Web-Tastatursteuerung, Gastmodus → Konto-Upgrade

### Technik
- Fastify + Prisma/PostgreSQL-API mit Provider-Adaptern (Demo / mobile.de vorbereitet /
  Partner-Feed / AutoScout24-Placeholder), Hybrid-Scoring 40/25/15/10/5/5,
  erklärbare Empfehlungen, Sync-/Preisalarm-/Suchagenten-Jobs
- Expo-App (iOS/Android/Web), Vite-Admin-Panel (9 Bereiche)
- **CI** (Tests, Typecheck, Admin-Build) + **Android-Build-Workflow** (APK/AAB ohne
  EAS, optionaler Upload zu Firebase App Distribution)
- **Railway-Deploy** (Dockerfile, Healthcheck, Migrations beim Start)
- 79 Vitest-Tests, `tsc --noEmit` sauber für API und App

### Bekannte Einschränkungen
- Inserate/Modelle sind **Demo-Daten** (klar markiert); mobile.de wartet auf
  Partner-Credentials
- iOS-Build (IPA) erfordert Apple-Developer-Zertifikate
- Push-Versand hinter `EXPO_PUSH_ENABLED` (Opt-in-UI fertig)
- Premium/Payments nur vorbereitet (bewusst, siehe ROADMAP)
