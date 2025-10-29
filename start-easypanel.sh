
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

# Configurar usuarios de prueba si la DB está vacía
echo ""
echo "🌱 Verificando usuarios de prueba..."
USER_COUNT=$(node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    prisma.user.count()
        .then(count => { console.log(count); process.exit(0); })
        .catch(err => { console.error('0'); process.exit(0); })
        .finally(() => prisma.\$disconnect());
" 2>/dev/null || echo "0")

echo "👥 Usuarios en DB: $USER_COUNT"

if [ "$USER_COUNT" = "0" ]; then
    echo "🌱 Configurando usuarios de prueba..."
    echo "📂 Directorio actual: $(pwd)"
    
    # Intentar con ruta relativa primero
    if [ -f "scripts/setup-users-production.js" ]; then
        echo "✅ Script encontrado (ruta relativa)"
        SCRIPT_PATH="scripts/setup-users-production.js"
    # Intentar con ruta absoluta
    elif [ -f "/app/scripts/setup-users-production.js" ]; then
        echo "✅ Script encontrado (ruta absoluta)"
        SCRIPT_PATH="/app/scripts/setup-users-production.js"
    else
        echo "⚠️  setup-users-production.js no encontrado"
        SCRIPT_PATH=""
    fi
    
    if [ -n "$SCRIPT_PATH" ]; then
        export NODE_PATH=/app/node_modules:$NODE_PATH
        echo "📍 NODE_PATH: $NODE_PATH"
        echo "🚀 Ejecutando: node $SCRIPT_PATH"
        node "$SCRIPT_PATH" || echo "⚠️  Error configurando usuarios, continuando..."
    else
        echo "⚠️  No se puede configurar usuarios automáticamente"
        echo "💡 Configura manualmente usando el panel de administración"
    fi
else
    echo "✅ DB ya tiene usuarios configurados"
fi

# Iniciar la aplicación
echo ""
echo "✅ Iniciando servidor Next.js en puerto ${PORT}..."
exec node server.js
