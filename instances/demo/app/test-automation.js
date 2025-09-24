
// 🧪 Script de Testing Automatizado - EscalaFin MVP
// Automatización de pruebas para APIs y funcionalidades críticas

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
let sessionCookie = '';

// 🎨 Colores para el output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// 📝 Función de logging con colores
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 🔧 Utilidades de testing
async function makeRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie,
        ...headers
      }
    };
    
    if (data) config.data = data;
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status || 0
    };
  }
}

// 🔐 MÓDULO 1: Testing de Autenticación
async function testAuthentication() {
  log('\n🔐 INICIANDO TESTING DE AUTENTICACIÓN', 'blue');
  log('=' .repeat(50), 'blue');
  
  let results = {
    total: 0,
    passed: 0,
    failed: 0,
    details: []
  };

  // Test 1: Verificar página de login
  log('\n📋 Test 1: Verificar acceso a página de login');
  results.total++;
  try {
    const response = await axios.get(`${BASE_URL}/login`);
    if (response.status === 200) {
      log('✅ PASS: Página de login accesible', 'green');
      results.passed++;
      results.details.push('✅ Página de login: OK');
    }
  } catch (error) {
    log('❌ FAIL: Error accediendo página de login', 'red');
    results.failed++;
    results.details.push('❌ Página de login: FAIL');
  }

  // Test 2: Verificar API de sesión sin autenticación
  log('\n📋 Test 2: API de sesión sin autenticación');
  results.total++;
  const sessionTest = await makeRequest('GET', '/api/auth/session');
  if (sessionTest.status === 200 || sessionTest.status === 401) {
    log('✅ PASS: API de sesión responde correctamente', 'green');
    results.passed++;
    results.details.push('✅ API sesión: OK');
  } else {
    log('❌ FAIL: API de sesión no responde', 'red');
    results.failed++;
    results.details.push('❌ API sesión: FAIL');
  }

  // Test 3: Intentar acceso a ruta protegida sin auth
  log('\n📋 Test 3: Acceso a ruta protegida sin autenticación');
  results.total++;
  const protectedTest = await makeRequest('GET', '/api/admin/users');
  if (protectedTest.status === 401 || protectedTest.status === 403) {
    log('✅ PASS: Ruta protegida bloqueada correctamente', 'green');
    results.passed++;
    results.details.push('✅ Protección de rutas: OK');
  } else {
    log('❌ FAIL: Ruta protegida no está protegida', 'red');
    results.failed++;
    results.details.push('❌ Protección de rutas: FAIL');
  }

  // Resumen del módulo
  log(`\n📊 RESUMEN AUTENTICACIÓN:`, 'yellow');
  log(`Total tests: ${results.total}`, 'yellow');
  log(`✅ Pasaron: ${results.passed}`, 'green');
  log(`❌ Fallaron: ${results.failed}`, 'red');
  log(`🎯 Tasa éxito: ${((results.passed/results.total)*100).toFixed(1)}%`, 'blue');
  
  return results;
}

// 👥 MÓDULO 2: Testing de Gestión de Usuarios
async function testUserManagement() {
  log('\n👥 INICIANDO TESTING DE GESTIÓN DE USUARIOS', 'blue');
  log('=' .repeat(50), 'blue');
  
  let results = {
    total: 0,
    passed: 0,
    failed: 0,
    details: []
  };

  // Test 1: API de usuarios sin autenticación (debe fallar)
  log('\n📋 Test 1: API de usuarios sin autenticación');
  results.total++;
  const usersTest = await makeRequest('GET', '/api/admin/users');
  if (usersTest.status === 401 || usersTest.status === 403) {
    log('✅ PASS: API usuarios protegida correctamente', 'green');
    results.passed++;
    results.details.push('✅ API usuarios protegida: OK');
  } else {
    log('❌ FAIL: API usuarios no protegida', 'red');
    results.failed++;
    results.details.push('❌ API usuarios protegida: FAIL');
  }

  // Test 2: Verificar estructura de endpoints
  log('\n📋 Test 2: Verificar endpoints de usuarios');
  results.total++;
  const endpoints = ['/api/admin/users'];
  let endpointsOk = true;
  
  for (let endpoint of endpoints) {
    const test = await makeRequest('GET', endpoint);
    if (test.status !== 401 && test.status !== 403 && test.status !== 200) {
      endpointsOk = false;
      break;
    }
  }
  
  if (endpointsOk) {
    log('✅ PASS: Endpoints de usuarios configurados correctamente', 'green');
    results.passed++;
    results.details.push('✅ Endpoints usuarios: OK');
  } else {
    log('❌ FAIL: Algunos endpoints no están configurados', 'red');
    results.failed++;
    results.details.push('❌ Endpoints usuarios: FAIL');
  }

  // Resumen del módulo
  log(`\n📊 RESUMEN GESTIÓN DE USUARIOS:`, 'yellow');
  log(`Total tests: ${results.total}`, 'yellow');
  log(`✅ Pasaron: ${results.passed}`, 'green');
  log(`❌ Fallaron: ${results.failed}`, 'red');
  log(`🎯 Tasa éxito: ${((results.passed/results.total)*100).toFixed(1)}%`, 'blue');
  
  return results;
}

