#!/bin/bash

# Script para completar configuración SSH y hacer push
# Se ejecuta DESPUÉS de agregar la SSH key a GitHub

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║          🔐 COMPLETANDO CONFIGURACIÓN SSH + PUSH              ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

cd /home/ubuntu/escalafin_mvp

echo "📍 Paso 1: Verificando conexión SSH con GitHub..."
echo ""
ssh -T git@github.com -o StrictHostKeyChecking=no 2>&1 | head -5
echo ""

echo "📍 Paso 2: Cambiando remote de HTTPS a SSH..."
git remote set-url origin git@github.com:qhosting/escalafin-mvp.git

echo "✓ Remote actualizado:"
git remote -v
echo ""

echo "📍 Paso 3: Verificando commits pendientes..."
echo ""
git log origin/main..HEAD --oneline
echo ""

echo "📍 Paso 4: Haciendo push a GitHub..."
echo ""
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                  ✅ PUSH EXITOSO                              ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "🎉 Todos los commits se subieron correctamente a GitHub"
    echo ""
    echo "📍 Verifica en:"
    echo "   https://github.com/qhosting/escalafin-mvp/commits/main"
    echo ""
    echo "🎯 SIGUIENTE PASO:"
    echo "   1. Ir a Coolify: https://adm.escalafin.com"
    echo "   2. Seleccionar proyecto EscalaFin"
    echo "   3. Click en 'Redeploy'"
    echo "   4. Monitorear logs del build"
    echo ""
else
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                  ❌ PUSH FALLÓ                                ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Posibles causas:"
    echo "  - La SSH key no está agregada en GitHub"
    echo "  - No tienes permisos de escritura en el repo"
    echo "  - Problema de red"
    echo ""
    echo "Verifica en GitHub Settings → SSH keys:"
    echo "  https://github.com/settings/keys"
    echo ""
fi
