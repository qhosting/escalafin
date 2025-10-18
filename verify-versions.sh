#!/bin/bash
echo "🔍 VERIFICACIÓN DE VERSIONES"
echo "============================"
echo ""
echo "📍 LOCAL:"
echo "  Node:    $(node --version)"
echo "  Yarn:    $(yarn --version)"
echo ""
echo "📍 package.json:"
echo "  Package Manager: $(node -e "console.log(require('./app/package.json').packageManager || 'NO ESPECIFICADO')")"
echo ""
echo "📍 Dockerfile.step3-full:"
grep "FROM node" Dockerfile.step3-full | head -1
grep "yarn@" Dockerfile.step3-full | grep -v "^#" | head -1
echo ""
echo "📍 yarn.lock:"
echo "  Version: $(head -5 app/yarn.lock | grep version | awk '{print $2}')"
echo ""
echo "✅ ESTADO:"
LOCAL_NODE=$(node --version | cut -d'.' -f1 | tr -d 'v')
DOCKER_NODE=$(grep "FROM node" Dockerfile.step3-full | head -1 | grep -oP 'node:\K[0-9]+')
LOCAL_YARN=$(yarn --version)
DOCKER_YARN=$(grep "yarn@" Dockerfile.step3-full | grep -v "^#" | head -1 | grep -oP 'yarn@\K[0-9.]+')
PKG_YARN=$(node -e "console.log((require('./app/package.json').packageManager || '').replace('yarn@', ''))")

echo "  Node coincide: $([[ "$LOCAL_NODE" == "$DOCKER_NODE" ]] && echo '✅ SÍ' || echo '❌ NO')"
echo "  Yarn coincide: $([[ "$LOCAL_YARN" == "$DOCKER_YARN" ]] && echo '✅ SÍ' || echo '❌ NO')"
echo "  packageManager configurado: $([[ -n "$PKG_YARN" ]] && echo '✅ SÍ' || echo '❌ NO')"
