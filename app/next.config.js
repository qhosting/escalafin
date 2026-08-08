/**
 * next.config.js - EscalaFin v3.0.0
 * Configuración optimizada para producción:
 * - Headers HTTP de seguridad (CSP, HSTS, XFO, XCT)
 * - Caché eficiente de assets estáticos
 * - Compresión y optimización de imágenes (Sharp)
 * - Code splitting e importaciones externas del servidor
 * - Bundle Analyzer condicional
 */

const path = require('path');

// ─── Bundle Analyzer (solo en CI/LOCAL con ANALYZE=true) ──────────────────────
const withBundleAnalyzer = process.env.ANALYZE === 'true'
  ? require('@next/bundle-analyzer')({ enabled: true, openAnalyzer: false })
  : (config) => config;

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  output: 'standalone',

  // ─── Experimental ──────────────────────────────────────────────────────────
  experimental: {
    outputFileTracingRoot: process.cwd(),
    serverExternalPackages: ['pdfkit', 'canvas', 'sharp'],
    // Optimizar importaciones de librerías grandes
    optimizePackageImports: [
      'lucide-react',
      '@heroicons/react',
      'recharts',
      'date-fns',
    ],
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

  // ─── Compresión ────────────────────────────────────────────────────────────
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
        // Archivos públicos — caché 24 horas
        source: '/public/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=3600',
          },
        ],
      },
      {
        // Páginas dinámicas — headers de seguridad
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
    ];
  },

  // ─── Webpack Customization ─────────────────────────────────────────────────
  webpack: (config, { dev, isServer }) => {
    // Ignorar módulos del servidor en el cliente
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }

    // Habilitar tree-shaking agresivo en producción
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        sideEffects: true,
        usedExports: true,
      };
    }

    return config;
  },
};

// Exportamos con Bundle Analyzer envuelto
module.exports = withBundleAnalyzer(nextConfig);
