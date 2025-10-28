#!/bin/bash
set -e

echo "========================================"
echo "VERIFICACIÓN PRE-DEPLOY"
echo "========================================"

log() { echo "[$(date '+%H:%M:%S')] $1"; }
error() { echo "[ERROR] $1" >&2; exit 1; }

# 1. Git status
log "1. Verificando Git..."
if [ -n "$(git status --porcelain)" ]; then
    error "Hay cambios sin commitear"
fi
log "✓ Git limpio"

# 2. Archivos críticos
log "2. Verificando archivos críticos..."
[ -f "app/package.json" ] || error "Falta package.json"
[ -f "app/yarn.lock" ] || error "Falta yarn.lock"
[ ! -L "app/yarn.lock" ] || error "yarn.lock es symlink"
[ -f "Dockerfile" ] || error "Falta Dockerfile"
log "✓ Archivos críticos OK"

# 3. Prisma schema
log "3. Verificando Prisma..."
if grep -q "output.*=" app/prisma/schema.prisma; then
    error "Prisma tiene output path hardcodeado"
fi
log "✓ Prisma schema OK"

# 4. Dockerfile
log "4. Verificando Dockerfile..."
grep -q "outputFileTracingRoot" Dockerfile || error "Dockerfile sin outputFileTracingRoot"
grep -q "yarn prisma generate" Dockerfile || error "Dockerfile sin prisma generate"
log "✓ Dockerfile OK"

# 5. Build test
log "5. Test build..."
cd app && yarn build >/dev/null 2>&1 || error "Build falló"
log "✓ Build OK"

# 6. Standalone output
log "6. Verificando standalone..."
[ -d ".next/standalone" ] || error "Falta .next/standalone"
[ -f ".next/standalone/app/server.js" ] || error "Falta server.js"
log "✓ Standalone OK"

cd ..
echo ""
echo "========================================"
echo "✅ TODO LISTO PARA DEPLOY"
echo "========================================"
echo ""
echo "Último commit:"
git log -1 --oneline
echo ""

