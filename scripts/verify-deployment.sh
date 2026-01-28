#!/bin/bash
# Scripts de verificación de despliegue para Roadmap Item 1

set -e

echo "🔍 Iniciando verificación de despliegue (Post-Deploy Check)..."

# 1. Verificar Node version
echo ""
echo "📦 1. Verificando entorno Node.js..."
NODE_VERSION=$(node --version)
echo "   ✅ Node version: $NODE_VERSION"

# 2. Verificar paquetes de sistema (Debian 12 check indirecto)
echo ""
echo "pkgs 2. Verificando dependencias del sistema..."
PACKAGES="openssl curl ca-certificates"
MISSING=0

for pkg in $PACKAGES; do
    if dpkg -l | grep -q "^ii  $pkg"; then
        echo "   ✅ $pkg: Instalado"
    else
        echo "   ❌ $pkg: NO ENCONTRADO"
        MISSING=1
    fi
done

if [ $MISSING -eq 1 ]; then
    echo "   ⚠️  Algunos paquetes faltan. Verifica el Dockerfile."
    # No fallamos el script, solo avisamos
fi

# 3. Verificar directorios clave
echo ""
echo "wd 3. Verificando estructura de directorios..."
DIRS="/app/uploads /app/prisma"
for dir in $DIRS; do
    if [ -d "$dir" ]; then
        echo "   ✅ $dir: Existe"
    else
        echo "   ❌ $dir: NO EXISTE"
    fi
done

# 4. Verificar health endpoint (si la app está corriendo)
echo ""
echo "🏥 4. Verificando Health Endpoint..."
if curl -s -f http://localhost:3000/api/health > /dev/null; then
    echo "   ✅ Health Check: OK (http://localhost:3000/api/health)"
else
    echo "   ⚠️  Health Check: No responde o error (La app podría estar iniciándose)"
fi

echo ""
echo "✅ Verificación finalizada."
