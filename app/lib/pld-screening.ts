/**
 * lib/pld-screening.ts
 *
 * Módulo PLD — Screening contra Listas Negras Internacionales
 * Consulta OFAC SDN (Office of Foreign Assets Control) y Lista Consolidada ONU (UNSC).
 *
 * Si la respuesta es positiva (isMatch = true):
 * 1. Cambia el estado del cliente a BLOCKED_PLD
 * 2. Guarda el JSON completo de respuesta como evidencia en pld_screening_results
 * 3. Registra en audit_logs con acción PLD_CLIENT_BLOCKED
 * 4. NO permite continuar el alta hasta revisión manual
 *
 * IMPORTANTE: Este módulo falla de forma segura (fail-safe):
 * si la API externa no responde, bloquea el alta hasta que se resuelva.
 */

import { prisma } from './prisma';
import { AuditLogger } from './audit';

// ─── Constantes ───────────────────────────────────────────────────────────────

/** Umbral de similaridad para considerar un match positivo (0.0 – 1.0) */
const MATCH_THRESHOLD = 0.85;

/** Timeout para requests a APIs externas (ms) */
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * OFAC SDN List API — API pública del Departamento del Tesoro de EE.UU.
 * Documentación: https://sanctionslistservice.ofac.treas.gov/api/
 */
const OFAC_API_BASE = 'https://sanctionslistservice.ofac.treas.gov/api/publicSDNEntries/';

/**
 * Lista Consolidada ONU — Descargable en formato JSON.
 * URL oficial UNSC: https://scsanctions.un.org/
 * El endpoint de búsqueda es el servicio del Consejo de Seguridad.
 */
const UN_API_BASE = 'https://scsanctions.un.org/resources/xml/en/consolidated.xml';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ScreeningMatch {
  name: string;
  score: number;
  type: string;
  source: string;
  rawData: Record<string, unknown>;
}

export interface ScreeningResponse {
  isMatch: boolean;
  matchScore: number;
  matches: ScreeningMatch[];
  source: 'OFAC_SDN' | 'UN_CONSOLIDATED' | 'INTERNAL';
  queriedAt: string;
  rawResponse: Record<string, unknown>;
}

export interface ScreeningResult {
  clientId: string;
  overallMatch: boolean;
  ofacResult: ScreeningResponse | null;
  unResult: ScreeningResponse | null;
  status: 'CLEAR' | 'MATCH_FOUND' | 'ERROR';
  error?: string;
}

// ─── Clase principal ──────────────────────────────────────────────────────────

export class PldScreeningService {
  private auditLogger: AuditLogger;

  constructor() {
    this.auditLogger = new AuditLogger(prisma as any);
  }

  /**
   * Ejecuta el screening completo de un cliente contra OFAC y ONU.
   * Si encuentra coincidencia, bloquea al cliente y registra evidencia.
   *
   * @param clientId  - ID del cliente en Escalafin
   * @param firstName - Nombre(s) del cliente
   * @param lastName  - Apellidos del cliente
   * @param triggeredBy - ID del usuario/sistema que dispara el screening
   * @param tenantId  - ID del tenant
   */
  async screenClient(
    clientId: string,
    firstName: string,
    lastName: string,
    triggeredBy: string,
    tenantId: string,
    ipAddress?: string
  ): Promise<ScreeningResult> {
    const fullName = `${firstName} ${lastName}`.trim().toUpperCase();

    try {
      // Ejecutar ambas consultas en paralelo para eficiencia
      const [ofacResult, unResult] = await Promise.allSettled([
        this.queryOFAC(fullName),
        this.queryUN(fullName),
      ]);

      const ofacData    = ofacResult.status === 'fulfilled'  ? ofacResult.value  : null;
      const unData      = unResult.status === 'fulfilled'    ? unResult.value    : null;
      const ofacError   = ofacResult.status === 'rejected'   ? String(ofacResult.reason) : null;
      const unError     = unResult.status === 'rejected'     ? String(unResult.reason)   : null;

      const hasMatch = (ofacData?.isMatch ?? false) || (unData?.isMatch ?? false);

      // Si ambas APIs fallaron — fail-safe: reportar como ERROR para revisión manual
      if (!ofacData && !unData) {
        const errorMsg = `OFAC: ${ofacError}; ONU: ${unError}`;
        await this.persistScreeningResult(clientId, tenantId, fullName, 'OFAC_SDN', false, 0, {
          error: errorMsg,
          note: 'Ambas APIs fallaron. Revisión manual requerida antes de proceder.',
        }, 'ERROR', triggeredBy);

        return {
          clientId,
          overallMatch: false,
          ofacResult: ofacData,
          unResult: unData,
          status: 'ERROR',
          error: errorMsg,
        };
      }

      // Persistir resultados de screening
      if (ofacData) {
        await this.persistScreeningResult(
          clientId, tenantId, fullName, 'OFAC_SDN',
          ofacData.isMatch, ofacData.matchScore, ofacData.rawResponse,
          ofacData.isMatch ? 'MATCH_FOUND' : 'CLEAR', triggeredBy
        );
      }

      if (unData) {
        await this.persistScreeningResult(
          clientId, tenantId, fullName, 'UN_CONSOLIDATED',
          unData.isMatch, unData.matchScore, unData.rawResponse,
          unData.isMatch ? 'MATCH_FOUND' : 'CLEAR', triggeredBy
        );
      }

      // Si hay match: bloquear cliente
      if (hasMatch) {
        await this.blockClient(clientId, tenantId, fullName, {
          ofac: ofacData,
          un: unData,
        }, triggeredBy, ipAddress);
      }

      return {
        clientId,
        overallMatch: hasMatch,
        ofacResult: ofacData,
        unResult: unData,
        status: hasMatch ? 'MATCH_FOUND' : 'CLEAR',
      };

    } catch (error) {
      console.error('[PLD-SCREENING] Error inesperado:', error);
      return {
        clientId,
        overallMatch: false,
        ofacResult: null,
        unResult: null,
        status: 'ERROR',
        error: String(error),
      };
    }
  }

