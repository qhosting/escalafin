
#!/bin/sh
# Healthcheck script for EscalaFin MVP
# Versión: 2.0 - Usa wget (incluido en alpine) en lugar de curl

PORT=${PORT:-3000}
HEALTH_URL="http://localhost:${PORT}/api/health"

echo "🏥 Ejecutando healthcheck en ${HEALTH_URL}..."

# Try to wget the health endpoint
if wget --no-verbose --tries=1 --spider "${HEALTH_URL}" > /dev/null 2>&1; then
  echo "✅ Health check passed"
  exit 0
else
  echo "❌ Health check failed"
  exit 1
fi
