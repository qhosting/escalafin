
#!/bin/sh
set -e

echo "🚀 Iniciando ESCALAFIN (versión mejorada)..."
echo ""

# Configurar PATH
export PATH="$PATH:/app/node_modules/.bin"
echo "📍 PATH: $PATH"
echo ""

# Detectar comando Prisma disponible
echo "🔍 Detectando Prisma CLI..."
if [ -x "node_modules/.bin/prisma" ]; then
    PRISMA_CMD="node_modules/.bin/prisma"
    echo "  ✅ Usando: node_modules/.bin/prisma"
elif [ -f "package-lock.json" ] && command -v npm >/dev/null 2>&1; then
    PRISMA_CMD="npx prisma"
    echo "  ✅ Usando: npx prisma (NPM project detected)"
elif [ -f "yarn.lock" ] && command -v yarn >/dev/null 2>&1; then
    PRISMA_CMD="yarn prisma"
    echo "  ✅ Usando: yarn prisma (Yarn project detected)"
else
    PRISMA_CMD="npx prisma"
    echo "  ⚠️  Fallback: npx prisma"
fi
echo ""

# Verificar conexión a base de datos
echo "🔌 Verificando conexión a base de datos..."
if [ -n "$DATABASE_URL" ]; then
    echo "  ✅ DATABASE_URL configurada"
    
    # Sincronizar esquema con base de datos
    echo "🔄 Sincronizando esquema con base de datos..."
    echo "  📍 Usando comando: $PRISMA_CMD"
    echo "  📍 Working directory: $(pwd)"
    echo "  📍 Schema location: $(pwd)/prisma/schema.prisma"
    
    # Verificar que el schema existe
    if [ ! -f "prisma/schema.prisma" ]; then
        echo "  ❌ ERROR: prisma/schema.prisma no encontrado"
        exit 1
    fi
    
    # Ejecutar db push con captura completa de output
    echo "  🚀 Ejecutando: $PRISMA_CMD db push --accept-data-loss --skip-generate"
    DB_PUSH_OUTPUT=$($PRISMA_CMD db push --accept-data-loss --skip-generate 2>&1)
    DB_PUSH_EXIT_CODE=$?
    
    echo "  📋 Output completo del comando:"
    echo "$DB_PUSH_OUTPUT"
    
    if [ $DB_PUSH_EXIT_CODE -eq 0 ]; then
        echo "  ✅ Esquema sincronizado exitosamente"
    else
        echo "  ❌ ERROR: db push falló con código: $DB_PUSH_EXIT_CODE"
        echo "  💡 Verifica que DATABASE_URL sea correcta y la base de datos esté accesible"
        exit 1
    fi
    
    # Ejecutar setup de usuarios si es necesario
    echo ""
    echo "🌱 Verificando necesidad de configurar usuarios..."
    USER_COUNT=$(node -e "
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        prisma.user.count()
            .then(count => { console.log(count); process.exit(0); })
            .catch(err => { console.error('0'); process.exit(0); })
            .finally(() => prisma.\$disconnect());
    " 2>/dev/null || echo "0")
    
    echo "  👥 Usuarios en DB: $USER_COUNT"
    
    if [ "$USER_COUNT" = "0" ]; then
        echo "  🌱 Configurando usuarios de prueba..."
        if [ -f "scripts/setup-users-production.js" ]; then
            # Configurar NODE_PATH para que Node.js encuentre los módulos
            export NODE_PATH=/app/node_modules:$NODE_PATH
            echo "  📍 NODE_PATH configurado: $NODE_PATH"
            node scripts/setup-users-production.js || echo "  ⚠️  Error configurando usuarios, continuando..."
        else
            echo "  ⚠️  scripts/setup-users-production.js no encontrado, continuando..."
        fi
    else
        echo "  ✅ DB ya inicializada con usuarios"
    fi
else
    echo "  ❌ DATABASE_URL no configurada"
    exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "🚀 INICIANDO SERVIDOR NEXT.JS"
echo "═══════════════════════════════════════════════════════════════════"
echo "  📂 Working directory: $(pwd)"
echo "  🌐 Hostname: ${HOSTNAME:-0.0.0.0}"
echo "  🔌 Port: ${PORT:-3000}"
echo "  🎯 Node version: $(node --version)"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Verificar que server.js existe
if [ ! -f "server.js" ]; then
    echo "❌ ERROR: server.js no encontrado en $(pwd)"
    echo "📋 Contenido del directorio:"
    ls -la
    exit 1
fi

exec node server.js
