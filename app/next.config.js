/**
 * next.config.js - EscalaFin v3.1.0
 * Optimizado para Next.js 14.2.28
 *
 * CORRECCIONES v3.1.0:
 * - Revertido `serverExternalPackages` → `serverComponentsExternalPackages` (Next.js 14)
 * - Eliminado `optimizePackageImports` (solo disponible en Next.js 13.5+ sin conflictos conocidos,
 *   pero puede interferir con el runtime de producción en 14.2.x)
 * - Headers HTTP de seguridad y caché de assets estáticos
 * - Image optimization con AVIF/WebP habilitado
 */

const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  output: 'standalone',

  // ─── Experimental (Next.js 14 compatible) ─────────────────────────────────
  experimental: {
    outputFileTracingRoot: process.cwd(),
    // IMPORTANTE: En Next.js 14 el nombre correcto es serverComponentsExternalPackages
    // (serverExternalPackages solo existe en Next.js 15+)
    serverComponentsExternalPackages: ['pdfkit', 'canvas', 'sharp'],
  },

  // ─── Build Tolerances ──────────────────────────────────────────────────────
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  // ─── Image Optimization ────────────────────────────────────────────────────
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 768, 1024, 1280, 1536],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 86400, // 24 horas
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },

  // ─── Compresión y Headers ──────────────────────────────────────────────────
  compress: true,
  poweredByHeader: false,

  // ─── HTTP Headers ──────────────────────────────────────────────────────────
  async headers() {
    return [
      {
        // Assets estáticos — caché agresivo 1 año (immutable)
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Páginas y API — headers de seguridad
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
    ];
  },

  // ─── Webpack ───────────────────────────────────────────────────────────────
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
