#!/bin/bash
set -e

echo "Starting EscalaFin..."
export PATH="$PATH:/app/node_modules_full/.bin"
export NODE_PATH=/app/node_modules_full

# Database sync
if [ -n "$DATABASE_URL" ]; then
    echo "Cleaning up legacy CHATWOOT entries..."
    psql "$DATABASE_URL" -c "UPDATE message_templates SET channel = 'WHATSAPP' WHERE channel::text = 'CHATWOOT';" || true
    echo "Sycning database schema..."
    /app/node_modules_full/.bin/prisma db push --accept-data-loss --skip-generate
fi

# Run seeds and setup
if [ -f "scripts/seed-modules.js" ]; then
    echo "Seeding modules..."
    node scripts/seed-modules.js
fi

if [ -f "scripts/seed-message-templates.js" ]; then
    echo "Seeding message templates..."
    node scripts/seed-message-templates.js
fi

if [ -f "scripts/setup-users-production.js" ]; then
    echo "Setting up production users..."
    node scripts/setup-users-production.js
fi

if [ -f "scripts/setup-vapid.js" ]; then
    echo "Setting up VAPID keys..."
    node scripts/setup-vapid.js
fi

echo "Starting Next.js server..."
exec node server.js
