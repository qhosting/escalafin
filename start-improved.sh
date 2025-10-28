
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
elif command -v yarn >/dev/null 2>&1; then
    PRISMA_CMD="yarn prisma"
    echo "  ✅ Usando: yarn prisma"
else
    PRISMA_CMD="npx prisma"
    echo "  ⚠️  Fallback: npx prisma"
fi
echo ""

# Verificar conexión a base de datos
echo "🔌 Verificando conexión a base de datos..."
if [ -n "$DATABASE_URL" ]; then
    echo "  ✅ DATABASE_URL configurada"
    
    # Intentar aplicar migraciones
    echo "🔄 Aplicando migraciones..."
    if $PRISMA_CMD migrate deploy 2>&1; then
        echo "  ✅ Migraciones aplicadas"
    else
        echo "  ⚠️  Error en migraciones, continuando..."
    fi
    
    # Verificar estado
    echo "📊 Estado de migraciones:"
    $PRISMA_CMD migrate status || echo "  ⚠️  No se pudo verificar estado"
    
    # Ejecutar seed si es necesario
    echo ""
    echo "🌱 Verificando necesidad de seed..."
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
        echo "  🌱 Ejecutando seed..."
        $PRISMA_CMD db seed || echo "  ⚠️  Error en seed, continuando..."
    else
        echo "  ✅ DB ya inicializada, omitiendo seed"
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