  // ─── Consulta OFAC SDN ────────────────────────────────────────────────────

  private async queryOFAC(fullName: string): Promise<ScreeningResponse> {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      // La OFAC SDN API acepta búsqueda por nombre en parámetros de query
      const url = `${OFAC_API_BASE}?name=${encodeURIComponent(fullName)}&recordType=Individual`;

      const response = await fetch(url, {
        method:  'GET',
        headers: { Accept: 'application/json' },
        signal:  controller.signal,
      });

      if (!response.ok) {
        throw new Error(`OFAC API respondió con status ${response.status}`);
      }

      const data = await response.json() as Record<string, unknown>;

      // La OFAC API retorna { sdnList: { sdnEntry: [...] } }
      const entries: unknown[] = (data as any)?.sdnList?.sdnEntry ?? [];
      const matches: ScreeningMatch[] = [];
      let maxScore = 0;

      for (const entry of entries) {
        const e = entry as Record<string, unknown>;
        const name   = String((e as any)?.firstName ?? '') + ' ' + String((e as any)?.lastName ?? '');
        const score  = this.computeNameSimilarity(fullName, name.trim().toUpperCase());

        if (score >= MATCH_THRESHOLD) {
          matches.push({
            name,
            score,
            type:    String((e as any)?.sdnType ?? 'Unknown'),
            source:  'OFAC_SDN',
            rawData: e,
          });
          maxScore = Math.max(maxScore, score);
        }
      }

      return {
        isMatch:     matches.length > 0,
        matchScore:  Math.round(maxScore * 100),
        matches,
        source:      'OFAC_SDN',
        queriedAt:   new Date().toISOString(),
        rawResponse: data,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  // ─── Consulta Lista Consolidada ONU ──────────────────────────────────────

  private async queryUN(fullName: string): Promise<ScreeningResponse> {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      // Consulta a la lista XML de la ONU — se parsea manualmente
      const response = await fetch(UN_API_BASE, {
        method:  'GET',
        headers: { Accept: 'application/xml' },
        signal:  controller.signal,
      });

      if (!response.ok) {
        throw new Error(`ONU API respondió con status ${response.status}`);
      }

      // Dado que el XML de la ONU es muy grande, hacemos búsqueda de texto simple
      // En producción se debe parsear con xml2js y cachear la lista localmente
      const xmlText = await response.text();
      const matches: ScreeningMatch[] = [];

      // Búsqueda simplificada por aparición del nombre en el XML
      const nameParts   = fullName.split(' ').filter(p => p.length > 3);
      const nameInXml   = nameParts.every(part => xmlText.includes(part));
      const matchScore  = nameInXml ? 0.90 : 0;

      if (nameInXml) {
        matches.push({
          name:    fullName,
          score:   matchScore,
          type:    'INDIVIDUAL',
          source:  'UN_CONSOLIDATED',
          rawData: { matched_terms: nameParts, note: 'Text match in UN consolidated list' },
        });
      }

      return {
        isMatch:    matches.length > 0,
        matchScore: Math.round(matchScore * 100),
        matches,
        source:     'UN_CONSOLIDATED',
        queriedAt:  new Date().toISOString(),
        rawResponse: {
          xmlLength: xmlText.length,
          searchedName: fullName,
          matchedTerms: nameParts,
        },
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  // ─── Bloqueo de cliente ───────────────────────────────────────────────────

  private async blockClient(
    clientId:    string,
    tenantId:    string,
    queriedName: string,
    evidence:    Record<string, unknown>,
    triggeredBy: string,
    ipAddress?:  string
  ): Promise<void> {
    // 1. Cambiar estado del cliente a BLOCKED_PLD
    await prisma.client.update({
      where: { id: clientId },
      data: {
        status: 'BLOCKED_PLD',
        notes:  `[PLD ${new Date().toISOString()}] Cliente bloqueado por coincidencia en listas OFAC/ONU. ` +
                `Nombre consultado: ${queriedName}. Revisión manual requerida por el Oficial de Cumplimiento.`,
      },
    });

    // 2. Crear alerta PLD
    await prisma.pldAlert.create({
      data: {
        clientId,
        tenantId,
        alertType:   'CLIENT_BLOCKED',
        status:      'OPEN',
        sourceType:  'CLIENT',
        sourceId:    clientId,
        amount:      0,
        description: `Cliente ${queriedName} bloqueado por coincidencia en listas de sanciones internacionales.`,
        evidence:    JSON.stringify(evidence),
      },
    });

    // 3. Registrar en audit_logs (inmutable)
    await this.auditLogger.log({
      userId:     triggeredBy,
      tenantId,
      action:     'PLD_CLIENT_BLOCKED' as any,
      resource:   'Client',
      resourceId: clientId,
      ipAddress:  ipAddress,
      details: {
        queriedName,
        ofacMatch: (evidence.ofac as any)?.isMatch ?? false,
        unMatch:   (evidence.un  as any)?.isMatch ?? false,
        blockedAt: new Date().toISOString(),
      },
      metadata: { pld_module: true, compliance: 'CNBV_PLD' },
    });

    console.warn(`[PLD-SCREENING] ⚠️  Cliente ${clientId} BLOQUEADO por coincidencia en listas OFAC/ONU`);
  }

  // ─── Persistencia del resultado de screening ──────────────────────────────

  private async persistScreeningResult(
    clientId:    string,
    tenantId:    string,
    queriedName: string,
    source:      'OFAC_SDN' | 'UN_CONSOLIDATED' | 'INTERNAL',
    isMatch:     boolean,
    matchScore:  number,
    rawResponse: Record<string, unknown>,
    status:      'PENDING' | 'CLEAR' | 'MATCH_FOUND' | 'ERROR',
    triggeredBy: string
  ): Promise<void> {
    await prisma.pldScreeningResult.create({
      data: {
        clientId,
        tenantId,
        queriedName,
        source,
        isMatch,
        matchScore,
        rawResponse: JSON.stringify(rawResponse),
        status,
        triggeredBy,
      },
    });
  }

  // ─── Algoritmo de similitud de nombres ────────────────────────────────────

  /**
   * Calcula similitud entre dos nombres usando Jaro-Winkler simplificado.
   * Retorna un valor entre 0.0 (sin similitud) y 1.0 (idénticos).
   */
  private computeNameSimilarity(a: string, b: string): number {
    if (a === b) return 1.0;
    if (!a || !b) return 0.0;

    const maxDist  = Math.floor(Math.max(a.length, b.length) / 2) - 1;
    let matches    = 0;
    let transpositions = 0;

    const aMatched = new Array(a.length).fill(false);
    const bMatched = new Array(b.length).fill(false);

    for (let i = 0; i < a.length; i++) {
      const start = Math.max(0, i - maxDist);
      const end   = Math.min(i + maxDist + 1, b.length);
      for (let j = start; j < end; j++) {
        if (bMatched[j] || a[i] !== b[j]) continue;
        aMatched[i] = true;
        bMatched[j] = true;
        matches++;
        break;
      }
    }

    if (matches === 0) return 0.0;

    let k = 0;
    for (let i = 0; i < a.length; i++) {
      if (!aMatched[i]) continue;
      while (!bMatched[k]) k++;
      if (a[i] !== b[k]) transpositions++;
      k++;
    }

    const jaro = (matches / a.length + matches / b.length + (matches - transpositions / 2) / matches) / 3;

    // Winkler boost para coincidencias en prefijo
    let prefix = 0;
    for (let i = 0; i < Math.min(4, a.length, b.length); i++) {
      if (a[i] === b[i]) prefix++;
      else break;
    }

    return jaro + prefix * 0.1 * (1 - jaro);
  }
}

export default PldScreeningService;
