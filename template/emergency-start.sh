
#!/bin/sh
echo "🚨 EMERGENCY START - Bypass completo de checks"
echo "⚠️  ADVERTENCIA: Esto omite migraciones y seed"
echo "Starting Next.js server directly..."
cd /app || exit 1
exec node server.js
