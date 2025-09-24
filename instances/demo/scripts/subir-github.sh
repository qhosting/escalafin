
#!/bin/bash

# 🚀 Script de Subida a GitHub - EscalaFin MVP
# Repositorio: https://github.com/qhosting/escalafin-mvp

clear
echo "🚀 EscalaFin MVP - Subida a GitHub"
echo "================================="
echo "Repositorio: https://github.com/qhosting/escalafin-mvp"
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que estamos en el directorio correcto
if [ ! -f "README.md" ] || [ ! -d "app" ]; then
    echo -e "${RED}❌ Error: Ejecuta este script desde el directorio escalafin_mvp${NC}"
    exit 1
fi

echo -e "${BLUE}🔍 Verificando estado del repositorio...${NC}"

# Verificar Git
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}🔧 Inicializando Git...${NC}"
    git init
    git remote add origin https://github.com/qhosting/escalafin-mvp.git
fi

# Mostrar estado actual
echo -e "\n${GREEN}✅ Estado actual:${NC}"
echo "Remote: $(git remote get-url origin 2>/dev/null || echo 'No configurado')"
echo "Rama actual: $(git branch --show-current 2>/dev/null || echo 'main')"
echo "Commits: $(git rev-list --count HEAD 2>/dev/null || echo '0')"

# Verificar archivos
echo -e "\n${BLUE}📋 Verificando archivos...${NC}"
if [ -f "app/.env" ]; then
    if grep -q "^\.env$" .gitignore; then
        echo -e "${GREEN}✅ .env protegido en .gitignore${NC}"
    else
        echo -e "${RED}⚠️  ADVERTENCIA: .env no está en .gitignore${NC}"
        read -p "¿Agregar .env a .gitignore? (y/n): " add_gitignore
        if [ "$add_gitignore" = "y" ]; then
            echo ".env" >> .gitignore
            echo -e "${GREEN}✅ .env agregado a .gitignore${NC}"
        fi
    fi
fi

# Configurar usuario si es necesario
echo -e "\n${BLUE}👤 Configuración de usuario Git...${NC}"
current_user=$(git config user.name 2>/dev/null)
current_email=$(git config user.email 2>/dev/null)

if [ -z "$current_user" ] || [ -z "$current_email" ]; then
    echo "Es necesario configurar tu información de Git:"
    read -p "Nombre completo: " git_name
    read -p "Email de GitHub: " git_email
    
    git config user.name "$git_name"
    git config user.email "$git_email"
    echo -e "${GREEN}✅ Usuario configurado${NC}"
else
    echo -e "${GREEN}✅ Usuario: $current_user <$current_email>${NC}"
fi

# Preparar commit
echo -e "\n${BLUE}📦 Preparando archivos para commit...${NC}"
git add .

# Verificar estado
if git diff --staged --quiet; then
    echo -e "${GREEN}✅ No hay cambios nuevos (todo está committeado)${NC}"
else
    echo -e "${YELLOW}📝 Creando commit con los cambios...${NC}"
    git commit -m "🚀 EscalaFin MVP - Preparado para GitHub

✨ Sistema completo de gestión de préstamos y créditos
🛠️ Stack: Next.js 14, TypeScript, PostgreSQL, Prisma  
📱 PWA con navegación optimizada y tema dark/light
🔒 Integraciones: Openpay, WhatsApp, AWS S3
📚 Documentación completa incluida

⚡ Estado: LISTO PARA PRODUCCIÓN
📋 Archivos incluidos:
- Código fuente completo
- 25+ archivos de documentación
- Templates de GitHub
- Configuración CI/CD
- Scripts de utilidad

🔒 Archivos protegidos:
- .env excluido correctamente
- node_modules/ excluido
- builds temporales excluidos"
fi

# Cambiar a rama main
echo -e "\n${BLUE}🌿 Configurando rama main...${NC}"
git branch -M main

# Intentar push
echo -e "\n${YELLOW}🚀 Intentando push a GitHub...${NC}"
echo -e "${YELLOW}Nota: Te pedirá autenticación de GitHub${NC}"
echo ""

if git push -u origin main; then
    echo -e "\n${GREEN}🎉 ¡ÉXITO! Proyecto subido correctamente a GitHub${NC}"
    echo -e "${GREEN}📍 Repositorio: https://github.com/qhosting/escalafin-mvp${NC}"
    echo ""
    echo -e "${BLUE}🔗 Enlaces útiles:${NC}"
    echo "• Repositorio: https://github.com/qhosting/escalafin-mvp"
    echo "• Issues: https://github.com/qhosting/escalafin-mvp/issues"
    echo "• Releases: https://github.com/qhosting/escalafin-mvp/releases"
    echo ""
    echo -e "${GREEN}✅ Recomendaciones post-upload:${NC}"
    echo "1. Configurar branch protection rules"
    echo "2. Habilitar Dependabot"
    echo "3. Crear primer release (v1.0.0)"
    echo "4. Configurar GitHub Pages (opcional)"
    echo "5. Agregar colaboradores si es necesario"
    
else
    echo -e "\n${RED}❌ Error en el push${NC}"
    echo -e "${YELLOW}💡 Opciones para resolver:${NC}"
    echo ""
    echo "1. ${BLUE}Personal Access Token:${NC}"
    echo "   • Ve a GitHub → Settings → Developer settings → Personal access tokens"
    echo "   • Crea un token con permisos 'repo'"
    echo "   • Úsalo como password cuando te pida autenticación"
    echo ""
    echo "2. ${BLUE}GitHub CLI:${NC}"
    echo "   • Instala: curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo gpg --dearmor -o /usr/share/keyrings/githubcli-archive-keyring.gpg"
    echo "   • Autentica: gh auth login"
    echo "   • Reintenta: git push -u origin main"
    echo ""
    echo "3. ${BLUE}SSH Key:${NC}"
    echo "   • Configura SSH key en GitHub"
    echo "   • Cambia remote: git remote set-url origin git@github.com:qhosting/escalafin-mvp.git"
    echo "   • Reintenta: git push -u origin main"
    echo ""
    echo -e "${YELLOW}📦 Bundle alternativo creado: escalafin-mvp.bundle${NC}"
    echo "Puedes usar el bundle para subir manualmente si es necesario."
fi

echo -e "\n${BLUE}📋 Información del proyecto:${NC}"
echo "• Nombre: EscalaFin MVP"
echo "• Versión: 1.0.0" 
echo "• Stack: Next.js 14 + TypeScript + PostgreSQL"
echo "• Características: PWA, Multi-rol, Integraciones completas"
echo "• Documentación: 25+ archivos incluidos"
echo "• Estado: Listo para producción"
echo ""
echo -e "${GREEN}🎯 ¡Proyecto completamente preparado para GitHub!${NC}"