// 👤 MÓDULO 3: Testing de Gestión de Clientes
async function testClientManagement() {
  log('\n👤 INICIANDO TESTING DE GESTIÓN DE CLIENTES', 'blue');
  log('=' .repeat(50), 'blue');
  
  let results = {
    total: 0,
    passed: 0,
    failed: 0,
    details: []
  };

  // Test 1: API de clientes
  log('\n📋 Test 1: API de clientes');
  results.total++;
  const clientsTest = await makeRequest('GET', '/api/clients');
  if (clientsTest.status === 401 || clientsTest.status === 403 || clientsTest.status === 200) {
    log('✅ PASS: API clientes responde correctamente', 'green');
    results.passed++;
    results.details.push('✅ API clientes: OK');
  } else {
    log('❌ FAIL: API clientes no configurada', 'red');
    results.failed++;
    results.details.push('❌ API clientes: FAIL');
  }

  // Test 2: API de búsqueda de clientes
  log('\n📋 Test 2: API de búsqueda de clientes');
  results.total++;
  const searchTest = await makeRequest('GET', '/api/clients/search?q=test');
  if (searchTest.status === 401 || searchTest.status === 403 || searchTest.status === 200) {
    log('✅ PASS: API búsqueda clientes configurada', 'green');
    results.passed++;
    results.details.push('✅ API búsqueda clientes: OK');
  } else {
    log('❌ FAIL: API búsqueda clientes no configurada', 'red');
    results.failed++;
    results.details.push('❌ API búsqueda clientes: FAIL');
  }

  // Test 3: API de referencias personales
  log('\n📋 Test 3: API de referencias personales');
  results.total++;
  const referencesTest = await makeRequest('GET', '/api/personal-references');
  if (referencesTest.status === 401 || referencesTest.status === 403 || referencesTest.status === 200) {
    log('✅ PASS: API referencias personales configurada', 'green');
    results.passed++;
    results.details.push('✅ API referencias: OK');
  } else {
    log('❌ FAIL: API referencias personales no configurada', 'red');
    results.failed++;
    results.details.push('❌ API referencias: FAIL');
  }

  // Resumen del módulo
  log(`\n📊 RESUMEN GESTIÓN DE CLIENTES:`, 'yellow');
  log(`Total tests: ${results.total}`, 'yellow');
  log(`✅ Pasaron: ${results.passed}`, 'green');
  log(`❌ Fallaron: ${results.failed}`, 'red');
  log(`🎯 Tasa éxito: ${((results.passed/results.total)*100).toFixed(1)}%`, 'blue');
  
  return results;
}

