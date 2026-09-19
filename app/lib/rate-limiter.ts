/**
 * Rate Limiting Middleware
 * 
 * Protección contra abuso de API usando Redis
 */

import { NextRequest, NextResponse } from 'next/server';
import { redisCache } from './redis-cache';

export interface RateLimitConfig {
    windowMs: number;      // Ventana de tiempo en ms
    maxRequests: number;   // Máximo de requests en la ventana
    message?: string;      // Mensaje de error personalizado
    skipSuccessfulRequests?: boolean; // No contar requests exitosos
    keyGenerator?: (req: NextRequest) => string; // Generador de key personalizado
}

export class RateLimiter {
    private config: RateLimitConfig;

    constructor(config: RateLimitConfig) {
        this.config = {
            message: 'Demasiadas solicitudes, por favor intenta más tarde',
            skipSuccessfulRequests: false,
            keyGenerator: this.defaultKeyGenerator,
            ...config
        };
    }

    private defaultKeyGenerator(req: NextRequest): string {
        // Obtener IP del request
        const forwarded = req.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0] :
            req.headers.get('x-real-ip') ||
            'unknown';

        return `ratelimit:${ip}`;
    }

    async check(req: NextRequest): Promise<{
        allowed: boolean;
        remaining: number;
        resetTime: number;
    }> {
        const key = this.config.keyGenerator!(req);
        const windowSeconds = Math.max(1, Math.ceil(this.config.windowMs / 1000));
        const now = Date.now();

        try {
            await redisCache.connect();
            const count = await redisCache.increment(key);

            if (count === 1) {
                await redisCache.expire(key, windowSeconds);
            }

            const currentTtl = await redisCache.ttl(key);
            const resetTime = now + (currentTtl > 0 ? currentTtl * 1000 : this.config.windowMs);
            const allowed = count <= this.config.maxRequests;
            const remaining = Math.max(0, this.config.maxRequests - count);

            return {
                allowed,
                remaining,
                resetTime,
            };
        } catch (error) {
            console.error('Rate limiter error:', error);
            // En caso de error, permitir la request (fail-open)
            return {
                allowed: true,
                remaining: this.config.maxRequests,
                resetTime: now + this.config.windowMs,
            };
        }
    }

    middleware() {
        return async (req: NextRequest) => {
            const result = await this.check(req);

            if (!result.allowed) {
                return NextResponse.json(
                    {
                        error: this.config.message,
                        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
                    },
                    {
                        status: 429,
                        headers: {
                            'X-RateLimit-Limit': String(this.config.maxRequests),
                            'X-RateLimit-Remaining': String(result.remaining),
                            'X-RateLimit-Reset': String(result.resetTime),
                            'Retry-After': String(Math.ceil((result.resetTime - Date.now()) / 1000))
                        }
                    }
                );
            }

            // Agregar headers de rate limit a la respuesta
            return NextResponse.next({
                headers: {
                    'X-RateLimit-Limit': String(this.config.maxRequests),
                    'X-RateLimit-Remaining': String(result.remaining),
                    'X-RateLimit-Reset': String(result.resetTime),
                }
            });
        };
    }
}

// Configuraciones predefinidas
export const rateLimiters = {
    // API general: 100 requests por minuto
    api: new RateLimiter({
        windowMs: 60 * 1000, // 1 minuto
        maxRequests: 100,
    }),

    // Login: 5 intentos por 15 minutos
    auth: new RateLimiter({
        windowMs: 15 * 60 * 1000, // 15 minutos
        maxRequests: 5,
        message: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.',
    }),

    // Webhooks: 1000 requests por minuto (más tolerante)
    webhook: new RateLimiter({
        windowMs: 60 * 1000,
        maxRequests: 1000,
    }),

    // Reportes: 10 generaciones por hora
    reports: new RateLimiter({
        windowMs: 60 * 60 * 1000, // 1 hora
        maxRequests: 10,
        message: 'Has alcanzado el límite de generación de reportes. Intenta más tarde.',
    }),

    // SMS/WhatsApp: 50 envíos por hora
    messaging: new RateLimiter({
        windowMs: 60 * 60 * 1000,
        maxRequests: 50,
        message: 'Límite de envío de mensajes alcanzado. Intenta en una hora.',
    }),
};

/**
 * Helper para aplicar rate limiting en API routes
 */
export async function applyRateLimit(
    req: NextRequest,
    limiter: RateLimiter = rateLimiters.api
): Promise<NextResponse | null> {
    const result = await limiter.check(req);

    if (!result.allowed) {
        return NextResponse.json(
            {
                error: 'Demasiadas solicitudes, por favor intenta más tarde',
                retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
            },
            {
                status: 429,
                headers: {
                    'X-RateLimit-Limit': String(limiter['config'].maxRequests),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': String(result.resetTime),
                    'Retry-After': String(Math.ceil((result.resetTime - Date.now()) / 1000))
                }
            }
        );
    }

    return null; // Null means request is allowed
}
