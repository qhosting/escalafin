const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: process.cwd(),
    serverComponentsExternalPackages: ['pdfkit', 'canvas'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: { unoptimized: true },
};


console.log('🚀 Next.js Config Loaded');
console.log('📂 cwd:', process.cwd());
console.log('🏗️ output mode:', nextConfig.output);

module.exports = nextConfig;
