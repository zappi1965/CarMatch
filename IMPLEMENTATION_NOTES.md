# CarMatch Kaufhilfe-Erweiterung — Umsetzung

## Umgesetzt

- Monatskosten-Service (`calculateMonthlyOwnershipCost`) mit Wertverlust, Versicherung, Steuer, Kraftstoff/Strom, Wartung und Kapitalbindung.
- Monatsbudget im User-Modell (`monthlyBudgetEur`) und Budget-Fit-Badge (`IN_BUDGET`, `SLIGHTLY_OVER`, `WELL_OVER`).
- Empfehlungsscoring bevorzugt Fahrzeuge, deren geschätzte Monatskosten zum Budget passen.
- Fahrzeugkarten zeigen prominent `ca. X €/Monat`; die Rückseite zeigt die Kostenaufteilung.
- Detailseite zeigt Monatskosten, Kauf-Timing und Modellwissen.
- Duell-Modus mit API `/duels/next`, `/duels/vote`, `/duels/skip` und Mobile-Tab `Duell`.
- Duel-Signale werden zusätzlich als starke SUPERLIKE/DISLIKE-Signale in das bestehende Profil eingespeist.
- Kauf-Timing-Service aus künstlicher `VehiclePriceHistory` mit Trend, Jahresschnitt, saisonalem Hinweis und Warteempfehlung.
- Shared Search / gemeinsame Garage als Demo mit Invite-Code und Signals API.
- VehicleModelKnowledge als Modellwissen mit typischen Schwachstellen, Wartungsnotizen, Owner-Sentiment und Kaufberatung.
- Verkäufer-Seite `/seller/estimate` plus Mobile-Tab `Verkaufen`.
- Persönliche Garage nach Kauf mit OwnedVehicle/GarageEvent und Mobile-Tab `Garage+`.
- E-Auto-Alltagscheck `/ev-check` plus Mobile-Tab `E-Check`.
- Neue Demo-Fahrzeuge: Porsche Panamera, Porsche 911, BMW M5 CS, BMW 330d Coupé, Audi RS5, Audi A5, Mercedes-AMG C 63, Volvo XC60, Kia EV6.
- Demo-Seed erzeugt künstliche PriceHistory und Modellwissen.
- Root Workspace enthält jetzt auch `apps/mobile`, damit das Monorepo konsistenter installierbar ist.

