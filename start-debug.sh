
#!/bin/sh
set -e

echo "🐛 MODO DEBUG - Sincronización de Base de Datos"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Verificar directorio
echo "📍 Working directory: $(pwd)"
echo "📍 Contenido del directorio:"
ls -la
echo ""

# Verificar NODE y NPM
echo "🔍 Versiones instaladas:"
echo "  Node: $(node --version)"
echo "  NPM: $(npm --version)"
echo ""

# Verificar Prisma
echo "🔍 Buscando Prisma CLI..."
if [ -f "node_modules/.bin/prisma" ]; then
    echo "  ✅ Prisma CLI encontrado en node_modules/.bin/prisma"
    PRISMA_CMD="node_modules/.bin/prisma"
elif command -v npx >/dev/null 2>&1; then
    echo "  ✅ Usando npx prisma"
    PRISMA_CMD="npx prisma"
else
    echo "  ❌ Prisma CLI no encontrado"
    exit 1
fi
echo ""

# Verificar DATABASE_URL
echo "🔍 Verificando DATABASE_URL..."
if [ -z "$DATABASE_URL" ]; then
    echo "  ❌ DATABASE_URL no está configurada"
    exit 1
else
    echo "  ✅ DATABASE_URL está configurada"
    # Mostrar solo el protocolo y host (sin password)
    DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|^([^:]+://[^:]+:)[^@]+(@.*)|\1****\2|')
    echo "  📍 Host: $DB_HOST"
fi
echo ""

# Verificar schema.prisma
echo "🔍 Verificando schema.prisma..."
if [ ! -f "prisma/schema.prisma" ]; then
    echo "  ❌ prisma/schema.prisma no encontrado"
    echo "  📂 Contenido del directorio actual:"
    find . -name "schema.prisma" -type f
    exit 1
else
    echo "  ✅ schema.prisma encontrado"
    echo "  📍 Ruta: $(pwd)/prisma/schema.prisma"
fi
echo ""

# Intentar conexión a la base de datos
echo "🔌 Probando conexión a la base de datos..."
if $PRISMA_CMD db execute --stdin <<< "SELECT 1;" 2>/dev/null; then
    echo "  ✅ Conexión exitosa"
else
    echo "  ⚠️  No se pudo verificar conexión con db execute, continuando..."
fi
echo ""

# Ejecutar db push con máximo detalle
echo "═══════════════════════════════════════════════════════════════════"
echo "🚀 EJECUTANDO: $PRISMA_CMD db push --accept-data-loss --skip-generate"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

$PRISMA_CMD db push --accept-data-loss --skip-generate 2>&1
DB_PUSH_EXIT=$?

echo ""
echo "═══════════════════════════════════════════════════════════════════"
if [ $DB_PUSH_EXIT -eq 0 ]; then
    echo "✅ DB PUSH EXITOSO"
else
    echo "❌ DB PUSH FALLÓ con código: $DB_PUSH_EXIT"
fi
echo "═══════════════════════════════════════════════════════════════════"

exit $DB_PUSH_EXIT
