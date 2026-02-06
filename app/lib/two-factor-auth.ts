/**
 * Two-Factor Authentication (2FA) Service
 * 
 * Implementación de TOTP (Time-based One-Time Password) para 2FA
 */

// @ts-ignore
import { generateSecret, verifySync, generateURI } from 'otplib';
import { PrismaClient } from '@prisma/client';
import QRCode from 'qrcode';

const prisma = new PrismaClient();

export class TwoFactorAuthService {
    private readonly appName = 'EscalaFin';

    /**
     * Genera un secreto 2FA para un usuario
     */
    generateSecret(userEmail: string): {
        secret: string;
        otpauthUrl: string;
    } {
        const secret = generateSecret();
        const otpauthUrl = generateURI({
            secret,
            label: userEmail,
            issuer: this.appName,
        });

        return {
            secret,
            otpauthUrl,
        };
    }

    /**
     * Genera un código QR para configurar 2FA
     */
    async generateQRCode(otpauthUrl: string): Promise<string> {
        try {
            const qrCodeDataURL = await QRCode.toDataURL(otpauthUrl);
            return qrCodeDataURL;
        } catch (error) {
            throw new Error('Error generando código QR');
        }
    }

    /**
     * Verifica un código TOTP
     */
    verifyToken(secret: string, token: string): boolean {
        try {
            const result = verifySync({
                token,
                secret,
            });
            return result.valid;
        } catch (error) {
            return false;
        }
    }

    /**
     * Habilita 2FA para un usuario
     */
    async enable2FA(userId: string, secret: string, verificationCode: string): Promise<{
        success: boolean;
        backupCodes?: string[];
        error?: string;
    }> {
        // Verificar que el código es válido
        const isValid = this.verifyToken(secret, verificationCode);

        if (!isValid) {
            return {
                success: false,
                error: 'Código de verificación inválido',
            };
        }

        // Generar códigos de respaldo
        const backupCodes = this.generateBackupCodes();

        // Guardar en base de datos
        await prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorSecret: secret,
                twoFactorEnabled: true,
                twoFactorBackupCodes: JSON.stringify(backupCodes),
            },
        });

        return {
            success: true,
            backupCodes,
        };
    }

    /**
     * Deshabilita 2FA para un usuario
     */
    async disable2FA(userId: string, verificationCode: string): Promise<{
        success: boolean;
        error?: string;
    }> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { twoFactorSecret: true },
        });

        if (!user?.twoFactorSecret) {
            return {
                success: false,
                error: '2FA no está habilitado',
            };
        }

        // Verificar código antes de deshabilitar
        const isValid = this.verifyToken(user.twoFactorSecret, verificationCode);

        if (!isValid) {
            return {
                success: false,
                error: 'Código de verificación inválido',
            };
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorSecret: null,
                twoFactorEnabled: false,
                twoFactorBackupCodes: null,
            },
        });

        return {
            success: true,
        };
    }

    /**
     * Verifica un código 2FA o código de respaldo
     */
    async verify2FACode(userId: string, code: string): Promise<{
        success: boolean;
        usedBackupCode?: boolean;
        error?: string;
    }> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                twoFactorSecret: true,
                twoFactorEnabled: true,
                twoFactorBackupCodes: true,
            },
        });

        if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
            return {
                success: false,
                error: '2FA no está habilitado',
            };
        }

        // Intentar verificar como código TOTP
        const isValidTOTP = this.verifyToken(user.twoFactorSecret, code);

        if (isValidTOTP) {
            return {
                success: true,
                usedBackupCode: false,
            };
        }

        // Si no es TOTP válido, intentar como código de respaldo
        if (user.twoFactorBackupCodes) {
            const backupCodes = JSON.parse(user.twoFactorBackupCodes) as string[];
            const codeIndex = backupCodes.indexOf(code);

            if (codeIndex !== -1) {
                // Remover el código usado
                backupCodes.splice(codeIndex, 1);

                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        twoFactorBackupCodes: JSON.stringify(backupCodes),
                    },
                });

                return {
                    success: true,
                    usedBackupCode: true,
                };
            }
        }

        return {
            success: false,
            error: 'Código inválido',
        };
    }

    /**
     * Genera códigos de respaldo
     */
    private generateBackupCodes(count = 8): string[] {
        const codes: string[] = [];

        for (let i = 0; i < count; i++) {
            const code = this.generateRandomCode();
            codes.push(code);
        }

        return codes;
    }

    /**
     * Genera un código aleatorio de 8 caracteres
     */
    private generateRandomCode(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';

        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // Formatear como XXXX-XXXX
        return `${code.substring(0, 4)}-${code.substring(4)}`;
    }

    /**
     * Regenera códigos de respaldo
     */
    async regenerateBackupCodes(userId: string, verificationCode: string): Promise<{
        success: boolean;
        backupCodes?: string[];
        error?: string;
    }> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                twoFactorSecret: true,
                twoFactorEnabled: true,
            },
        });

        if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
            return {
                success: false,
                error: '2FA no está habilitado',
            };
        }

        // Verificar código
        const isValid = this.verifyToken(user.twoFactorSecret, verificationCode);

        if (!isValid) {
            return {
                success: false,
                error: 'Código de verificación inválido',
            };
        }

        // Generar nuevos códigos
        const backupCodes = this.generateBackupCodes();

        await prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorBackupCodes: JSON.stringify(backupCodes),
            },
        });

        return {
            success: true,
            backupCodes,
        };
    }
}

export const twoFactorAuth = new TwoFactorAuthService();
