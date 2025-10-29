
#!/bin/bash

# Script de Verificación de Links en Dashboards
# Verifica que todos los enlaces en los dashboards apunten a rutas válidas

cd "$(dirname "$0")/.." || exit 1

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORES=0
TOTAL=0

echo "=========================================="
echo "  🔗 VERIFICACIÓN DE LINKS - DASHBOARDS"
echo "=========================================="
echo ""

# Función para verificar ruta
verificar_ruta() {
    local ruta=$1
    local descripcion=$2
    ((TOTAL++))
    
    if [ -f "app/app/$ruta/page.tsx" ] || [ -f "app/app/$ruta/page.js" ]; then
        echo -e "${GREEN}✅${NC} /$ruta - $descripcion"
    else
        echo -e "${RED}❌${NC} /$ruta - $descripcion ${RED}(NO ENCONTRADO)${NC}"
        ((ERRORES++))
    fi
}

# ==========================================
# ADMIN DASHBOARD
# ==========================================
echo -e "${BLUE}━━━ ADMIN DASHBOARD ━━━${NC}"
verificar_ruta "admin/analytics" "Analytics Avanzado"
verificar_ruta "admin/audit" "Sistema de Auditoría"
verificar_ruta "admin/clients" "Gestión de Clientes"
verificar_ruta "admin/config" "Config. Sistema"
verificar_ruta "admin/credit-applications" "Solicitudes de Crédito"
verificar_ruta "admin/files" "Gestión de Archivos"
verificar_ruta "admin/loans" "Gestionar Préstamos"
verificar_ruta "admin/loans/new" "Nuevo Préstamo"
verificar_ruta "admin/message-recharges" "Recarga Mensajes"
verificar_ruta "admin/modules" "Gestión de Módulos"
verificar_ruta "admin/payments" "Pagos Openpay"
verificar_ruta "admin/reports" "Generar Reportes"
verificar_ruta "admin/scoring" "Scoring Crediticio"
verificar_ruta "admin/settings" "Configuración"
verificar_ruta "admin/storage" "Almacenamiento"
verificar_ruta "admin/users" "Gestionar Usuarios"
verificar_ruta "admin/whatsapp/clients" "Config. Clientes WA"
verificar_ruta "admin/whatsapp/config" "Config. EvolutionAPI"
verificar_ruta "admin/whatsapp/messages" "Dashboard Mensajes"
verificar_ruta "notifications" "Notificaciones"

echo ""

# ==========================================
# ASESOR DASHBOARD
# ==========================================
echo -e "${BLUE}━━━ ASESOR DASHBOARD ━━━${NC}"
verificar_ruta "asesor/clients" "Mis Clientes"
verificar_ruta "asesor/credit-applications" "Solicitudes de Crédito"
verificar_ruta "asesor/loans" "Mis Préstamos"
verificar_ruta "asesor/loans/new" "Nuevo Préstamo"
verificar_ruta "mobile/cobranza" "Registrar Pago"

echo ""

# ==========================================
# CLIENTE DASHBOARD
# ==========================================
echo -e "${BLUE}━━━ CLIENTE DASHBOARD ━━━${NC}"
verificar_ruta "cliente/credit-applications" "Mis Solicitudes"
verificar_ruta "cliente/loans" "Mis Préstamos"
verificar_ruta "cliente/payments" "Mis Pagos"

echo ""
echo "=========================================="
echo -e "📊 ${BLUE}RESUMEN${NC}"
echo "=========================================="
echo -e "Total de links verificados: ${BLUE}$TOTAL${NC}"

if [ $ERRORES -eq 0 ]; then
    echo -e "Links rotos: ${GREEN}0${NC}"
    echo ""
    echo -e "${GREEN}✅ ¡Todos los links están funcionando!${NC}"
    exit 0
else
    echo -e "Links rotos: ${RED}$ERRORES${NC}"
    echo ""
    echo -e "${RED}❌ Se encontraron links rotos. Revisar y corregir.${NC}"
    exit 1
fi
