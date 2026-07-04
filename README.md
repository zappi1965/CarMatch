# CarMatch

**Swipe-basierte Auto-Discovery- und Kaufentscheidungs-App** für iOS, Android und Web —
„Tinder für Autos", aber mit echtem Produktkern: Die App lernt den Autogeschmack des
Nutzers (Hybrid aus **Inspirationsmodus** über Fahrzeugtypen und **Kaufmodus** über
echte Inserate) und schlägt passende Fahrzeuge im Umkreis vor.

## Architektur

```
carmatch/
├── apps/
│   ├── api/          Fastify + TypeScript + Prisma (PostgreSQL) — REST-API, Jobs
│   │   ├── prisma/   Schema (User, VehicleListing, VehicleModel, TasteProfile, …), Seed
│   │   └── src/
│   │       ├── providers/       VehicleProviderAdapter: demo | mobile_de | autoscout24* | partner_feed
│   │       ├── recommendation/  Taste-Engine, Hybrid-Scoring (40/25/15/10/5/5), Erklärungen
│   │       ├── scores/          Quartett-Scores + Marktpreis-/Risiko-Kaufhilfe
│   │       ├── enrichment/      VehicleSpecs-Anreicherung (Konfidenz, nie blind übernehmen)
│   │       ├── services/        Vehicle/Swipe/Favorite/Taste/Lead/Notification/Analytics
│   │       ├── routes/          auth, vehicles, swipes, favorites, vehicle-models,
│   │       │                    model-swipes, taste-profile, recommendations, leads,
│   │       │                    saved-searches, settings, discovery, admin
│   │       └── jobs/            Listing-Sync, Preis-Drop, Suchagenten-Push
│   ├── mobile/       Expo (React Native + TypeScript, expo-router) — iOS/Android/Web
│   └── admin/        Vite + React Admin-Panel (Provider, Inserate, Modelle, Profile, Leads)
└── packages/shared/  Gemeinsame Typen + Geo-Logik (Haversine, Bounding-Box)
```

* AutoScout24: bewusst **deaktivierter Placeholder** — es existiert keine öffentlich
buchbare Such-API für Aggregatoren; Anbindung nur nach Partnervertrag (kein Scraping).

### Hybrid-Empfehlungslogik

1. **Inspirationsmodus** — Nutzer swiped generelle Fahrzeugmodelle (`VehicleModel`,
   z. B. „BMW M340i Touring"). Signale → `UserTasteProfile` (Gewichte dokumentiert in
   `src/recommendation/taste.ts`: Modell-Superlike +10, -Like +5, -Dislike −5;
   Inserat-Superlike +15, Favorit +12, Kontaktanfrage +20 …).
2. **Kaufmodus** — echte Inserate werden hybrid gescort:
   **40 %** Geschmackspassung, **25 %** Preis/Standort-Fit, **15 %** Inseratsqualität,
   **10 %** Frische, **5 %** Diversity, **5 %** Deal-Faktor. Sponsored-Boost strikt
   getrennt + in der UI gekennzeichnet. **Filter haben Vorrang** (Filterung vor Scoring).