// 💳 MÓDULO 4: Testing de Sistema de Préstamos
async function testLoanManagement() {
  log('\n💳 INICIANDO TESTING DE SISTEMA DE PRÉSTAMOS', 'blue');
  log('=' .repeat(50), 'blue');
  
  let results = {
    total: 0,
    passed: 0,
    failed: 0,
    details: []
  };

  // Test 1: API de solicitudes de crédito
  log('\n📋 Test 1: API de solicitudes de crédito');
  results.total++;
  const applicationsTest = await makeRequest('GET', '/api/credit-applications');
  if (applicationsTest.status === 401 || applicationsTest.status === 403 || applicationsTest.status === 200) {
    log('✅ PASS: API solicitudes crédito configurada', 'green');
    results.passed++;
    results.details.push('✅ API solicitudes: OK');
  } else {
    log('❌ FAIL: API solicitudes crédito no configurada', 'red');
    results.failed++;
    results.details.push('❌ API solicitudes: FAIL');
  }

  // Test 2: API de préstamos
  log('\n📋 Test 2: API de préstamos');
  results.total++;
  const loansTest = await makeRequest('GET', '/api/loans');
  if (loansTest.status === 401 || loansTest.status === 403 || loansTest.status === 200) {
    log('✅ PASS: API préstamos configurada', 'green');
    results.passed++;
    results.details.push('✅ API préstamos: OK');
  } else {
    log('❌ FAIL: API préstamos no configurada', 'red');
    results.failed++;
    results.details.push('❌ API préstamos: FAIL');
  }

  // Test 3: API de búsqueda de préstamos
  log('\n📋 Test 3: API de búsqueda de préstamos');
  results.total++;
  const loanSearchTest = await makeRequest('GET', '/api/loans/search?q=test');
  if (loanSearchTest.status === 401 || loanSearchTest.status === 403 || loanSearchTest.status === 200) {
    log('✅ PASS: API búsqueda préstamos configurada', 'green');
    results.passed++;
    results.details.push('✅ API búsqueda préstamos: OK');
  } else {
    log('❌ FAIL: API búsqueda préstamos no configurada', 'red');
    results.failed++;
    results.details.push('❌ API búsqueda préstamos: FAIL');
  }

  // Test 4: API de scoring crediticio
  log('\n📋 Test 4: API de scoring crediticio');
  results.total++;
  const scoringTest = await makeRequest('POST', '/api/scoring/calculate', { clientId: 'test' });
  if (scoringTest.status === 401 || scoringTest.status === 403 || scoringTest.status === 400 || scoringTest.status === 200) {
    log('✅ PASS: API scoring configurada', 'green');
    results.passed++;
    results.details.push('✅ API scoring: OK');
  } else {
    log('❌ FAIL: API scoring no configurada', 'red');
    results.failed++;
    results.details.push('❌ API scoring: FAIL');
  }

  // Resumen del módulo
  log(`\n📊 RESUMEN SISTEMA DE PRÉSTAMOS:`, 'yellow');
  log(`Total tests: ${results.total}`, 'yellow');
  log(`✅ Pasaron: ${results.passed}`, 'green');
  log(`❌ Fallaron: ${results.failed}`, 'red');
  log(`🎯 Tasa éxito: ${((results.passed/results.total)*100).toFixed(1)}%`, 'blue');
  
  return results;
}

// 🎯 Función principal de testing
async function runAllTests() {
  log('🚀 INICIANDO TESTING COMPLETO DE MÓDULOS CORE', 'blue');
  log('=' .repeat(60), 'blue');
  log(`📅 Fecha: ${new Date().toLocaleString()}`, 'blue');
  log(`🌐 URL Base: ${BASE_URL}`, 'blue');
  
  const allResults = {
    modules: {},
    summary: { total: 0, passed: 0, failed: 0 }
  };

  try {
    // Ejecutar todos los tests
    allResults.modules.authentication = await testAuthentication();
    allResults.modules.userManagement = await testUserManagement();
    allResults.modules.clientManagement = await testClientManagement();
    allResults.modules.loanManagement = await testLoanManagement();

    // Calcular resumen general
    Object.values(allResults.modules).forEach(module => {
      allResults.summary.total += module.total;
      allResults.summary.passed += module.passed;
      allResults.summary.failed += module.failed;
    });

    // Mostrar resumen final
    log('\n🎯 RESUMEN FINAL DE TESTING', 'blue');
    log('=' .repeat(50), 'blue');
    log(`📊 Total tests ejecutados: ${allResults.summary.total}`, 'yellow');
    log(`✅ Tests exitosos: ${allResults.summary.passed}`, 'green');
    log(`❌ Tests fallidos: ${allResults.summary.failed}`, 'red');
    log(`🏆 Tasa de éxito general: ${((allResults.summary.passed/allResults.summary.total)*100).toFixed(1)}%`, 'blue');
    
    // Estado por módulo
    log('\n📋 ESTADO POR MÓDULO:', 'yellow');
    Object.entries(allResults.modules).forEach(([module, results]) => {
      const successRate = ((results.passed/results.total)*100).toFixed(1);
      const status = successRate >= 80 ? '🟢' : successRate >= 50 ? '🟡' : '🔴';
      log(`${status} ${module}: ${results.passed}/${results.total} (${successRate}%)`, 'yellow');
    });

    // Recomendaciones
    log('\n💡 RECOMENDACIONES:', 'yellow');
    if (allResults.summary.failed > 0) {
      log('⚠️  Se detectaron issues que requieren atención', 'yellow');
      log('🔧 Revisar logs específicos de cada módulo fallido', 'yellow');
      log('🚀 Ejecutar tests manuales para validar funcionalidad UI', 'yellow');
    } else {
      log('🎉 Todos los tests automáticos pasaron correctamente', 'green');
      log('✅ Sistema listo para testing manual de UI', 'green');
    }

  } catch (error) {
    log(`❌ Error en testing: ${error.message}`, 'red');
  }

  log('\n🏁 TESTING AUTOMÁTICO COMPLETADO', 'blue');
  log('=' .repeat(50), 'blue');
}

// Ejecutar tests si es llamado directamente
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testAuthentication,
  testUserManagement,
  testClientManagement,
  testLoanManagement
};
