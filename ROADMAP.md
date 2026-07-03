# CarMatch — Roadmap

## v0.1 — Produktkern ✅ (dieses Repo)
Monorepo, API, DB-Schema, DemoProvider, Swipe-UI (Inserate), Quartett-Karten mit Flip,
Favoriten-Garage, Suche/Filter, Standort/PLZ/Radius, Basis-Empfehlungen, i18n de/en,
Admin-Grundlage, Web-Testbarkeit.

## v0.1.5 — Hybrid ✅ (dieses Repo)
Inspirationsmodus (VehicleModel-Swipes), UserTasteProfile mit dokumentierten Gewichten,
Geschmackszusammenfassung + Insights ab 20 Swipes, Hybrid-Scoring (40/25/15/10/5/5),
erklärbare Empfehlungen, Modell-zu-Inserat-Matching, Mode-Selector, Mockup-Kartendesign
(Score-Ringe, zweispaltige Rückseite, CTA-Leiste), Admin: Modelle + Geschmacksprofile.

## v0.2 — Echte Inserate
- mobile.de Search-API produktiv (Partnervertrag, Paginierung, Integrationstests)
- Partner-/Händler-Feeds live, Verfügbarkeitschecks
- BullMQ-Worker mit Redis (Sync, Enrichment, Alerts entkoppelt)
- Geocoding-Anbieter produktiv, Attribution-Anzeige je Quelle finalisieren
- Admin-Accounts statt ADMIN_TOKEN

## v0.3 — Traumwagen-Algorithmus
- Recency-Decay + Session-Kontext im Taste-Profil
- A/B-fähige Scoring-Gewichte (Feature-Flags), Recommendation-Accuracy-Metriken
- „Weniger davon"-Feintuning, Explore/Exploit-Steuerung pro Nutzer

## v0.4 — Kaufhilfe
- lizenzierte Spezifikationsquelle (VEHICLE_SPECS_API_KEY) im Enrichment
- Unterhaltskosten-Schätzung mit echten Versicherungs-/Steuerklassen
- Favoriten-Vergleich als vollwertige Matrix-UI (API `/favorites/compare` existiert)

## v0.5 — Push & Suchagent
- Expo-Push produktiv (EXPO_PUSH_ENABLED), Push-Kampagnen im Admin
- Preisalarm-UI, gespeicherte Suchen mit Alert-Verwaltung in der App

## v0.6 — Monetarisierung
- Lead-Versand an Händler (E-Mail/API) + Abrechnung (monetizationStatus-Flow)
- Premium (Stripe + App-Store-IAP), Paywall für erweiterte Features
- Sponsored-Listings-Buchung, Affiliate-Slots (Finanzierung/Versicherung/Historie)

## v0.7 — Händler
- Dealer-Dashboard (Leads, Inventar-Upload via Partner-Feed, Statistiken)
- Händler-Verifizierung, DealerUser-Rollen

## v1.0 — Produktionsreife
- App Store / Play Store (EAS Build, Apple/Google-Login live)
- Monitoring, Fehlertracking, DSGVO-Prozesse (AVV, Löschkonzept), Payment live
- Deutschland-Start; EU: weitere Sprachen/Währungen, länderspezifische Quellen
