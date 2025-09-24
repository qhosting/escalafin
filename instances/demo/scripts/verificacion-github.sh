
#!/bin/bash

# 🔍 Script de Verificación Pre-GitHub
# Verifica que el proyecto esté listo para subir a GitHub

echo "🚀 EscalaFin MVP - Verificación Pre-GitHub"
echo "========================================"
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

success_count=0
total_checks=0

check_result() {
    ((total_checks++))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        ((success_count++))
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

echo "🔒 VERIFICACIONES DE SEGURIDAD:"
echo "--------------------------------"

# Verificar .env
if [ -f "./app/.env" ] && grep -q "^\.env$" .gitignore; then
    check_result 0 "Archivo .env presente pero excluido en .gitignore"
else
    check_result 1 "Archivo .env no encontrado o no excluido correctamente"
fi

# Verificar node_modules
if ! find . -name "node_modules" -type d | grep -q .; then
    check_result 0 "No hay directorios node_modules en el repositorio"
else
    check_result 1 "Directorios node_modules encontrados (deberían estar excluidos)"
fi

# Verificar archivos log
if ! find . -name "*.log" -type f | grep -q .; then
    check_result 0 "No hay archivos de log en el repositorio"
else
    check_result 1 "Archivos de log encontrados (deberían estar excluidos)"
fi

# Verificar .next
if [ ! -d "./app/.next" ]; then
    check_result 0 "No hay directorio .next (build) en el repositorio"
else
    check_result 1 "Directorio .next encontrado (debería estar excluido)"
fi

echo ""
echo "📋 VERIFICACIONES DE ARCHIVOS OBLIGATORIOS:"
echo "-------------------------------------------"

# Verificar README.md
[ -f "./README.md" ] && check_result 0 "README.md presente" || check_result 1 "README.md faltante"

# Verificar .gitignore
[ -f "./.gitignore" ] && check_result 0 ".gitignore presente" || check_result 1 ".gitignore faltante"

# Verificar LICENSE
[ -f "./LICENSE" ] && check_result 0 "LICENSE presente" || check_result 1 "LICENSE faltante"

# Verificar .env.example
[ -f "./app/.env.example" ] && check_result 0 ".env.example presente" || check_result 1 ".env.example faltante"

# Verificar SECURITY.md
[ -f "./SECURITY.md" ] && check_result 0 "SECURITY.md presente" || check_result 1 "SECURITY.md faltante"

# Verificar CONTRIBUTING.md
[ -f "./CONTRIBUTING.md" ] && check_result 0 "CONTRIBUTING.md presente" || check_result 1 "CONTRIBUTING.md faltante"

echo ""
echo "🛠️ VERIFICACIONES TÉCNICAS:"
echo "----------------------------"

# Verificar package.json
[ -f "./app/package.json" ] && check_result 0 "package.json presente" || check_result 1 "package.json faltante"

# Verificar prisma schema
[ -f "./app/prisma/schema.prisma" ] && check_result 0 "Prisma schema presente" || check_result 1 "Prisma schema faltante"

# Verificar next.config.js
[ -f "./app/next.config.js" ] && check_result 0 "next.config.js presente" || check_result 1 "next.config.js faltante"

# Verificar tailwind.config.js
[ -f "./app/tailwind.config.js" ] && check_result 0 "tailwind.config.js presente" || check_result 1 "tailwind.config.js faltante"

echo ""
echo "📚 VERIFICACIONES DE DOCUMENTACIÓN:"
echo "------------------------------------"

# Verificar guías principales
[ -f "./PREPARACION_GITHUB.md" ] && check_result 0 "Guía de preparación GitHub presente" || check_result 1 "Guía de preparación GitHub faltante"

[ -f "./GUIA_COMPLETA_IMPORTACION_2025.md" ] && check_result 0 "Guía de importación presente" || check_result 1 "Guía de importación faltante"

[ -f "./DEPLOYMENT_GUIDE.md" ] && check_result 0 "Guía de deployment presente" || check_result 1 "Guía de deployment faltante"

echo ""
echo "🎯 RESUMEN FINAL:"
echo "=================="

percentage=$((success_count * 100 / total_checks))

if [ $percentage -eq 100 ]; then
    echo -e "${GREEN}🎉 PERFECTO: $success_count/$total_checks verificaciones pasadas (100%)${NC}"
    echo -e "${GREEN}✅ El proyecto está LISTO para subir a GitHub${NC}"
    echo ""
    echo "🚀 Siguientes pasos:"
    echo "1. git init (si no está inicializado)"
    echo "2. git add ."
    echo "3. git commit -m 'Initial commit: EscalaFin MVP'"
    echo "4. git remote add origin https://github.com/tu-usuario/escalafin-mvp.git"
    echo "5. git push -u origin main"
elif [ $percentage -ge 80 ]; then
    echo -e "${YELLOW}⚠️  CASI LISTO: $success_count/$total_checks verificaciones pasadas ($percentage%)${NC}"
    echo -e "${YELLOW}🔧 Revisa los elementos faltantes antes de subir${NC}"
else
    echo -e "${RED}❌ NO LISTO: $success_count/$total_checks verificaciones pasadas ($percentage%)${NC}"
    echo -e "${RED}🚨 Necesitas corregir varios elementos antes de subir a GitHub${NC}"
fi

echo ""
echo "📋 Para más detalles, revisa: PREPARACION_GITHUB.md"
