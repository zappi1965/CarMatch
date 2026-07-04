-- CarMatch Kaufhilfe-Erweiterungen: Monatsbudget, Duell, Kauf-Timing,
-- Shared Search, Modellwissen, Verkäufer-Lead, Owned Garage, EV-Check.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "monthlyBudgetEur" INTEGER;

CREATE TABLE IF NOT EXISTS "DuelSignal" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "winnerListingId" TEXT NOT NULL,
  "loserListingId" TEXT NOT NULL,
  "signalType" TEXT NOT NULL DEFAULT 'duel_win',
  "weight" DOUBLE PRECISION NOT NULL DEFAULT 3.5,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "DuelSignal_userId_createdAt_idx" ON "DuelSignal"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "DuelSignal_winnerListingId_idx" ON "DuelSignal"("winnerListingId");
CREATE INDEX IF NOT EXISTS "DuelSignal_loserListingId_idx" ON "DuelSignal"("loserListingId");

CREATE TABLE IF NOT EXISTS "VehiclePriceHistory" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "listingId" TEXT,
  "modelId" TEXT,
  "price" INTEGER NOT NULL,
  "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "source" TEXT NOT NULL DEFAULT 'DEMO',
  "mileage" INTEGER,
  "location" TEXT
);
CREATE INDEX IF NOT EXISTS "VehiclePriceHistory_listingId_date_idx" ON "VehiclePriceHistory"("listingId", "date");
CREATE INDEX IF NOT EXISTS "VehiclePriceHistory_modelId_date_idx" ON "VehiclePriceHistory"("modelId", "date");

CREATE TABLE IF NOT EXISTS "VehicleModelPriceStats" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "modelId" TEXT NOT NULL UNIQUE,
  "averagePrice30d" INTEGER,
  "averagePrice90d" INTEGER,
  "averagePrice365d" INTEGER,
  "currentVsYearAveragePercent" DOUBLE PRECISION,
  "trendDirection" TEXT NOT NULL DEFAULT 'stable',
  "seasonalHint" TEXT,
  "bestBuyingMonthsJson" JSONB,
  "lastCalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "SharedSearch" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "ownerUserId" TEXT NOT NULL,
  "inviteCode" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "SharedSearchMember" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sharedSearchId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'member',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("sharedSearchId", "userId")
);

CREATE TABLE IF NOT EXISTS "SharedVehicleSignal" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sharedSearchId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "signalType" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("sharedSearchId", "userId", "listingId")
);
CREATE INDEX IF NOT EXISTS "SharedVehicleSignal_sharedSearchId_listingId_idx" ON "SharedVehicleSignal"("sharedSearchId", "listingId");

CREATE TABLE IF NOT EXISTS "VehicleModelKnowledge" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "modelId" TEXT NOT NULL UNIQUE,
  "summary" TEXT NOT NULL,
  "commonIssuesJson" JSONB,
  "maintenanceNotesJson" JSONB,
  "ownerSentiment" TEXT,
  "reliabilityScore" INTEGER,
  "comfortScore" INTEGER,
  "sportinessScore" INTEGER,
  "familyScore" INTEGER,
  "buyingAdvice" TEXT,
  "sourcesJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "SellerLead" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT,
  "make" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "mileage" INTEGER NOT NULL,
  "fuelType" "FuelType",
  "condition" TEXT NOT NULL,
  "estimatedValueMin" INTEGER NOT NULL,
  "estimatedValueMax" INTEGER NOT NULL,
  "contactName" TEXT,
  "contactEmail" TEXT,
  "contactPhone" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "OwnedVehicle" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "listingId" TEXT,
  "make" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "year" INTEGER,
  "purchaseDate" TIMESTAMP(3),
  "purchasePrice" INTEGER,
  "mileageAtPurchase" INTEGER,
  "currentMileage" INTEGER,
  "tuvDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "OwnedVehicle_userId_createdAt_idx" ON "OwnedVehicle"("userId", "createdAt");

CREATE TABLE IF NOT EXISTS "GarageEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "ownedVehicleId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "cost" INTEGER,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "EvLifestyleCheck" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT,
  "dailyCommuteKm" INTEGER NOT NULL,
  "weeklyKm" INTEGER NOT NULL,
  "longestRegularKm" INTEGER,
  "homeCharging" BOOLEAN NOT NULL,
  "workCharging" BOOLEAN NOT NULL,
  "housingType" TEXT NOT NULL,
  "preferredListingId" TEXT,
  "resultJson" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "DuelSignal" ADD CONSTRAINT "DuelSignal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DuelSignal" ADD CONSTRAINT "DuelSignal_winnerListingId_fkey" FOREIGN KEY ("winnerListingId") REFERENCES "VehicleListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DuelSignal" ADD CONSTRAINT "DuelSignal_loserListingId_fkey" FOREIGN KEY ("loserListingId") REFERENCES "VehicleListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
