
import { redisCache } from './redis-cache';

export interface RateLimitConfig {
  key: string;
  limit: number;
  windowSeconds: number;
}

export class RateLimiter {
  /**
   * Verifica si una solicitud excede el límite permitido.
   * Retorna true si está permitido, false si debe ser bloqueado.
   */
  static async check(config: RateLimitConfig): Promise<{
    success: boolean;
    remaining: number;
    reset: number;
  }> {
    const { key, limit, windowSeconds } = config;
    const redisKey = `ratelimit:${key}`;

    try {
      // Intentar conectar si no lo está (manejo de resiliencia)
      await redisCache.connect();

      const current = await redisCache.get<number>(redisKey) || 0;

      if (current >= limit) {
        const ttl = await redisCache.ttl(redisKey);
        return {
          success: false,
          remaining: 0,
          reset: ttl > 0 ? ttl : windowSeconds
        };
      }

      const newValue = await redisCache.increment(redisKey);
      
      // Si es la primera vez (valor 1), establecer el TTL
      if (newValue === 1) {
        await redisCache.expire(redisKey, windowSeconds);
      }

      return {
        success: true,
        remaining: Math.max(0, limit - newValue),
        reset: await redisCache.ttl(redisKey)
      };
    } catch (error) {
      console.error('RateLimiter Error:', error);
      // En caso de error de Redis, permitimos la petición por defecto (fail-open)
      // para no bloquear el sistema si Redis falla, pero logueamos el error.
      return { success: true, remaining: 1, reset: 0 };
    }
  }

  /**
   * Helper específico para Rate Limiting por IP
   */
  static async checkByIp(ip: string, action: string, limit = 5, window = 60) {
    return this.check({
      key: `${action}:${ip}`,
      limit,
      windowSeconds: window
    });
  }
}
