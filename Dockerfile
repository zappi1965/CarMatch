# CarMatch API — Produktions-Image (Railway/Fly/Render)
# Kontext: Repo-Root (Monorepo: apps/api + packages/shared)
FROM node:20-slim AS base
RUN apt-get update -qq && apt-get install -y -qq openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Nur API-relevante Workspaces installieren
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN npm install -w apps/api -w packages/shared --no-audit --no-fund

COPY packages/shared packages/shared
COPY apps/api apps/api
COPY tsconfig.base.json ./

WORKDIR /app/apps/api
RUN npx prisma generate

ENV NODE_ENV=production
EXPOSE 4100

# Schema beim Start in die DB syncen (db push — kein Migrations-Ordner nötig,
# ideal fürs Test-/Staging-Deploy). SEED_ON_BOOT=true lädt Demo-Daten.
# Für echte Produktion später auf `prisma migrate deploy` + Migrations umstellen.
CMD ["sh", "-c", "npx prisma db push --skip-generate --accept-data-loss && if [ \"$SEED_ON_BOOT\" = \"true\" ]; then npm run seed || true; fi && npm run start"]
