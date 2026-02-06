/**
 * Sentry Configuration
 * 
 * Monitoreo y tracking de errores en producción
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

export function initSentry() {
    if (!SENTRY_DSN) {
        console.log('⚠️  Sentry DSN not configured, error tracking disabled');
        return;
    }

    Sentry.init({
        dsn: SENTRY_DSN,

        // Ambiente
        environment: process.env.NODE_ENV || 'development',

        // Release version
        release: process.env.APP_VERSION || 'development',

        // Tasa de muestreo de errores (100% = todos los errores)
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

        // Configuración de performance monitoring
        profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

        // Debug mode
        debug: process.env.NODE_ENV === 'development',

        // Configuración de rastreo
        tracePropagationTargets: [
            'localhost',
            /^https:\/\/[^/]*\.escalafin\.com/,
        ],

        // Integrations
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration({
                maskAllText: true,
                blockAllMedia: true,
            }),
        ],

        // Configuración de replays (Session Replay)
        replaysSessionSampleRate: 0.1, // 10% de sesiones normales
        replaysOnErrorSampleRate: 1.0, // 100% cuando hay error

        // Ignorar errores conocidos o no importantes
        ignoreErrors: [
            // Errores del navegador
            'ResizeObserver loop limit exceeded',
            'Non-Error promise rejection captured',

            // Errores de red que no podemos controlar
            'NetworkError',
            'Network request failed',

            // Errores de autenticación esperados
            'Invalid token',
            'Token expired',
        ],

        // Filtrar información sensible
        beforeSend(event: any, hint: any) {
            // Remover información sensible de URLs
            if (event.request) {
                event.request.url = sanitizeUrl(event.request.url);
                event.request.headers = sanitizeHeaders(event.request.headers);
            }

            // Remover cookies sensibles
            if (event.request?.cookies) {
                delete event.request.cookies;
            }

            // Sanitizar el contexto del usuario
            if (event.user) {
                delete event.user.ip_address;
                delete event.user.email; // Solo en producción
            }

            return event;
        },

        // Configurar el contexto del usuario
        beforeBreadcrumb(breadcrumb: any) {
            // No guardar breadcrumbs de consola en producción
            if (breadcrumb.category === 'console' && process.env.NODE_ENV === 'production') {
                return null;
            }

            return breadcrumb;
        },
    });

    console.log('✅ Sentry initialized');
}

/**
 * Sanitiza URLs removiendo tokens y datos sensibles
 */
function sanitizeUrl(url?: string): string | undefined {
    if (!url) return url;

    try {
        const urlObj = new URL(url);

        // Remover tokens de query params
        urlObj.searchParams.delete('token');
        urlObj.searchParams.delete('access_token');
        urlObj.searchParams.delete('refresh_token');
        urlObj.searchParams.delete('api_key');

        return urlObj.toString();
    } catch {
        return url;
    }
}

/**
 * Sanitiza headers removiendo información sensible
 */
function sanitizeHeaders(headers?: Record<string, any>): Record<string, any> | undefined {
    if (!headers) return headers;

    const sanitized = { ...headers };

    // Remover headers sensibles
    delete sanitized.authorization;
    delete sanitized.cookie;
    delete sanitized['x-api-key'];

    return sanitized;
}

/**
 * Helper para capturar errores manualmente
 */
export function captureError(error: Error, context?: Record<string, any>) {
    if (context) {
        Sentry.setContext('additional', context);
    }

    Sentry.captureException(error);
}

/**
 * Helper para agregar contexto de usuario
 */
export function setUser(user: {
    id: string;
    email?: string;
    role?: string;
}) {
    Sentry.setUser({
        id: user.id,
        // Solo incluir email en desarrollo
        ...(process.env.NODE_ENV === 'development' && { email: user.email }),
        role: user.role,
    });
}

/**
 * Helper para limpiar contexto de usuario (logout)
 */
export function clearUser() {
    Sentry.setUser(null);
}

/**
 * Helper para agregar tags personalizados
 */
export function addTag(key: string, value: string) {
    Sentry.setTag(key, value);
}

/**
 * Helper para agregar contexto adicional
 */
export function addContext(name: string, context: Record<string, any>) {
    Sentry.setContext(name, context);
}

/**
 * Helper para capturar mensajes informativos
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
    Sentry.captureMessage(message, level);
}

/**
 * Wrapper para funciones async que captura errores automáticamente
 */
export function withSentry<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    options?: {
        name?: string;
        tags?: Record<string, string>;
    }
): T {
    return (async (...args: any[]) => {
        return Sentry.startSpan(
            {
                op: 'function',
                name: options?.name || fn.name || 'anonymous',
                attributes: options?.tags,
            },
            async () => {
                try {
                    const result = await fn(...args);
                    return result;
                } catch (error) {
                    Sentry.captureException(error);
                    throw error;
                }
            }
        );
    }) as T;
}
