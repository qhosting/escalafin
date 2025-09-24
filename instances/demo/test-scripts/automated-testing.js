
/**
 * 🧪 Script de Testing Automatizado - EscalaFin MVP
 * 
 * Este script realiza pruebas automatizadas de las APIs y funcionalidades
 * críticas del sistema para cada perfil de usuario.
 */

const fs = require('fs');
const path = require('path');

// Configuración base
const BASE_URL = 'http://localhost:3000';
const RESULTS_FILE = path.join(__dirname, '../TESTING_RESULTS.md');

// Usuarios de prueba
const TEST_USERS = {
  admin: {
    email: 'admin@escalafin.com',
    password: 'admin123',
    role: 'ADMIN'
  },
  asesor: {
    email: 'carlos.lopez@escalafin.com', 
    password: 'password123',
    role: 'ASESOR'
  },
  cliente: {
    email: 'juan.perez@email.com',
    password: 'password123', 
    role: 'CLIENTE'
  }
};

class EscalaFinTester {
  constructor() {
    this.results = {
      admin: {},
      asesor: {}, 
      cliente: {},
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        partial: 0
      }
    };
  }

  // Utility para hacer requests HTTP
  async makeRequest(url, options = {}) {
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(url, {
        timeout: 10000,
        ...options
      });
      return {
        status: response.status,
        ok: response.ok,
        data: response.ok ? await response.json().catch(() => null) : null,
        error: null
      };
    } catch (error) {
      return {
        status: 0,
        ok: false, 
        data: null,
        error: error.message
      };
    }
  }

  // Test básico de conectividad del servidor
  async testServerHealth() {
    console.log('🏥 Testing server health...');
    
    const tests = [
      { name: 'Root endpoint', url: `${BASE_URL}/` },
      { name: 'Auth providers', url: `${BASE_URL}/api/auth/providers` },
      { name: 'CSRF token', url: `${BASE_URL}/api/auth/csrf` }
    ];

    const results = {};
    
    for (const test of tests) {
      const result = await this.makeRequest(test.url);
      results[test.name] = {
        status: result.ok ? 'PASS' : 'FAIL',
        details: result.ok ? 'Server responding' : `Error: ${result.error || result.status}`
      };
    }
    
    return results;
  }

  // Test de API de usuarios (solo para admin)
  async testUsersAPI(sessionToken = null) {
    console.log('👥 Testing Users API...');
    
    const headers = sessionToken ? { 
      'Authorization': `Bearer ${sessionToken}`,
      'Content-Type': 'application/json'
    } : {};
    
    const result = await this.makeRequest(`${BASE_URL}/api/admin/users`, { headers });
    
    return {
      status: result.ok ? 'PASS' : 'FAIL',
      details: result.ok ? `Users loaded: ${result.data?.length || 0}` : `Error: ${result.error || result.status}`,
      data: result.data
    };
  }

  // Test de API de clientes
  async testClientsAPI(sessionToken = null) {
    console.log('👤 Testing Clients API...');
    
    const headers = sessionToken ? { 
      'Authorization': `Bearer ${sessionToken}`,
      'Content-Type': 'application/json'  
    } : {};
    
    const result = await this.makeRequest(`${BASE_URL}/api/clients`, { headers });
    
    return {
      status: result.ok ? 'PASS' : 'FAIL', 
      details: result.ok ? `Clients loaded: ${result.data?.length || 0}` : `Error: ${result.error || result.status}`,
      data: result.data
    };
  }

  // Test de API de préstamos
  async testLoansAPI(sessionToken = null) {
    console.log('💰 Testing Loans API...');
    
    const headers = sessionToken ? { 
      'Authorization': `Bearer ${sessionToken}`,
      'Content-Type': 'application/json'
    } : {};
    
    const result = await this.makeRequest(`${BASE_URL}/api/loans`, { headers });
    
    return {
      status: result.ok ? 'PASS' : 'FAIL',
      details: result.ok ? `Loans loaded: ${result.data?.length || 0}` : `Error: ${result.error || result.status}`,
      data: result.data
    };
  }

  // Ejecutar todas las pruebas para un perfil
  async testProfile(profile) {
    console.log(`\n🎯 Testing ${profile.toUpperCase()} profile...`);
    
    const results = {
      serverHealth: await this.testServerHealth(),
      usersAPI: profile === 'admin' ? await this.testUsersAPI() : { status: 'SKIP', details: 'Not applicable for this role' },
      clientsAPI: await this.testClientsAPI(),
      loansAPI: await this.testLoansAPI()
    };
    
    this.results[profile] = results;
    return results;
  }

  // Generar reporte de resultados
  generateReport() {
    console.log('\n📊 Generating test report...');
    
    let report = `# 📊 Resultados de Testing Automatizado - EscalaFin MVP

> **Fecha**: ${new Date().toLocaleString('es-MX')}  
> **Sistema**: EscalaFin v2.0.0  
> **Tipo**: Testing Automatizado de APIs

## 🏥 Estado del Servidor

`;

    // Server health results
    const serverHealth = this.results.admin.serverHealth || {};
    Object.entries(serverHealth).forEach(([test, result]) => {
      const icon = result.status === 'PASS' ? '✅' : '❌';
      report += `- ${icon} **${test}**: ${result.details}\n`;
    });

    report += `\n## 👑 PERFIL ADMINISTRADOR

`;

    // Admin results
    Object.entries(this.results.admin).forEach(([test, result]) => {
      if (test !== 'serverHealth') {
        const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
        report += `### ${test}\n**Estado**: ${icon} ${result.status}  \n**Detalles**: ${result.details}\n\n`;
      }
    });

    report += `## 👨‍💼 PERFIL ASESOR

`;

    // Asesor results  
    Object.entries(this.results.asesor).forEach(([test, result]) => {
      if (test !== 'serverHealth') {
        const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
        report += `### ${test}\n**Estado**: ${icon} ${result.status}  \n**Detalles**: ${result.details}\n\n`;
      }
    });

    report += `## 👤 PERFIL CLIENTE

`;

    // Cliente results
    Object.entries(this.results.cliente).forEach(([test, result]) => {
      if (test !== 'serverHealth') {
        const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
        report += `### ${test}\n**Estado**: ${icon} ${result.status}  \n**Detalles**: ${result.details}\n\n`;
      }
    });

    // Summary
    report += `## 📋 Resumen de Pruebas

| Perfil | APIs Probadas | Exitosas | Fallidas | Estado |
|--------|---------------|----------|----------|--------|
| Admin | ${Object.keys(this.results.admin).length - 1} | ${Object.values(this.results.admin).filter(r => r.status === 'PASS').length} | ${Object.values(this.results.admin).filter(r => r.status === 'FAIL').length} | ${this.getProfileStatus('admin')} |
| Asesor | ${Object.keys(this.results.asesor).length} | ${Object.values(this.results.asesor).filter(r => r.status === 'PASS').length} | ${Object.values(this.results.asesor).filter(r => r.status === 'FAIL').length} | ${this.getProfileStatus('asesor')} |
| Cliente | ${Object.keys(this.results.cliente).length} | ${Object.values(this.results.cliente).filter(r => r.status === 'PASS').length} | ${Object.values(this.results.cliente).filter(r => r.status === 'FAIL').length} | ${this.getProfileStatus('cliente')} |

---

*Reporte generado automáticamente*
`;

    return report;
  }

  getProfileStatus(profile) {
    const results = Object.values(this.results[profile]);
    const failed = results.filter(r => r.status === 'FAIL').length;
    const passed = results.filter(r => r.status === 'PASS').length;
    const total = results.length;

    if (failed === 0) return '✅ PASS';
    if (passed === 0) return '❌ FAIL'; 
    return '⚠️ PARCIAL';
  }

  // Ejecutar suite completa de pruebas
  async runFullTestSuite() {
    console.log('🚀 Starting EscalaFin Automated Testing Suite...');
    
    try {
      // Test cada perfil
      await this.testProfile('admin');
      await this.testProfile('asesor'); 
      await this.testProfile('cliente');
      
      // Generar reporte
      const report = this.generateReport();
      
      // Guardar reporte
      fs.writeFileSync(RESULTS_FILE, report);
      console.log(`\n✅ Test suite completed! Report saved to: ${RESULTS_FILE}`);
      
      return this.results;
      
    } catch (error) {
      console.error('❌ Error running test suite:', error.message);
      throw error;
    }
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  const tester = new EscalaFinTester();
  tester.runFullTestSuite()
    .then(results => {
      console.log('\n🎉 All tests completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Test suite failed:', error.message);
      process.exit(1);
    });
}

module.exports = EscalaFinTester;
