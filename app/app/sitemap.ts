import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/public-pages';
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ['/', '/software-microfinancieras', '/cobranza-en-campo', '/migrar-desde-excel', '/demo', '/legal/privacy', '/legal/terms', '/soporte'];
  return paths.map(path => ({ url: `${SITE_URL}${path}`, changeFrequency: 'monthly', priority: path === '/' ? 1 : 0.5 }));
}
