
#!/bin/sh
set -e

echo "🚀 Starting EscalaFin MVP..."

# Esperar a que la base de datos esté lista
echo "⏳ Waiting for database to be ready..."
timeout=60
counter=0

while ! pg_isready -h "${DATABASE_HOST:-db}" -p "${DATABASE_PORT:-5432}" -U "${POSTGRES_USER:-escalafin}" > /dev/null 2>&1; do
  counter=$((counter + 1))
  if [ $counter -gt $timeout ]; then
    echo "❌ Database connection timeout after ${timeout} seconds"
    exit 1
  fi
  echo "⏳ Waiting for database... ($counter/$timeout)"
  sleep 1
done

echo "✅ Database is ready!"

# Ejecutar migraciones de Prisma
echo "🔄 Running Prisma migrations..."
if [ "$SKIP_MIGRATIONS" != "true" ]; then
  npx prisma migrate deploy || {
    echo "⚠️  Migration failed, trying to push schema..."
    npx prisma db push --accept-data-loss || echo "⚠️  Schema push also failed"
  }
else
  echo "⏭️  Skipping migrations (SKIP_MIGRATIONS=true)"
fi

# Generar cliente de Prisma
echo "🔧 Generating Prisma client..."
npx prisma generate

# Sembrar la base de datos si es necesario
if [ "$RUN_SEED" = "true" ]; then
  echo "🌱 Seeding database..."
  npm run seed || echo "⚠️  Seeding failed or not configured"
fi

# Iniciar la aplicación
echo "✨ Starting application on port ${PORT:-3000}..."
exec node server.js
