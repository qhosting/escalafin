#!/bin/sh

echo "🚀 Iniciando ESCALAFIN..."

# Configurar PATH to include node_modules/.bin for Prisma CLI
export PATH="$PATH:/app/node_modules/.bin"
echo "📦 PATH configurado: $PATH"

# Usar yarn para ejecutar comandos de Prisma
PRISMA_CMD="yarn prisma"

echo "🔐 Comando Prisma: $PRISMA_CMD"

# Aplicar migraciones
echo "🔄 Aplicando migraciones si es necesario..."
$PRISMA_CMD migrate deploy || echo "⚠️ Error en migraciones, continuando..."

# Verificar estado de migraciones
echo "📋 Verificando estado de migraciones..."
$PRISMA_CMD migrate status || echo "⚠️ No se pudo verificar estado de migraciones"

# Ejecutar seed solo si no hay usuarios
echo "🌱 Verificando si necesita seed..."
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
    $PRISMA_CMD db seed || echo "⚠️ Error ejecutando seed, continuando..."
else
    echo "✅ Base de datos ya tiene usuarios, omitiendo seed"
fi

echo "🚀 Iniciando servidor Next.js standalone..."
exec node server.js
