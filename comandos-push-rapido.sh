
#!/bin/bash

# Script para hacer push rápido con token
# Uso: ./comandos-push-rapido.sh TU_TOKEN

echo "🚀 ESCALAFIN - Push Rápido a GitHub"
echo "===================================="
echo ""

if [ -z "$1" ]; then
    echo "❌ Error: Debes proporcionar tu token de GitHub"
    echo ""
    echo "Uso:"
    echo "   ./comandos-push-rapido.sh TU_GITHUB_TOKEN"
    echo ""
    echo "Para obtener un token:"
    echo "   1. Ir a: https://github.com/settings/tokens"
    echo "   2. Generate new token (classic)"
    echo "   3. Seleccionar scope: repo"
    echo "   4. Copiar el token"
    echo ""
    exit 1
fi

TOKEN=$1

echo "📂 Directorio: /home/ubuntu/escalafin_mvp"
cd /home/ubuntu/escalafin_mvp

echo ""
echo "📋 Commits a subir:"
git log origin/main..HEAD --oneline

echo ""
echo "🔄 Haciendo push..."
git push https://${TOKEN}@github.com/qhosting/escalafin-mvp.git main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Push exitoso!"
    echo ""
    echo "Verifica en: https://github.com/qhosting/escalafin-mvp/commits/main"
    echo ""
    echo "🎯 Próximo paso:"
    echo "   1. Ir a: https://adm.escalafin.com"
    echo "   2. Re-deploy del proyecto"
else
    echo ""
    echo "❌ Push falló"
    echo ""
    echo "Posibles causas:"
    echo "   - Token inválido o expirado"
    echo "   - No tienes permisos de escritura en el repo"
    echo "   - Problema de red"
    echo ""
    echo "Intenta generar un nuevo token en:"
    echo "   https://github.com/settings/tokens"
fi
