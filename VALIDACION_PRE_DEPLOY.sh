
#!/bin/bash

# 🔍 Script de validación pre-deploy para ESCALAFIN
# Verifica que todo esté correcto antes de hacer push y rebuild

set -e  # Exit on error

echo "════════════════════════════════════════════════════════"
echo "  🔍 VALIDACIÓN PRE-DEPLOY - ESCALAFIN"
echo "════════════════════════════════════════════════════════"
echo ""

cd /home/ubuntu/escalafin_mvp

# 1. Verificar estructura de archivos
echo "📂 1. Verificando estructura de archivos..."
echo ""

check_file() {
    if [ -f "$1" ]; then
        echo "  ✅ $1"
        return 0
    else
        echo "  ❌ $1 - NO ENCONTRADO"
        return 1
    fi
}

check_file "Dockerfile"
check_file ".dockerignore"
check_file "app/package.json"
check_file "app/package-lock.json"
check_file "app/next.config.js"
check_file "app/prisma/schema.prisma"
check_file "start-improved.sh"
check_file "emergency-start.sh"
check_file "healthcheck.sh"

echo ""

# 2. Verificar scripts en package.json
echo "📋 2. Verificando scripts en package.json..."
echo ""

SCRIPTS=$(cat app/package.json | jq -r '.scripts | keys[]' 2>/dev/null)
if echo "$SCRIPTS" | grep -q "build"; then
    echo "  ✅ Script 'build' presente"
else
    echo "  ❌ Script 'build' FALTANTE"
    exit 1
fi

if echo "$SCRIPTS" | grep -q "dev"; then
    echo "  ✅ Script 'dev' presente"
else
    echo "  ❌ Script 'dev' FALTANTE"
fi

if echo "$SCRIPTS" | grep -q "start"; then
    echo "  ✅ Script 'start' presente"
else
    echo "  ❌ Script 'start' FALTANTE"
fi

echo ""

# 3. Verificar ubicación de prisma
echo "🔧 3. Verificando ubicación de prisma..."
echo ""

PRISMA_IN_DEV=$(cat app/package.json | jq -r '.devDependencies.prisma // "not_found"' 2>/dev/null)
PRISMA_IN_DEPS=$(cat app/package.json | jq -r '.dependencies.prisma // "not_found"' 2>/dev/null)

if [ "$PRISMA_IN_DEV" != "not_found" ]; then
    echo "  ✅ prisma en devDependencies: $PRISMA_IN_DEV"
else
    echo "  ⚠️  prisma NO está en devDependencies"
fi

if [ "$PRISMA_IN_DEPS" != "not_found" ]; then
    echo "  ❌ prisma está en dependencies (debería estar en devDependencies)"
    exit 1
else
    echo "  ✅ prisma NO está en dependencies (correcto)"
fi

PRISMA_CLIENT=$(cat app/package.json | jq -r '.dependencies."@prisma/client" // "not_found"' 2>/dev/null)
if [ "$PRISMA_CLIENT" != "not_found" ]; then
    echo "  ✅ @prisma/client en dependencies: $PRISMA_CLIENT"
else
    echo "  ❌ @prisma/client NO está en dependencies"
    exit 1
fi

echo ""

# 4. Verificar symlinks problemáticos
echo "🔗 4. Verificando symlinks problemáticos..."
echo ""

BACKUP_SYMLINKS=$(find app/ -maxdepth 2 -type l -name "*.backup" 2>/dev/null || true)
if [ -z "$BACKUP_SYMLINKS" ]; then
    echo "  ✅ No se encontraron symlinks .backup"
else
    echo "  ❌ Se encontraron symlinks .backup:"
    echo "$BACKUP_SYMLINKS" | sed 's/^/     /'
    exit 1
fi

if [ -L "app/node_modules.backup" ]; then
    echo "  ❌ app/node_modules.backup existe (symlink problemático)"
    exit 1
else
    echo "  ✅ app/node_modules.backup no existe"
fi

echo ""

# 5. Verificar .dockerignore
echo "🐳 5. Verificando .dockerignore..."
echo ""

if grep -q "node_modules.backup" .dockerignore; then
    echo "  ✅ .dockerignore excluye node_modules.backup"
else
    echo "  ⚠️  .dockerignore NO excluye node_modules.backup"
fi

if grep "^start-improved.sh" .dockerignore >/dev/null 2>&1; then
    echo "  ❌ .dockerignore excluye start-improved.sh (NO debería)"
    exit 1
else
    echo "  ✅ .dockerignore NO excluye start-improved.sh"
fi

echo ""

# 6. Verificar Prisma schema
echo "🗄️  6. Verificando Prisma schema..."
echo ""

if grep -q 'output.*=.*"/opt/hostedapp' app/prisma/schema.prisma 2>/dev/null; then
    echo "  ❌ Prisma schema tiene output path ABSOLUTO"
    exit 1
else
    echo "  ✅ Prisma schema NO tiene output paths absolutos"
fi

PRISMA_OUTPUT=$(grep -A 2 "client {" app/prisma/schema.prisma | grep "output" || echo "no output specified")
echo "     Output: $PRISMA_OUTPUT"

echo ""

# 7. Verificar Git status
echo "📦 7. Verificando estado de Git..."
echo ""

if git diff --quiet; then
    echo "  ✅ No hay cambios sin commitear"
else
    echo "  ⚠️  Hay cambios sin commitear:"
    git status --short | head -10 | sed 's/^/     /'
fi

echo ""
echo "════════════════════════════════════════════════════════"
echo "  ✅ VALIDACIÓN COMPLETADA"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Próximos pasos:"
echo "  1. git add -A"
echo "  2. git commit -m 'fix: Eliminar symlink node_modules.backup'"
echo "  3. git push origin main"
echo "  4. En EasyPanel: Pull latest + Clear cache + Rebuild"
echo ""