## Wichtige Dateien

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/20260704134500_kaufhilfe_features/migration.sql`
- `apps/api/prisma/seed.ts`
- `apps/api/src/services/kaufhilfe/monthlyCost.ts`
- `apps/api/src/services/kaufhilfe/marketTiming.ts`
- `apps/api/src/services/kaufhilfe/evLifestyle.ts`
- `apps/api/src/routes/duels.ts`
- `apps/api/src/routes/budget.ts`
- `apps/api/src/routes/marketTiming.ts`
- `apps/api/src/routes/sharedSearches.ts`
- `apps/api/src/routes/seller.ts`
- `apps/api/src/routes/ownedGarage.ts`
- `apps/api/src/routes/evCheck.ts`
- `apps/api/src/services/recommendationService.ts`
- `apps/api/src/services/vehicleService.ts`
- `apps/mobile/src/components/VehicleCard.tsx`
- `apps/mobile/app/vehicle/[id].tsx`
- `apps/mobile/app/(tabs)/duel.tsx`
- `apps/mobile/app/(tabs)/budget.tsx`
- `apps/mobile/app/(tabs)/shared.tsx`
- `apps/mobile/app/(tabs)/sell.tsx`
- `apps/mobile/app/(tabs)/owned.tsx`
- `apps/mobile/app/(tabs)/ev.tsx`
- `apps/mobile/app/(tabs)/models.tsx`
- `packages/shared/src/types/ownership.ts`
- `package.json`, `package-lock.json`

## Annahmen

- Monatskosten sind Demo-Schätzwerte und bewusst als austauschbare Service-Schicht gebaut.
- Versicherungs-/Steuer-/Wartungswerte sind Näherungen, keine verbindliche Beratung.
- Bilder bleiben Demo-Platzhalter und werden als Demo markiert; `rawData.imageSource` enthält die Demo-Attribution.
- Shared Search ist MVP-fähig per Invite-Code; echte Invite-Links/Realtime-Sync sind Folgeausbau.
- Händlervermittlung ist nur als Lead-Struktur vorbereitet.

## Validierung

`npm install --package-lock-only` lief einmal erfolgreich, nachdem das alte Lockfile-Problem behoben wurde. Ein vollständiges `npm install` konnte in dieser Umgebung nicht abgeschlossen werden, weil Prisma beim Postinstall die Query-Engine von `binaries.prisma.sh` laden wollte und die Umgebung keinen Netz-/DNS-Zugriff hatte. Dadurch konnte `prisma generate`, `migrate` und der finale Typecheck nicht sauber validiert werden.

Lokal mit Internet sollte als nächstes laufen:

```bash
npm install
npm run -w apps/api generate
npm run -w apps/api migrate
npm run api:seed
npm run api:test
npm run typecheck
cd apps/mobile && npm run web
```

## Nächste API-seitige Schritte

1. Prisma-Migration mit echter Datenbank ausführen und Prisma Client generieren.
2. Echte Bild-/Datenquelle entscheiden: Händler-Feed zuerst ist realistischer als sofort mobile.de Partner-API.
3. Monatskosten mit echten Versicherungs-, Steuer- und Finanzierungsdaten ersetzen.
4. Kauf-Timing regelmäßig per Job auf Modellebene aggregieren.
5. Shared Search um echte Invite-Links, Realtime-Status und Rollenrechte erweitern.
6. SellerLead mit Händler-C2B-Pipeline verbinden.

## Update 2: Kaufassistent + großer Demo-Modellkatalog

Ergänzt wurden zusätzliche MVP-/Demo-Funktionen, die CarMatch stärker zur Kaufentscheidungs-App machen:

- Kaufassistent-API unter `/buying-assistant`:
  - `/listings/:id`: Verhandlungsassistent, Besichtigungs-Checkliste, Hidden-Cost-Alerts, Warum-günstig-Erklärung, Händler-/Inseratsvertrauen und Finanzierungs-Demo.
  - `/compare`: Auto-gegen-Auto-Vergleich mit Vernunft-, Emotions- und Kompromisssieger.
  - `/finance`: neutrale Finanzierungssimulation ohne Vermittlung.
  - `/dream-alternatives`: Dream-Garage-Alternativen nach Monatsbudget.
  - `/shared/:id/compromise`: Partner-Kompromiss-Score für gemeinsame Suche.
  - `/owned/:id/service-plan`: Nach-dem-Kauf-Serviceplan für eigene Garage.
- Neue Mobile-Seite `Assistent` mit Kaufassistent, Hidden Costs, Checkliste, Vergleich und Dream-Garage-Alternativen.
- Fahrzeugmodell-Katalog auf ca. 475 Demo-Modelle erweitert.
- Modellwissen wird beim Seed für alle Modelle generisch ergänzt, wenn kein kuratiertes Wissen vorhanden ist.
- `/vehicle-models/discover` erlaubt jetzt bis zu 500 Modelle; die Modellwissen-Seite lädt bis zu 500 Modelle.

Wichtige Datenannahme: Der große Katalog nutzt realistische Modellnamen und grobe Demo-Richtwerte, aber keine verifizierten offiziellen Herstellerdaten. Bilder bleiben Demo-/Platzhalter-URLs mit klarer Demo-Kennzeichnung, damit keine unklaren Bildrechte in das Repo kopiert werden. Für Produktion sollte dieser Katalog durch lizenzierte Datenquellen, Partnerfeeds oder redaktionell geprüfte Herstellerdaten ersetzt werden.
