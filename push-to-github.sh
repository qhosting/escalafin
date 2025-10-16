
#!/bin/bash

# 🚀 Script de Push a GitHub - EscalaFin MVP
# Este script sube todos los cambios pendientes a GitHub

set -e

echo "=========================================="
echo "🚀 Actualizando GitHub - EscalaFin MVP"
echo "=========================================="
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Verificar directorio
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Error: No estás en el directorio del proyecto${NC}"
    exit 1
fi

# Mostrar estado actual
echo -e "${YELLOW}📊 Estado actual del repositorio:${NC}"
git status
echo ""

# Mostrar commits pendientes
echo -e "${YELLOW}📦 Commits pendientes para subir:${NC}"
git log origin/main..HEAD --oneline
echo ""

# Confirmar
read -p "¿Deseas subir estos cambios a GitHub? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Cancelado${NC}"
    exit 1
fi

# Intentar push
echo -e "${YELLOW}📤 Subiendo cambios...${NC}"
if git push origin main; then
    echo ""
    echo -e "${GREEN}✅ ¡Cambios subidos exitosamente a GitHub!${NC}"
    echo ""
    echo "🔗 Repositorio: https://github.com/qhosting/escalafin-mvp"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Error al subir cambios${NC}"
    echo ""
    echo -e "${YELLOW}💡 Necesitas autenticarte con GitHub${NC}"
    echo ""
    echo "Opciones:"
    echo "1. Usar Personal Access Token (recomendado)"
    echo "2. Configurar SSH"
    echo ""
    echo "Para crear un Personal Access Token:"
    echo "1. Ve a: https://github.com/settings/tokens"
    echo "2. Click en 'Generate new token' (classic)"
    echo "3. Selecciona scope: 'repo' (acceso completo al repositorio)"
    echo "4. Copia el token generado"
    echo "5. Usa el token como password cuando se te solicite"
    echo ""
    exit 1
fi
