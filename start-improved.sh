#!/bin/bash
set -e

echo "Starting EscalaFin..."
export PATH="$PATH:/app/node_modules/.bin"

# Database sync
if [ -n "$DATABASE_URL" ]; then
    echo "Sycning database schema..."
    node_modules/.bin/prisma db push --accept-data-loss --skip-generate
fi

# Run seeds
if [ -f "scripts/seed-modules.js" ]; then
    echo "Seeding modules..."
    node scripts/seed-modules.js
fi

echo "Starting Next.js server..."
exec node server.js
