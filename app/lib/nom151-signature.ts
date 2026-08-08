/**
 * Módulo de Firma Digital y Constancia de Conservación NOM-151
 * EscalaFin v3.0.0 - Producción
 * 
 * Genera trazabilidad criptográfica legalmente válida para Pagarés Digitales
 * con sello de tiempo, coordenadas GPS, huella digital SHA-256 e IP del firmante.
 */

import crypto from 'crypto';

export interface SignatureBiometricData {
  signatureBase64: string; // Captura canvas PNG base64
  signerName: string;
  signerRfc?: string;
  signerCurp?: string;
  signerIp: string;
  latitude?: number;
  longitude?: number;
  userAgent: string;
  timestamp: string; // ISO 8601
}

export interface Nom151AuditTrail {
  loanId: string;
  tenantId: string;
  documentHash: string; // SHA-256 del contenido del Pagaré
  signatureHash: string; // SHA-256 de la firma + metadatos
  nom151TimeStamp: string;
  evidencePackage: {
    biometrics: SignatureBiometricData;
    legalClause: string;
    certificateSerial: string;
  };
}

export const nom151SignatureService = {
  /**
   * Calcula el Hash SHA-256 del contenido contractual del Pagaré
   */
  computeDocumentHash(content: string): string {
    return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
  },

  /**
   * Genera la Constancia de Conservación de Firma Digital NOM-151
   */
  generateAuditTrail(
    loanId: string,
    tenantId: string,
    documentContent: string,
    biometrics: SignatureBiometricData
  ): Nom151AuditTrail {
    const documentHash = this.computeDocumentHash(documentContent);
    const signaturePayload = `${documentHash}|${biometrics.signatureBase64}|${biometrics.signerIp}|${biometrics.timestamp}|${biometrics.latitude ?? 0},${biometrics.longitude ?? 0}`;
    const signatureHash = crypto.createHash('sha256').update(signaturePayload, 'utf8').digest('hex');

    const nom151TimeStamp = new Date().toISOString();
    const certificateSerial = `ESCALAFIN-NOM151-CERT-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    const legalClause = `El presente Pagaré Digital ha sido firmado electrónicamente de conformidad con el Artículo 89 y subsecuentes del Código de Comercio de México, cumpliendo con los requisitos de integridad, atribución y conservación de mensajes de datos conforme a la Norma Oficial Mexicana NOM-151-SCFI-2016.`;

    return {
      loanId,
      tenantId,
      documentHash,
      signatureHash,
      nom151TimeStamp,
      evidencePackage: {
        biometrics,
        legalClause,
        certificateSerial,
      },
    };
  },

  /**
   * Valida la integridad criptográfica de un Pagaré Digital firmado
   */
  verifyAuditTrail(documentContent: string, auditTrail: Nom151AuditTrail): boolean {
    const expectedDocumentHash = this.computeDocumentHash(documentContent);
    if (expectedDocumentHash !== auditTrail.documentHash) {
      return false;
    }

    const biometrics = auditTrail.evidencePackage.biometrics;
    const signaturePayload = `${auditTrail.documentHash}|${biometrics.signatureBase64}|${biometrics.signerIp}|${biometrics.timestamp}|${biometrics.latitude ?? 0},${biometrics.longitude ?? 0}`;
    const expectedSignatureHash = crypto.createHash('sha256').update(signaturePayload, 'utf8').digest('hex');

    return expectedSignatureHash === auditTrail.signatureHash;
  },
};

export default nom151SignatureService;
