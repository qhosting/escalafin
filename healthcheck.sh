
#!/bin/sh
# Healthcheck script for EscalaFin MVP

# Try to curl the health endpoint
if curl -f http://localhost:${PORT:-3000}/api/health > /dev/null 2>&1; then
  echo "✅ Health check passed"
  exit 0
else
  echo "❌ Health check failed"
  exit 1
fi
