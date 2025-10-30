
#!/bin/bash
# Healthcheck script for EscalaFin MVP
# Versión: 3.0 - Usa curl (incluido en node:18-slim base)

PORT=${PORT:-3000}
HEALTH_URL="http://localhost:${PORT}/api/health"

echo "🏥 Ejecutando healthcheck en ${HEALTH_URL}..."

# Try to curl the health endpoint
if curl -f -s "${HEALTH_URL}" > /dev/null 2>&1; then
  echo "✅ Health check passed"
  exit 0
else
  echo "❌ Health check failed"
  exit 1
fi
