/**
 * Servicio de Verificación de Identidad (KYC)
 * Q2 2026 - EscalaFin
 * 
 * Gestiona la verificación de identidad de clientes:
 * - Carga de documentos (INE/IFE, Comprobante de domicilio)
 * - Extracción básica de datos (preparado para OCR)
 * - Verificación manual y automatizada
 * - Histórico de verificaciones
 */

import { PrismaClient, VerificationStatus } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// TIPOS
// ============================================

export interface VerificationInput {
    clientId: string;
    documentType: string; // 'INE_FRONT', 'INE_BACK', 'PROOF_ADDRESS', 'SELFIE'
    frontImageUrl?: string;
    backImageUrl?: string;
    selfieUrl?: string;
    tenantId?: string;
}

export interface VerificationResult {
    status: VerificationStatus;
    biometricScore?: number;
    extractedData?: ExtractedData;
    rejectionReason?: string;
}

export interface ExtractedData {
    fullName?: string;
    curp?: string;
    voterKey?: string;
    address?: string;
    dateOfBirth?: string;
    gender?: string;
    documentNumber?: string;
    expirationDate?: string;
    isExpired?: boolean;
}

export interface VerificationFilters {
    tenantId: string;
    clientId?: string;
    status?: VerificationStatus;
    page?: number;
    limit?: number;
}

// ============================================
// SERVICIO PRINCIPAL
// ============================================

export const identityVerificationService = {

    /**
     * Iniciar proceso de verificación
     */
    async startVerification(input: VerificationInput) {
        // Verificar si ya existe una verificación activa
        const existing = await prisma.identityVerification.findFirst({
            where: {
                clientId: input.clientId,
                status: { in: ['PENDING', 'IN_PROGRESS'] },
            },
        });

        if (existing) {
            // Actualizar la existente con nuevas imágenes
            return prisma.identityVerification.update({
                where: { id: existing.id },
                data: {
                    documentType: input.documentType,
                    frontImageUrl: input.frontImageUrl ?? existing.frontImageUrl,
                    backImageUrl: input.backImageUrl ?? existing.backImageUrl,
                    selfieUrl: input.selfieUrl ?? existing.selfieUrl,
                    status: 'IN_PROGRESS',
                },
            });
        }

        return prisma.identityVerification.create({
            data: {
                clientId: input.clientId,
                documentType: input.documentType,
                frontImageUrl: input.frontImageUrl,
                backImageUrl: input.backImageUrl,
                selfieUrl: input.selfieUrl,
                status: 'PENDING',
                provider: 'INTERNAL',
                tenantId: input.tenantId,
            },
        });
    },

    /**
     * Procesar verificación (simulación OCR + biometría)
     * En producción: integrar con servicio real de OCR (Ine API, Mati, etc.)
     */
    async processVerification(verificationId: string): Promise<VerificationResult> {
        const verification = await prisma.identityVerification.findUnique({
            where: { id: verificationId },
            include: { client: true },
        });

        if (!verification) throw new Error('Verificación no encontrada');

        // Actualizar estado a "en proceso"
        await prisma.identityVerification.update({
            where: { id: verificationId },
            data: { status: 'IN_PROGRESS' },
        });

        // ---- SIMULACIÓN DE OCR ----
        // En producción, aquí se integraría con un proveedor real de OCR
        const extractedData: ExtractedData = {
            fullName: `${verification.client.firstName} ${verification.client.lastName}`,
            dateOfBirth: verification.client.dateOfBirth?.toISOString().split('T')[0],
            address: verification.client.address ?? undefined,
            isExpired: false,
        };

        // ---- SIMULACIÓN DE BIOMETRÍA ----
        // En producción: comparar selfie con foto del documento
        const biometricScore = verification.selfieUrl ? 0.85 + Math.random() * 0.15 : undefined;

        // Determinar resultado
        let status: VerificationStatus = 'VERIFIED';
        let rejectionReason: string | undefined;

        if (!verification.frontImageUrl) {
            status = 'REJECTED';
            rejectionReason = 'No se proporcionó imagen frontal del documento';
        } else if (biometricScore !== undefined && biometricScore < 0.7) {
            status = 'REJECTED';
            rejectionReason = 'La comparación biométrica no superó el umbral mínimo';
        }

        // Guardar resultado
        await prisma.identityVerification.update({
            where: { id: verificationId },
            data: {
                status,
                biometricScore,
                extractedData: JSON.stringify(extractedData),
                rejectionReason,
                verifiedAt: status === 'VERIFIED' ? new Date() : undefined,
            },
        });

        return { status, biometricScore, extractedData, rejectionReason };
    },

    /**
     * Verificación manual por un administrador
     */
    async manualVerify(
        verificationId: string,
        verifiedBy: string,
        approved: boolean,
        rejectionReason?: string
    ) {
        return prisma.identityVerification.update({
            where: { id: verificationId },
            data: {
                status: approved ? 'VERIFIED' : 'REJECTED',
                verifiedBy,
                verifiedAt: approved ? new Date() : undefined,
                rejectionReason: !approved ? rejectionReason : undefined,
            },
        });
    },

    /**
     * Obtener estado de verificación de un cliente
     */
    async getClientVerificationStatus(clientId: string) {
        const verifications = await prisma.identityVerification.findMany({
            where: { clientId },
            orderBy: { createdAt: 'desc' },
            take: 5,
        });

        const latest = verifications[0];

        return {
            isVerified: latest?.status === 'VERIFIED',
            currentStatus: latest?.status ?? 'NOT_STARTED',
            latestVerification: latest ?? null,
            history: verifications,
            biometricScore: latest?.biometricScore,
        };
    },

    /**
     * Listar verificaciones con filtros
     */
    async list(filters: VerificationFilters) {
        const page = filters.page ?? 1;
        const limit = filters.limit ?? 20;

        const where: any = { tenantId: filters.tenantId };
        if (filters.clientId) where.clientId = filters.clientId;
        if (filters.status) where.status = filters.status;

        const [verifications, total] = await Promise.all([
            prisma.identityVerification.findMany({
                where,
                include: {
                    client: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
                    verifier: { select: { id: true, firstName: true, lastName: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.identityVerification.count({ where }),
        ]);

        return { verifications, total, page, limit, totalPages: Math.ceil(total / limit) };
    },

    /**
     * Dashboard de verificaciones
     */
    async getDashboard(tenantId: string) {
        const [pending, inProgress, verified, rejected, total] = await Promise.all([
            prisma.identityVerification.count({ where: { tenantId, status: 'PENDING' } }),
            prisma.identityVerification.count({ where: { tenantId, status: 'IN_PROGRESS' } }),
            prisma.identityVerification.count({ where: { tenantId, status: 'VERIFIED' } }),
            prisma.identityVerification.count({ where: { tenantId, status: 'REJECTED' } }),
            prisma.identityVerification.count({ where: { tenantId } }),
        ]);

        // Total de clientes únicos
        const totalClients = await prisma.client.count({ where: { tenantId } });
        const verifiedClients = await prisma.identityVerification.findMany({
            where: { tenantId, status: 'VERIFIED' },
            select: { clientId: true },
            distinct: ['clientId'],
        });

        return {
            pending,
            inProgress,
            verified,
            rejected,
            total,
            verificationRate: totalClients > 0
                ? Number(((verifiedClients.length / totalClients) * 100).toFixed(1))
                : 0,
            totalClients,
            verifiedClients: verifiedClients.length,
            unverifiedClients: totalClients - verifiedClients.length,
        };
    },
};

export default identityVerificationService;
