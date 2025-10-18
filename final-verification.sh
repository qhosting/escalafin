#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║          VERIFICACIÓN FINAL DEL FIX                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo "📍 VERIFICANDO ARCHIVOS CRÍTICOS:"
echo ""

# 1. Verificar Dockerfile principal
echo "1️⃣  Dockerfile principal:"
if grep -q "FROM node:22-alpine" Dockerfile; then
    echo "   ✅ Usa Node 22-alpine"
else
    echo "   ❌ NO usa Node 22-alpine"
fi

if grep -q "yarn@4.9.4" Dockerfile; then
    echo "   ✅ Usa Yarn 4.9.4"
else
    echo "   ❌ NO usa Yarn 4.9.4"
fi

if grep -q "package-lock.json" Dockerfile; then
    echo "   ⚠️  Menciona package-lock.json (puede ser comentario)"
else
    echo "   ✅ No busca package-lock.json"
fi

echo ""

# 2. Verificar package.json
echo "2️⃣  package.json:"
PKG_MGR=$(node -e "console.log(require('./app/package.json').packageManager || 'NO CONFIGURADO')")
echo "   packageManager: $PKG_MGR"
if [ "$PKG_MGR" == "yarn@4.9.4" ]; then
    echo "   ✅ Configurado correctamente"
else
    echo "   ❌ NO configurado correctamente"
fi

echo ""

# 3. Verificar yarn.lock
echo "3️⃣  yarn.lock:"
LOCK_VERSION=$(head -5 app/yarn.lock | grep "version:" | awk '{print $2}')
echo "   Version: $LOCK_VERSION"
if [ "$LOCK_VERSION" == "8" ]; then
    echo "   ✅ Compatible con Yarn 4.x"
else
    echo "   ⚠️  Versión desconocida"
fi

echo ""

# 4. Verificar versiones locales
echo "4️⃣  Versiones locales:"
echo "   Node:    $(node --version)"
echo "   Yarn:    $(yarn --version)"

echo ""

# 5. Verificar últimos commits
echo "5️⃣  Últimos commits en GitHub:"
git log --oneline -3

echo ""

# 6. Estado de Git
echo "6️⃣  Estado de Git:"
if [ -z "$(git status --porcelain)" ]; then
    echo "   ✅ Sin cambios pendientes"
else
    echo "   ⚠️  Hay cambios sin commitear"
    git status --short
fi

echo ""

# 7. Verificar archivos de documentación
echo "7️⃣  Documentación creada:"
for doc in ANALISIS_VERSIONES_DEPENDENCIAS.md FIX_VERSIONES_COMPLETADO.md INSTRUCCIONES_EASYPANEL_CACHE_FIX.md; do
    if [ -f "$doc" ]; then
        echo "   ✅ $doc"
    else
        echo "   ❌ $doc (falta)"
    fi
done

echo ""

# Resumen final
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    RESUMEN FINAL                           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

DOCKERFILE_OK=$(grep -q "FROM node:22-alpine" Dockerfile && grep -q "yarn@4.9.4" Dockerfile && echo "OK" || echo "FAIL")
PACKAGE_OK=$([ "$PKG_MGR" == "yarn@4.9.4" ] && echo "OK" || echo "FAIL")
LOCK_OK=$([ "$LOCK_VERSION" == "8" ] && echo "OK" || echo "FAIL")
GIT_OK=$([ -z "$(git status --porcelain)" ] && echo "OK" || echo "FAIL")

echo "Dockerfile:        [$DOCKERFILE_OK]"
echo "package.json:      [$PACKAGE_OK]"
echo "yarn.lock:         [$LOCK_OK]"
echo "Git status:        [$GIT_OK]"

echo ""

if [ "$DOCKERFILE_OK" == "OK" ] && [ "$PACKAGE_OK" == "OK" ] && [ "$LOCK_OK" == "OK" ]; then
    echo "🎉 TODO LISTO PARA DEPLOYMENT EN EASYPANEL"
    echo ""
    echo "Próximos pasos:"
    echo "1. Ve a EasyPanel"
    echo "2. Limpia el cache (Clear Build Cache)"
    echo "3. Verifica Dockerfile: \"Dockerfile\" (sin ruta)"
    echo "4. Haz Rebuild"
    echo "5. Monitorea logs (debe decir node:22 y yarn 4.9.4)"
else
    echo "⚠️  ALGUNOS CHECKS FALLARON - Revisa arriba"
fi

echo ""
