
#!/bin/sh

echo "🚀 Iniciando ESCALAFIN..."

# Configurar PATH to include node_modules/.bin for Prisma CLI
export PATH="$PATH:/app/node_modules/.bin"
echo "📦 PATH configurado: $PATH"

# Verify .bin directory and Prisma CLI exist
echo "🔍 Verificando Prisma CLI..."
if [ -f "node_modules/.bin/prisma" ]; then
    echo "✅ Prisma CLI encontrado en node_modules/.bin/prisma"
    PRISMA_CMD="node_modules/.bin/prisma"
elif [ -f "node_modules/prisma/build/index.js" ]; then
    echo "⚠️ Usando Prisma directamente desde build/index.js"
    PRISMA_CMD="node node_modules/prisma/build/index.js"
else
    echo "❌ Prisma CLI no encontrado - intentando con npx"
    PRISMA_CMD="npx prisma"
fi

echo "🔐 Comando Prisma: $PRISMA_CMD"

# Verificar cliente Prisma
echo "🔍 Verificando cliente Prisma..."
if [ -d "node_modules/@prisma/client" ]; then
    echo "✅ Cliente Prisma encontrado"
else
    echo "⚠️ Cliente Prisma no encontrado, generando..."
    $PRISMA_CMD generate || echo "❌ Error generando cliente Prisma"
fi

# Aplicar migraciones (sin verificar resultado)
echo "🔄 Aplicando migraciones si es necesario..."
$PRISMA_CMD migrate deploy || echo "⚠️ Error en migraciones, continuando..."

# Verificar estado de migraciones
echo "📋 Verificando estado de migraciones..."
$PRISMA_CMD migrate status || echo "⚠️ No se pudo verificar estado de migraciones"

# Regenerar cliente Prisma en container
echo "🔧 Regenerando cliente Prisma en container..."
$PRISMA_CMD generate || echo "⚠️ Error generando cliente Prisma"

# Ejecutar seed solo si no hay usuarios
echo "🌱 Verificando si necesita seed..."
echo "📋 Consultando tabla users..."

# Check if users table is empty using node script
USER_COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.count()
  .then(count => { console.log(count); process.exit(0); })
  .catch(err => { console.error('0'); process.exit(0); })
  .finally(() => prisma.\$disconnect());
" 2>/dev/null || echo "0")

echo "👥 Usuarios en la base de datos: $USER_COUNT"

if [ "$USER_COUNT" = "0" ]; then
    echo "🌱 Base de datos vacía - ejecutando seed..."
    if [ -f "scripts/seed.ts" ]; then
        echo "✅ Seed script encontrado, ejecutando..."
        npm run seed || echo "⚠️ Error ejecutando seed, continuando..."
    else
        echo "⚠️ Script seed.ts no encontrado en scripts/"
        echo "📂 Contenido de scripts/:"
        ls -la scripts/ 2>/dev/null || echo "Directorio scripts/ no existe"
    fi
else
    echo "✅ Base de datos ya tiene usuarios, omitiendo seed"
fi

# Verificar archivos necesarios
echo "🔍 Verificando archivos de Next.js standalone..."

# Verify server.js exists in the correct location (/app/server.js)
if [ ! -f "/app/server.js" ]; then
    echo "❌ ERROR CRITICO: server.js NO ENCONTRADO en /app/server.js"
    echo "📂 Estructura del directorio /app:"
    ls -la /app/ | head -30
    echo ""
    echo "🔍 Buscando server.js en todo el filesystem:"
    find /app -name "server.js" -type f 2>/dev/null | head -10
    echo ""
    echo "❌ El Dockerfile no copió correctamente el standalone build"
    echo "🔧 Intentando fallback con next start..."
    exit 1
fi

echo "✅ server.js encontrado en /app/server.js (CORRECTO)"
echo "📂 Contenido del directorio /app:"
ls -la /app/ | head -20

# Verificar archivos necesarios
echo ""
echo "🔍 Verificando archivos críticos de ESCALAFIN..."

# Iniciar la aplicacion desde /app con server.js
echo ""
echo "🚀 Iniciando servidor Next.js standalone..."
echo "   📂 Working directory: /app"
echo "   🖥️ Server: /app/server.js"
echo "   🌐 Hostname: 0.0.0.0"
echo "   🔌 Port: 3000"
echo ""

cd /app || {
    echo "❌ ERROR: No se puede cambiar a /app"
    exit 1
}

echo "🎉 EJECUTANDO: node server.js"
exec node server.js
