
#!/bin/sh
set -e

echo "🚀 Iniciando EscalaFin MVP..."
echo "NODE_ENV: ${NODE_ENV}"
echo "PORT: ${PORT}"

# Función para esperar a que Postgres esté listo
wait_for_postgres() {
    echo "⏳ Esperando a que PostgreSQL esté listo..."
    
    # Extraer componentes de DATABASE_URL
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    
    echo "Host: $DB_HOST, Port: $DB_PORT"
    
    max_attempts=30
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if wget --spider -q "http://$DB_HOST:$DB_PORT" 2>/dev/null || nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
            echo "✅ PostgreSQL está listo"
            return 0
        fi
        
        attempt=$((attempt + 1))
        echo "Intento $attempt/$max_attempts - PostgreSQL no está listo aún..."
        sleep 2
    done
    
    echo "⚠️  No se pudo conectar a PostgreSQL después de $max_attempts intentos"
    echo "Continuando de todas formas..."
}

# Esperar a que la base de datos esté lista
if [ -n "$DATABASE_URL" ]; then
    wait_for_postgres
else
    echo "⚠️  DATABASE_URL no está configurado"
fi

# Ejecutar migraciones de Prisma
if [ -f "/app/node_modules/.bin/prisma" ]; then
    echo "🔄 Ejecutando migraciones de Prisma..."
    npx prisma migrate deploy --schema=/app/prisma/schema.prisma || {
        echo "⚠️  Error al ejecutar migraciones (puede ser normal en primer deploy)"
    }
else
    echo "⚠️  Prisma no encontrado, saltando migraciones"
fi

# Iniciar la aplicación
echo "✅ Iniciando servidor Next.js en puerto ${PORT}..."
exec node server.js