3. **Erklärbar** — `generateRecommendationExplanation()` liefert i18n-Keys
   („Ähnlich zu Porsche Panamera…"), die die App lokalisiert rendert.
4. Ab **20 Modell-Swipes**: Geschmackszusammenfassung + CTA „Passende echte Angebote finden".

## Schnellstart (lokal, Demo-Modus)

Voraussetzungen: Node 20+, Docker (für PostgreSQL).

```bash
cd carmatch
docker compose up -d                  # PostgreSQL + Redis
npm install
cp .env.example apps/api/.env         # Defaults reichen für Demo

npm run -w apps/api migrate           # Prisma-Migration
npm run api:seed                      # Demo-Inserate + 20 Fahrzeugmodelle + Matches
npm run api:dev                       # API auf :4100

# App (iOS/Android/Web) — eigenes Terminal:
cd apps/mobile && npm install && npm run web    # oder: npm start → Expo Go

# Admin-Panel — eigenes Terminal:
npm run admin:dev                     # :5180, Login mit ADMIN_TOKEN aus apps/api/.env
```

Tests & Typecheck:

```bash
npm run api:test    # 79 Vitest-Tests (Scoring, Taste, Matching, Normalisierung, Geo, Preise)
npm run typecheck
```

**Web-Bedienung:** Pfeil rechts = Like, links = Dislike, hoch = Super-Like,
Enter = Details, Escape = Moduswahl.

## Benötigte echte Credentials (per ENV, siehe `.env.example`)

| Variable | Zweck | Status |
|---|---|---|
| `MOBILE_DE_API_USERNAME/PASSWORD` | mobile.de Search-API (Partnervertrag) | Adapter fertig, wartet auf Zugang |
| `PARTNER_FEED_URL` | Händler-/Partner-JSON-Feed | Adapter fertig |
| `AUTOSCOUT_API_KEY` | AutoScout24 | Placeholder, bewusst deaktiviert |
| `VEHICLE_SPECS_API_KEY` | lizenzierte technische Daten | Enrichment-Interface fertig |
| `MAPS_GEOCODING_API_KEY` | Geocoding-Anbieter | Fallback: lokale PLZ-Tabelle (DE) |
| `GOOGLE_OAUTH_CLIENT_ID` / `APPLE_CLIENT_ID` | Social Login | Google-Verify implementiert, Apple vorbereitet |
| `EXPO_PUSH_ENABLED` | Push-Versand (Expo) | Provider-Abstraktion fertig |
| `STRIPE_*` | Premium-Payments | nur vorbereitet (v0.6) |

## Was ist fertig / was ist vorbereitet

**Fertig (MVP + Hybrid):** Swipe-Deck (Inserate **und** Fahrzeugmodelle), Quartett-Karten
mit Flip (Mockup-Design: Fakten-Zeile, Chips, Score-Ringe 0–10, zweispaltige Rückseite,
Marktpreis-Zeile, CTA-Leiste), Moduswahl, Taste-Profil + Insights + Summary, hybride
Empfehlungen mit Erklärungen, Favoriten-Garage, Suche/Filter/Sortierung, Standort
(GPS + PLZ/Ort + Radius), Auth (E-Mail, Gast → Upgrade), i18n de/en, Kaufhilfe
(Marktpreis, Risiko-Hinweise, 10 Quartett-Scores mit Konfidenz), Leads-Tracking,
Admin-Panel (9 Bereiche), Import-/Sync-Jobs, Preis-Drop- & Suchagenten-Push-Logik.

**Vorbereitet, nicht produktiv:** mobile.de-Sync (Credentials), Apple-Login (JWKS),
Push-Versand (Opt-in-UI fertig, Versand hinter `EXPO_PUSH_ENABLED`), Premium/Stripe,
Sponsored-Listings (Modell + getrennter Boost fertig, kein Buchungs-Flow),
Händler-Self-Service (Datenmodell fertig), BullMQ-Worker (läuft in-process ohne Redis).

## Rechtliches / Datenquellen

- **Keine Scraper**, keine Umgehung von Bot-Schutz oder Nutzungsbedingungen.
- Jede Quelle: eigener Adapter, per `ENABLED_PROVIDERS` abschaltbar, eigene Attribution
  (in der UI ausgewiesen), `allowsPersistentStorage`-Flag pro Quelle.
- Demo-Daten sind überall als **DEMO** markiert (Provider, Badge in der App, Admin);
  der Demo-Provider ist in `NODE_ENV=production` gesperrt.
- DSGVO: Gastmodus datensparsam, Konto + Daten löschbar (`DELETE /auth/me`),
  Personalisierung abschaltbar, Empfehlungs-/Geschmacksprofil zurücksetzbar,
  Push nur mit Opt-in pro Kategorie, Analytics ohne unnötige personenbezogene Daten.

## Repo-Hinweis

Dieses Verzeichnis ist als eigenständiges Repo geschnitten. Extraktion:

```bash
git subtree split -P carmatch -b carmatch-standalone
# neues Repo anlegen, dann:
git push git@github.com:<owner>/carmatch.git carmatch-standalone:main
```

## Erweiterungspaket (v0.2)

| Feature | Kern | Wo |
|---|---|---|
| **Monatskosten** | Vollkosten €/Monat (Wertverlust, Sprit, Versicherung, Steuer, Wartung) mit dokumentierten Heuristiken + Monatsbudget-Filter | Karte, Detail, Filter |
| **Duell-Modus** | Paarvergleich zweier Modelle — Sieger +6 / Verlierer −2 ins Taste-Profil | „⚔ Duell" im Inspirationsmodus |
| **Markttrend & Sparziele** | Preistrend aus eigener PriceHistory, Saison-Hinweise, Sparziel mit Erreichbarkeits-Prognose | Detail, Garage |
| **Gemeinsame Suche** | Gruppe per Einladungscode, Favoriten-Schnittmenge = Match | Garage |
| **Besitzer-Wissen** | Bekannte Schwachstellen je Baureihe (nicht verifiziert) + Besitzer-Reviews | Modell-Karte/-Seite |
| **C2B-Verkauf** | „Was ist mein Auto wert?" aus Vergleichsinseraten + Ankauf-Lead (SellRequest) | Profil → Verkaufen, Admin |
| **Mein Auto** | Besitzphase: aktueller Marktwert, Wertentwicklung, TÜV-Hinweis | Garage |
| **EV-Alltagscheck** | Pendelstrecke + Heimladen → passt das E-Auto? (konservativ: 80 % WLTP × 80 % Ladung) | Detail bei E-Autos |

**Demo-Fotos:** Fahrzeugmodelle und passende Demo-Inserate nutzen frei verfügbare
Fotos von **Wikimedia Commons** (via Wikipedia-Seitenbild, Hotlinking erlaubt) mit
Attribution auf der Karte und `infoUrl` als Quell-/Lizenznachweis. Für Produktion:
Autor + Lizenz je Datei über die Commons-API auflösen (TODO in `modelImages.ts`).
Technische Richtwerte der Modelle sind öffentlich bekannte Daten, `source: DEMO`.

## App-Builds (APK / AAB / IPA)

Builds laufen über [EAS Build](https://docs.expo.dev/build/introduction/) —
Konfiguration liegt in `apps/mobile/eas.json`, Icons/Splash in `apps/mobile/assets/`.

Einmalig:

```bash
npm i -g eas-cli
cd apps/mobile
eas login                # Expo-Konto
eas init                 # verknüpft das Projekt (schreibt extra.eas.projectId)
```

Dann:

```bash
npm run build:android:apk   # APK  (Profil "preview" — direkt installierbar)
npm run build:android:aab   # AAB  (Profil "production" — Play Store)
npm run build:ios           # IPA  (production — braucht Apple Developer Account)
npm run submit:android      # Upload in den Play-Store-Track "internal"
npm run submit:ios          # Upload zu App Store Connect
```

Wichtig:
- **API-URL**: in `eas.json` pro Profil via `EXPO_PUBLIC_API_URL` gesetzt —
  vor dem ersten echten Build auf eure Backend-URL ändern
  (`https://api.carmatch.example` ist Platzhalter).
- **iOS**: Apple-Team/Zertifikate verwaltet EAS automatisch nach `eas credentials`
  bzw. beim ersten Build-Prompt. `ITSAppUsesNonExemptEncryption=false` ist gesetzt.
- **Android**: Keystore erzeugt/verwaltet EAS automatisch. `versionCode`
  zählt bei `production` automatisch hoch (`autoIncrement`).
- Lokale Builds ohne EAS-Cloud: `npx expo run:android --variant release`
  (benötigt Android SDK) bzw. `npx expo run:ios --configuration Release` (macOS/Xcode).

Roadmap: siehe [ROADMAP.md](./ROADMAP.md).
