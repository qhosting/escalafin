-- ============================================================
-- EscalaFin v3.0.0 - Migración de Índices de Rendimiento
-- Aplica esta migración cuando la base de datos esté disponible:
--   psql $DATABASE_URL -f migrations/add_composite_indices.sql
-- ============================================================

-- Verificar que los índices no existan antes de crearlos
-- (CONCURRENTLY permite crear sin bloquear escrituras en producción)

-- ─── Índices Compuestos para Loan ─────────────────────────────────────────────
-- Mejora consultas de morosidad por tenant+status (dashboard KPIs)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "loans_tenantId_status_idx"
  ON "loans"("tenantId", "status");

-- Mejora consultas de préstamos vigentes con fecha de inicio (reportes)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "loans_tenantId_status_startDate_idx"
  ON "loans"("tenantId", "status", "startDate");

-- Mejora consultas de préstamos por cliente (expediente del acreditado)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "loans_clientId_status_idx"
  ON "loans"("clientId", "status");

-- ─── Índices Compuestos para Payment ─────────────────────────────────────────
-- Mejora consultas de pagos vencidos por préstamo (cobranza diaria)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "payments_loanId_status_idx"
  ON "payments"("loanId", "status");

-- Mejora consultas de cobranza diaria / semanal por tenant
CREATE INDEX CONCURRENTLY IF NOT EXISTS "payments_tenantId_paymentDate_idx"
  ON "payments"("tenantId", "paymentDate");

-- Índice triple para reportes de eficiencia de cobranza
CREATE INDEX CONCURRENTLY IF NOT EXISTS "payments_tenantId_status_paymentDate_idx"
  ON "payments"("tenantId", "status", "paymentDate");

-- ─── Índices Compuestos para AmortizationSchedule ────────────────────────────
-- Mejora consultas de cuotas pendientes de un préstamo
CREATE INDEX CONCURRENTLY IF NOT EXISTS "amortization_schedule_loanId_isPaid_idx"
  ON "amortization_schedule"("loanId", "isPaid");

-- Mejora consultas de cuotas por fecha de vencimiento (alertas de morosidad)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "amortization_schedule_loanId_paymentDate_idx"
  ON "amortization_schedule"("loanId", "paymentDate");

-- ─── Verificación ─────────────────────────────────────────────────────────────
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('loans', 'payments', 'amortization_schedule')
  AND indexname LIKE '%_idx'
ORDER BY tablename, indexname;
