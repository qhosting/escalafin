#!/bin/bash
echo "🚨 EMERGENCY START - Bypass completo de checks"
echo "⚠️  ADVERTENCIA: Esto omite migraciones pero configura usuarios"

if [ -f "scripts/setup-users-production.js" ]; then
    echo "Setting up production users for emergency access..."
    node scripts/setup-users-production.js
fi

echo "Starting Next.js server directly..."
exec node server.js
