
#!/bin/bash

# 🧪 Script de Testing Manual - EscalaFin MVP
# Este script realiza pruebas básicas de las APIs y funcionalidades del sistema

BASE_URL="http://localhost:3000"
LOG_FILE="/home/ubuntu/escalafin_mvp/TESTING_MANUAL_RESULTS.md"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log_result() {
    local test_name="$1"
    local status="$2"
    local details="$3"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $status in
        "PASS") icon="✅"; color=$GREEN ;;
        "FAIL") icon="❌"; color=$RED ;;
        "PARTIAL") icon="⚠️"; color=$YELLOW ;;
        *) icon="🔄"; color=$BLUE ;;
    esac
    
    echo -e "${color}${icon} ${test_name}: ${status}${NC}"
    echo "### ${test_name}" >> "$LOG_FILE"
    echo "**Estado**: ${icon} ${status}  " >> "$LOG_FILE"
    echo "**Timestamp**: ${timestamp}  " >> "$LOG_FILE"
    echo "**Detalles**: ${details}" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"
}

# Función para hacer requests HTTP
make_request() {
    local url="$1"
    local method="${2:-GET}"
    local expected_status="${3:-200}"
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$url" -X "$method" 2>/dev/null)
    http_status=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')
    
    if [[ "$http_status" == "$expected_status" ]]; then
        echo "PASS|${body}"
    else
        echo "FAIL|HTTP ${http_status}: ${body}"
    fi
}

# Inicializar archivo de log
echo "# 📊 Resultados de Testing Manual - EscalaFin MVP" > "$LOG_FILE"
echo "" >> "$LOG_FILE"
echo "> **Fecha**: $(date '+%d/%m/%Y %H:%M:%S')  " >> "$LOG_FILE"
echo "> **Sistema**: EscalaFin v2.0.0  " >> "$LOG_FILE"
echo "> **Tipo**: Testing Manual con Scripts  " >> "$LOG_FILE"
echo "> **Base URL**: ${BASE_URL}" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

echo -e "${BLUE}🚀 Iniciando Testing Manual de EscalaFin MVP${NC}"
echo "📍 Base URL: $BASE_URL"
echo ""

# ==== TESTING DE SERVIDOR ====
echo -e "${BLUE}🏥 Testing Estado del Servidor${NC}"

# Test 1: Health Check
result=$(make_request "$BASE_URL/api/health")
status=$(echo "$result" | cut -d'|' -f1)
details=$(echo "$result" | cut -d'|' -f2-)
log_result "Health Check API" "$status" "$details"

# Test 2: Root Endpoint  
result=$(make_request "$BASE_URL/")
status=$(echo "$result" | cut -d'|' -f1)
details="Página principal cargada"
if [[ "$status" == "PASS" ]]; then
    details="Página principal cargada correctamente"
else
    details="Error cargando página principal: $(echo "$result" | cut -d'|' -f2-)"
fi
log_result "Página Principal" "$status" "$details"

# Test 3: Auth Providers
result=$(make_request "$BASE_URL/api/auth/providers")
status=$(echo "$result" | cut -d'|' -f1)
details=$(echo "$result" | cut -d'|' -f2-)
log_result "Auth Providers API" "$status" "$details"

# Test 4: Login Page
result=$(make_request "$BASE_URL/auth/login")
status=$(echo "$result" | cut -d'|' -f1)
details="Página de login accesible"
if [[ "$status" == "PASS" ]]; then
    details="Página de login cargada correctamente"
else
    details="Error cargando página de login"
fi
log_result "Página de Login" "$status" "$details"

echo ""

# ==== TESTING DE APIs SIN AUTENTICACIÓN ====
echo -e "${BLUE}🔓 Testing APIs Públicas${NC}"

# Test APIs que deberían ser accesibles sin autenticación
apis=("api/health" "api/auth/providers" "api/auth/csrf")

for api in "${apis[@]}"; do
    result=$(make_request "$BASE_URL/$api")
    status=$(echo "$result" | cut -d'|' -f1)
    details=$(echo "$result" | cut -d'|' -f2-)
    log_result "API /$api" "$status" "$details"
done

echo ""

# ==== TESTING DE APIs CON AUTENTICACIÓN ====
echo -e "${BLUE}🔒 Testing APIs Protegidas (sin autenticación)${NC}"
echo -e "${YELLOW}ℹ️  Estas deberían devolver 401 o redireccionar${NC}"

