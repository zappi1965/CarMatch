# CarMatch — Deployment-Anleitung

Zwei Test-Umgebungen, die zusammenspielen:
1. **Backend** (API + PostgreSQL) → Railway
2. **Frontend** → GitHub Pages (Browser) und/oder APK/Firebase (Android)

Sobald das Backend läuft und seine URL als Secret hinterlegt ist, bauen die
Frontend-Workflows automatisch gegen die echte API — mit Demo-Inseraten,
Swipe-Algorithmus und Kaufcheck.

---

## 1. Backend auf Railway (≈ 10 Min)

Das Repo ist deploy-ready: `Dockerfile` + `railway.json` liegen im Root.

1. **Projekt anlegen:** [railway.app](https://railway.app) → *New Project* →
   *Deploy from GitHub repo* → `zappi1965/CarMatch` wählen.
   Railway erkennt das `Dockerfile` automatisch.
2. **PostgreSQL hinzufügen:** im Projekt *New* → *Database* → *Add PostgreSQL*.
3. **Environment-Variablen** beim API-Service setzen (Tab *Variables*):

   | Variable | Wert | Zweck |
   |---|---|---|
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Referenz auf die DB (Railway-Syntax) |
   | `NODE_ENV` | `production` | |
   | `DEMO_MODE` | `true` | erlaubt Demo-Daten im Test-Deploy |
   | `ENABLED_PROVIDERS` | `demo` | Demo-Inserate als Quelle |
   | `SEED_ON_BOOT` | `true` | lädt beim Start Demo-Inserate + 20 Modelle |
   | `JWT_SECRET` | *(langer Zufallsstring)* | Pflicht in production |
   | `ADMIN_TOKEN` | *(Zufallsstring)* | Login fürs Admin-Panel |
   | `PORT` | `4100` | (Railway setzt `PORT` oft selbst — dann weglassen) |

4. **Deploy** starten. Beim ersten Start:
   `prisma db push` legt das Schema an → Seed lädt Demo-Daten → Server startet.
   Logs zeigen `Sync: [...]` und `Fahrzeugmodelle: 20 (DEMO)`.
5. **Domain holen:** Service → *Settings* → *Networking* → *Generate Domain*.
   Ergebnis z. B. `https://carmatch-production.up.railway.app`.
6. **Healthcheck testen:** `https://<deine-domain>/health` → `{"ok":true,...}`.

> Nach dem ersten erfolgreichen Seed `SEED_ON_BOOT` wieder auf `false` setzen,
> damit nicht bei jedem Neustart neu geseedet wird.

---

## 2. Frontend gegen das Backend bauen

Sobald die Railway-Domain steht, im GitHub-Repo hinterlegen:

**Settings → Secrets and variables → Actions → New repository secret**
- Name: `EXPO_PUBLIC_API_URL`
- Wert: die Railway-URL (z. B. `https://carmatch-production.up.railway.app`)

Dann neu bauen:

### a) Browser-Version (GitHub Pages)
- **Einmalig:** Settings → *Pages* → *Build and deployment* → Source: **„GitHub Actions"**.
- Actions → **Deploy Web (GitHub Pages)** → *Run workflow*.
- Danach live unter **https://zappi1965.github.io/CarMatch/** — voll funktionsfähig.

### b) Android (APK/AAB + Firebase)
- Actions → **Android Build & Firebase Distribution** → *Run workflow*.
- Neue APK/AAB landen automatisch als **GitHub-Release** (Downloadlink).
- Optional Firebase App Distribution: Secrets `FIREBASE_APP_ID_ANDROID` +
  `FIREBASE_SERVICE_ACCOUNT` setzen → APK geht automatisch an deine Tester.

---

## 3. CORS

Die API erlaubt aktuell alle Origins (`origin: true`) — passt für den Test.
Für Produktion später auf die konkreten Frontend-Domains einschränken
(`apps/api/src/app.ts`).

---

## Kostenrahmen (Test)
- **Railway:** Trial-/Hobby-Guthaben deckt einen kleinen API-Service + PostgreSQL.
- **GitHub Pages & Actions:** für öffentliche Repos kostenlos.
- **Firebase App Distribution:** kostenlos.
