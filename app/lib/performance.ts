/**
 * Performance Utilities - EscalaFin v3.0.0
 * Caché Redis/Memory, fetch deduplicación, helpers financieros
 */

import { redisCache } from './redis-cache';

// ─── In-Memory Fallback Cache ────────────────────────────────────────────────
const memoryCache = new Map<string, { value: unknown; expiresAt: number }>();

// ─── Cache Helpers ────────────────────────────────────────────────────────────
export async function cacheGet<T>(key: string): Promise<T | null> {
  // Try memory first (fastest)
  const mem = memoryCache.get(key);
  if (mem && mem.expiresAt > Date.now()) return mem.value as T;

  // Try Redis
  try {
    const val = await redisCache.get<T>(key);
    if (val !== null) {
      // populate memory cache
      memoryCache.set(key, { value: val, expiresAt: Date.now() + 30000 });
      return val;
    }
    return null;
  } catch {
    return null;
  }
}

export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number = 60
): Promise<void> {
  // Set memory
  memoryCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });

  // Set Redis
  try {
    await redisCache.set(key, value, ttlSeconds);
  } catch {
    // Silently fail — memory cache still serves
  }
}

export async function cacheDel(pattern: string): Promise<void> {
  // Clear memory entries matching prefix
  for (const key of memoryCache.keys()) {
    if (key.startsWith(pattern)) memoryCache.delete(key);
  }

  // Clear Redis
  try {
    await redisCache.invalidatePattern(`${pattern}*`);
  } catch {
    // Silently fail
  }
}

// ─── Cached Query Helper ──────────────────────────────────────────────────────
/**
 * Ejecuta una consulta con caché stale-while-revalidate.
 * Si el caché tiene dato, lo retorna de inmediato y revalida en background.
 */
export async function cachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 120
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    // Revalidate in background (stale-while-revalidate pattern)
    setImmediate(async () => {
      try {
        const fresh = await fetcher();
        await cacheSet(key, fresh, ttlSeconds);
      } catch {
        // ignore background revalidation error
      }
    });
    return cached;
  }
  const fresh = await fetcher();
  await cacheSet(key, fresh, ttlSeconds);
  return fresh;
}

// ─── Financial Formatters ─────────────────────────────────────────────────────
export function formatMXN(amount: number | string | null | undefined): string {
  const num = Number(amount ?? 0);
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// ─── Pagination Helper ────────────────────────────────────────────────────────
export function getPaginationParams(
  searchParams: Record<string, string | string[] | undefined>,
  defaultLimit = 20
) {
  const page = Math.max(1, parseInt((searchParams.page as string) ?? '1', 10));
  const limit = Math.min(
    100,
    parseInt((searchParams.limit as string) ?? String(defaultLimit), 10)
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

// ─── Response time tracker ────────────────────────────────────────────────────
export function createTimer() {
  const start = Date.now();
  return {
    elapsed: () => `${Date.now() - start}ms`,
    elapsedMs: () => Date.now() - start,
  };
}
