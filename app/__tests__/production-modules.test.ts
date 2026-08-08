/**
 * Suite de Pruebas Unitarias - Módulos de Producción EscalaFin v3.0.0
 * Tests para: Firma NOM-151, Offline Sync Engine y WhatsApp Flows
 */

import { nom151SignatureService } from '../lib/nom151-signature';
import { WhatsAppFlowsService } from '../lib/whatsapp-flows';

describe('Pruebas del Módulo de Firma Digital NOM-151', () => {
  const documentContent = 'PAGARÉ INCONDICIONAL POR LA CANTIDAD DE $10,000.00 MXN';
  const loanId = 'loan_test_123';
  const tenantId = 'tenant_demo_456';
  const biometrics = {
    signatureBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    signerName: 'Juan Pérez García',
    signerIp: '192.168.1.100',
    latitude: 19.432608,
    longitude: -99.133209,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    timestamp: new Date().toISOString(),
  };

  test('Debe calcular correctamente el hash SHA-256 del contenido del documento', () => {
    const hash = nom151SignatureService.computeDocumentHash(documentContent);
    expect(hash).toBeDefined();
    expect(hash.length).toBe(64); // Longitud estándar SHA-256 en hex
  });

  test('Debe generar una constancia de auditoría NOM-151 válida', () => {
    const auditTrail = nom151SignatureService.generateAuditTrail(
      loanId,
      tenantId,
      documentContent,
      biometrics
    );

    expect(auditTrail).toBeDefined();
    expect(auditTrail.loanId).toBe(loanId);
    expect(auditTrail.tenantId).toBe(tenantId);
    expect(auditTrail.documentHash).toBeDefined();
    expect(auditTrail.signatureHash).toBeDefined();
    expect(auditTrail.evidencePackage.certificateSerial).toContain('ESCALAFIN-NOM151-CERT-');
  });

  test('Debe verificar exitosamente la integridad de un documento firmado no alterado', () => {
    const auditTrail = nom151SignatureService.generateAuditTrail(
      loanId,
      tenantId,
      documentContent,
      biometrics
    );

    const isValid = nom151SignatureService.verifyAuditTrail(documentContent, auditTrail);
    expect(isValid).toBe(true);
  });

  test('Debe rechazar la verificación si el contenido del Pagaré fue alterado', () => {
    const auditTrail = nom151SignatureService.generateAuditTrail(
      loanId,
      tenantId,
      documentContent,
      biometrics
    );

    const tamperedContent = 'PAGARÉ INCONDICIONAL POR LA CANTIDAD DE $50,000.00 MXN'; // Monto alterado
    const isValid = nom151SignatureService.verifyAuditTrail(tamperedContent, auditTrail);
    expect(isValid).toBe(false);
  });
});

describe('Pruebas del Módulo de WhatsApp Flows Interáctivos', () => {
  let flowsService: WhatsAppFlowsService;

  beforeEach(() => {
    flowsService = new WhatsAppFlowsService('tenant_demo');
  });

  test('Debe generar el esquema interactivo para Solicitud de Crédito', () => {
    const flowDef = flowsService.getCreditRequestFlowDefinition();
    expect(flowDef).toBeDefined();
    expect(flowDef.version).toBe('3.0');
    expect(flowDef.screens.length).toBeGreaterThanOrEqual(2);
    
    const firstScreen = flowDef.screens[0];
    expect(firstScreen.id).toBe('CREDIT_SELECTION');
    expect(firstScreen.layout.children.some(child => child.name === 'requested_amount')).toBe(true);
  });

  test('Debe generar el esquema interactivo para Promesas de Pago', () => {
    const flowDef = flowsService.getPromiseToPayFlowDefinition();
    expect(flowDef).toBeDefined();
    expect(flowDef.screens.length).toBe(1);
    
    const promiseScreen = flowDef.screens[0];
    expect(promiseScreen.id).toBe('PROMISE_PAYMENT');
    expect(promiseScreen.layout.children.some(child => child.name === 'promised_amount')).toBe(true);
    expect(promiseScreen.layout.children.some(child => child.name === 'promised_date')).toBe(true);
  });
});
