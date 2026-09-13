export const PUBLIC_PAGES = ['/', '/software-microfinancieras', '/cobranza-en-campo', '/migrar-desde-excel', '/demo', '/legal/privacy', '/legal/terms', '/soporte'] as const;
export function isPublicPage(pathname: string) {
  return (PUBLIC_PAGES as readonly string[]).includes(pathname);
}
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://escalafin.com').replace(/\/$/, '');
