/**
 * Servicio de API Keys
 * Gestiona la creación, validación y revocación de API keys para integraciones
 */

import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import type { ApiKey } from '@prisma/client';

// ============================================
// TIPOS
// ============================================

export interface CreateApiKeyInput {
    tenantId: string;
    name: string;
    description?: string;
    scopes: string[];
    expiresInDays?: number;
    rateLimit?: number;
}

export interface ApiKeyResponse {
    id: string;
    name: string;
    description?: string;
    keyPrefix: string;
    scopes: string[];
    rateLimit: number;
    expiresAt: Date | null;
    isActive: boolean;
    createdAt: Date;
    lastUsedAt: Date | null;
}

export interface ValidatedApiKey {
    id: string;
    tenantId: string;
    scopes: string[];
    rateLimit: number;
}

// ============================================
// CONSTANTES
// ============================================

// Prefijo para todas las API keys de EscalaFin
const KEY_PREFIX = 'esk_';

// Scopes disponibles
export const API_SCOPES = {
    // Clientes
    'read:clients': 'Leer información de clientes',
    'write:clients': 'Crear y modificar clientes',
    'delete:clients': 'Eliminar clientes',

    // Préstamos
    'read:loans': 'Leer información de préstamos',
    'write:loans': 'Crear y modificar préstamos',

    // Pagos
    'read:payments': 'Leer información de pagos',
    'write:payments': 'Registrar pagos',

    // Reportes
    'read:reports': 'Generar y leer reportes',

    // Webhooks
    'manage:webhooks': 'Gestionar configuración de webhooks',

    // Full access
    'full:access': 'Acceso completo a todos los recursos'
} as const;

export type ApiScope = keyof typeof API_SCOPES;

// ============================================
// SERVICIO DE API KEYS
// ============================================

export class ApiKeysService {

    /**
     * Genera una nueva API key
     */
    static async createApiKey(input: CreateApiKeyInput): Promise<{ apiKey: ApiKeyResponse; secretKey: string }> {
        const { tenantId, name, description, scopes, expiresInDays, rateLimit = 1000 } = input;

        // Generar key aleatoria (32 bytes = 64 caracteres hex)
        const rawKey = crypto.randomBytes(32).toString('hex');
        const fullKey = `${KEY_PREFIX}${rawKey}`;

        // Hash de la key para almacenamiento seguro
        const keyHash = await bcrypt.hash(fullKey, 10);

        // Prefijo visible (primeros 8 caracteres después del prefijo)
        const keyPrefix = `${KEY_PREFIX}${rawKey.substring(0, 8)}...`;

        // Calcular fecha de expiración
        let expiresAt: Date | null = null;
        if (expiresInDays) {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + expiresInDays);
        }

        // Crear en DB
        const apiKey = await prisma.apiKey.create({
            data: {
                tenantId,
                name,
                description,
                keyHash,
                keyPrefix,
                scopes: JSON.stringify(scopes),
                rateLimit,
                expiresAt,
                isActive: true
            }
        });

        return {
            apiKey: this.toResponse(apiKey),
            secretKey: fullKey // Solo se muestra una vez
        };
    }

    /**
     * Lista todas las API keys de un tenant
     */
    static async listApiKeys(tenantId: string): Promise<ApiKeyResponse[]> {
        const keys = await prisma.apiKey.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' }
        });

        return keys.map(this.toResponse);
    }

    /**
     * Valida una API key y retorna información del tenant
     */
    static async validateApiKey(key: string): Promise<ValidatedApiKey | null> {
        // Verificar prefijo
        if (!key.startsWith(KEY_PREFIX)) {
            return null;
        }

        // Buscar keys activas (no podemos buscar por hash directamente)
        const activeKeys = await prisma.apiKey.findMany({
            where: {
                isActive: true,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } }
                ]
            }
        });

        // Verificar cada key (esto es O(n) pero las keys por tenant son pocas)
        for (const apiKey of activeKeys) {
            const isValid = await bcrypt.compare(key, apiKey.keyHash);
            if (isValid) {
                // Actualizar último uso
                await prisma.apiKey.update({
                    where: { id: apiKey.id },
                    data: {
                        lastUsedAt: new Date(),
                        lastUsedIp: null // Se puede agregar desde el request
                    }
                });

                return {
                    id: apiKey.id,
                    tenantId: apiKey.tenantId,
                    scopes: JSON.parse(apiKey.scopes),
                    rateLimit: apiKey.rateLimit
                };
            }
        }

        return null;
    }

    /**
     * Verifica si una API key tiene un scope específico
     */
    static hasScope(validatedKey: ValidatedApiKey, requiredScope: ApiScope): boolean {
        const scopes = validatedKey.scopes;

        // Full access tiene todos los permisos
        if (scopes.includes('full:access')) {
            return true;
        }

        return scopes.includes(requiredScope);
    }

    /**
     * Revoca una API key
     */
    static async revokeApiKey(tenantId: string, keyId: string): Promise<void> {
        await prisma.apiKey.updateMany({
            where: {
                id: keyId,
                tenantId // Asegurar que pertenece al tenant
            },
            data: { isActive: false }
        });
    }

    /**
     * Elimina una API key
     */
    static async deleteApiKey(tenantId: string, keyId: string): Promise<void> {
        await prisma.apiKey.deleteMany({
            where: {
                id: keyId,
                tenantId
            }
        });
    }

    /**
     * Regenera una API key (crea nueva y revoca la anterior)
     */
    static async regenerateApiKey(
        tenantId: string,
        keyId: string
    ): Promise<{ apiKey: ApiKeyResponse; secretKey: string } | null> {
        const existingKey = await prisma.apiKey.findFirst({
            where: { id: keyId, tenantId }
        });

        if (!existingKey) {
            return null;
        }

        // Revocar la key anterior
        await this.revokeApiKey(tenantId, keyId);

        // Crear una nueva con los mismos datos
        return this.createApiKey({
            tenantId,
            name: existingKey.name,
            description: existingKey.description || undefined,
            scopes: JSON.parse(existingKey.scopes),
            rateLimit: existingKey.rateLimit,
            expiresInDays: existingKey.expiresAt
                ? Math.ceil((existingKey.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : undefined
        });
    }

    /**
     * Convierte un registro de DB a response (sin datos sensibles)
     */
    private static toResponse(apiKey: ApiKey): ApiKeyResponse {
        return {
            id: apiKey.id,
            name: apiKey.name,
            description: apiKey.description || undefined,
            keyPrefix: apiKey.keyPrefix,
            scopes: JSON.parse(apiKey.scopes),
            rateLimit: apiKey.rateLimit,
            expiresAt: apiKey.expiresAt,
            isActive: apiKey.isActive,
            createdAt: apiKey.createdAt,
            lastUsedAt: apiKey.lastUsedAt
        };
    }

    /**
     * Limpia keys expiradas
     */
    static async cleanupExpiredKeys(): Promise<number> {
        const result = await prisma.apiKey.deleteMany({
            where: {
                expiresAt: { lt: new Date() }
            }
        });
        return result.count;
    }
}

export default ApiKeysService;