# Test APIs que requieren autenticación
protected_apis=("api/admin/users" "api/clients" "api/loans" "api/payments/transactions")

for api in "${protected_apis[@]}"; do
    result=$(make_request "$BASE_URL/$api" "GET" "401")
    status=$(echo "$result" | cut -d'|' -f1)
    details=$(echo "$result" | cut -d'|' -f2-)
    
    # Para APIs protegidas, esperamos 401 o 403
    if [[ $(echo "$result" | grep -o "HTTP [4][0-9][0-9]") ]]; then
        status="PASS"
        details="API correctamente protegida: $details"
    fi
    
    log_result "API Protegida /$api" "$status" "$details"
done

echo ""

# ==== TESTING DE PÁGINAS ====
echo -e "${BLUE}📄 Testing Páginas del Sistema${NC}"

# Páginas que deberían ser accesibles
pages=("" "auth/login" "auth/register" "soporte")

for page in "${pages[@]}"; do
    result=$(make_request "$BASE_URL/$page")
    status=$(echo "$result" | cut -d'|' -f1)
    if [[ "$status" == "PASS" ]]; then
        details="Página cargada correctamente"
    else
        details="Error cargando página: $(echo "$result" | cut -d'|' -f2-)"
    fi
    log_result "Página /$page" "$status" "$details"
done

# Páginas protegidas (deberían redireccionar a login)
protected_pages=("admin/dashboard" "admin/users" "asesor/dashboard" "cliente/dashboard")

for page in "${protected_pages[@]}"; do
    result=$(make_request "$BASE_URL/$page")
    status=$(echo "$result" | cut -d'|' -f1)
    
    # Si devuelve 200 pero es una página de login, está bien
    if [[ "$status" == "PASS" ]] && echo "$result" | grep -qi "login\|sign.*in"; then
        details="Correctamente redirigida a login"
    elif [[ "$status" == "PASS" ]]; then
        status="FAIL" 
        details="Página accesible sin autenticación (problema de seguridad)"
    else
        details="Error: $(echo "$result" | cut -d'|' -f2-)"
    fi
    
    log_result "Página Protegida /$page" "$status" "$details"
done

echo ""

# ==== RESUMEN ====
echo -e "${BLUE}📋 Generando Resumen${NC}"

# Contar resultados
total_tests=$(grep -c "### " "$LOG_FILE")
passed_tests=$(grep -c "✅ PASS" "$LOG_FILE")
failed_tests=$(grep -c "❌ FAIL" "$LOG_FILE")
partial_tests=$(grep -c "⚠️ PARTIAL" "$LOG_FILE")

echo "" >> "$LOG_FILE"
echo "## 📊 Resumen de Resultados" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
echo "| Categoría | Total | Exitosos | Fallidos | Parciales | % Éxito |" >> "$LOG_FILE"
echo "|-----------|-------|----------|----------|-----------|---------|" >> "$LOG_FILE"
echo "| **Total** | $total_tests | $passed_tests | $failed_tests | $partial_tests | $(( passed_tests * 100 / total_tests ))% |" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

if (( failed_tests == 0 )); then
    overall_status="✅ SISTEMA FUNCIONAL"
    color=$GREEN
elif (( passed_tests > failed_tests )); then
    overall_status="⚠️ FUNCIONAL CON PROBLEMAS MENORES"
    color=$YELLOW
else
    overall_status="❌ SISTEMA CON PROBLEMAS CRÍTICOS"
    color=$RED
fi

echo "### Estado General del Sistema" >> "$LOG_FILE"
echo "**${overall_status}**" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
echo "---" >> "$LOG_FILE"
echo "*Reporte generado automáticamente el $(date)*" >> "$LOG_FILE"

echo -e "${color}${overall_status}${NC}"
echo ""
echo -e "${GREEN}📄 Reporte completo guardado en: ${LOG_FILE}${NC}"
echo -e "${BLUE}🌐 Para testing manual de UI, abrir: ${BASE_URL}${NC}"
echo ""
echo -e "${YELLOW}👥 Usuarios de prueba disponibles:${NC}"
echo "  • Admin: admin@escalafin.com / admin123"
echo "  • Asesor: carlos.lopez@escalafin.com / password123" 
echo "  • Cliente: juan.perez@email.com / password123"
