-- ============================================================
-- Migración: Módulo PLD — Prevención de Lavado de Dinero
-- CNBV/CONDUSEF Compliance — Escalafin SaaS
-- Fecha: 2026-06-27
-- ============================================================

-- 1. Añadir valor BLOCKED_PLD al enum ClientStatus
ALTER TYPE "ClientStatus" ADD VALUE IF NOT EXISTS 'BLOCKED_PLD';

-- 2. Enums auxiliares del módulo PLD
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PldScreeningSource') THEN
        CREATE TYPE "PldScreeningSource" AS ENUM ('OFAC_SDN', 'UN_CONSOLIDATED', 'INTERNAL');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PldScreeningStatus') THEN
        CREATE TYPE "PldScreeningStatus" AS ENUM ('PENDING', 'CLEAR', 'MATCH_FOUND', 'ERROR');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PldAlertType') THEN
        CREATE TYPE "PldAlertType" AS ENUM (
            'THRESHOLD_PAYMENT',
            'EARLY_PAYOFF',
            'STRUCTURING_SUSPICION',
            'CLIENT_BLOCKED'
        );
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PldAlertStatus') THEN
        CREATE TYPE "PldAlertStatus" AS ENUM (
            'OPEN',
            'UNDER_REVIEW',
            'REPORTED_SITI',
            'DISMISSED',
            'CLOSED'
        );
    END IF;
END$$;

-- 3. Tabla pld_screening_results
-- Guarda cada consulta a OFAC/ONU como evidencia inmutable
CREATE TABLE IF NOT EXISTS "pld_screening_results" (
    "id"            TEXT        NOT NULL,
    "clientId"      TEXT        NOT NULL,
    "tenantId"      TEXT,
    -- Nombre completo consultado en la lista
    "queriedName"   TEXT        NOT NULL,
    -- Fuente de la lista consultada
    "source"        "PldScreeningSource" NOT NULL,
    -- Si hubo coincidencia positiva
    "isMatch"       BOOLEAN     NOT NULL DEFAULT FALSE,
    -- Puntuación de similitud 0.0 – 100.0
    "matchScore"    DOUBLE PRECISION DEFAULT 0,
    -- JSON completo de la respuesta de la API (evidencia)
    "rawResponse"   TEXT        NOT NULL,
    -- Estado del proceso de screening
    "status"        "PldScreeningStatus" NOT NULL DEFAULT 'PENDING',
    -- ID del usuario o sistema que disparó el screening
    "triggeredBy"   TEXT,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pld_screening_results_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "pld_screening_results_clientId_idx"  ON "pld_screening_results"("clientId");
CREATE INDEX IF NOT EXISTS "pld_screening_results_isMatch_idx"   ON "pld_screening_results"("isMatch");
CREATE INDEX IF NOT EXISTS "pld_screening_results_status_idx"    ON "pld_screening_results"("status");
CREATE INDEX IF NOT EXISTS "pld_screening_results_tenantId_idx"  ON "pld_screening_results"("tenantId");

ALTER TABLE "pld_screening_results"
    ADD CONSTRAINT "pld_screening_results_clientId_fkey"
        FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "pld_screening_results_tenantId_fkey"
        FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 4. Tabla pld_alerts
-- Registra operaciones inusuales detectadas por el motor de alertas
-- Los registros son INMUTABLES (no se borran; solo cambia su estado)
CREATE TABLE IF NOT EXISTS "pld_alerts" (
    "id"               TEXT        NOT NULL,
    "clientId"         TEXT        NOT NULL,
    "tenantId"         TEXT        NOT NULL,
    -- Tipo de alerta PLD
    "alertType"        "PldAlertType" NOT NULL,
    -- Estado actual de la alerta
    "status"           "PldAlertStatus" NOT NULL DEFAULT 'OPEN',
    -- Origen de la alerta: 'PAYMENT' o 'LOAN'
    "sourceType"       TEXT        NOT NULL,
    -- ID del pago o préstamo que originó la alerta
    "sourceId"         TEXT        NOT NULL,
    -- Monto involucrado en la operación inusual
    "amount"           DECIMAL(12,2) NOT NULL,
    -- Descripción legible de la alerta
    "description"      TEXT        NOT NULL,
    -- JSON con evidencia adicional (snapshot de datos en el momento)
    "evidence"         TEXT,
    -- Si ya fue incluida en un reporte SITI
    "reportedToSiti"   BOOLEAN     NOT NULL DEFAULT FALSE,
    "sitiReportDate"   TIMESTAMP(3),
    -- Revisión por el Oficial de Cumplimiento
    "reviewedBy"       TEXT,
    "reviewedAt"       TIMESTAMP(3),
    "reviewNotes"      TEXT,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pld_alerts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "pld_alerts_clientId_idx"        ON "pld_alerts"("clientId");
CREATE INDEX IF NOT EXISTS "pld_alerts_tenantId_idx"        ON "pld_alerts"("tenantId");
CREATE INDEX IF NOT EXISTS "pld_alerts_alertType_idx"       ON "pld_alerts"("alertType");
CREATE INDEX IF NOT EXISTS "pld_alerts_status_idx"          ON "pld_alerts"("status");
CREATE INDEX IF NOT EXISTS "pld_alerts_reportedToSiti_idx"  ON "pld_alerts"("reportedToSiti");
CREATE INDEX IF NOT EXISTS "pld_alerts_createdAt_idx"       ON "pld_alerts"("createdAt");

ALTER TABLE "pld_alerts"
    ADD CONSTRAINT "pld_alerts_clientId_fkey"
        FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "pld_alerts_tenantId_fkey"
        FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. Trigger para actualizar updatedAt automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'set_pld_screening_updated_at'
    ) THEN
        CREATE TRIGGER set_pld_screening_updated_at
            BEFORE UPDATE ON "pld_screening_results"
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'set_pld_alerts_updated_at'
    ) THEN
        CREATE TRIGGER set_pld_alerts_updated_at
            BEFORE UPDATE ON "pld_alerts"
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END$$;
