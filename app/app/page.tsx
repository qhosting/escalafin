import type { Metadata } from 'next';
import LandingPage from '@/components/landing/landing-page';
export const metadata: Metadata = {
  title: 'Software para microfinancieras y cobranza',
  description: 'Organiza clientes, préstamos, pagos y cobranza de tu financiera con EscalaFin. Conoce el producto y prepara tu implementación.',
  alternates: { canonical: '/' }, robots: { index: true, follow: true },
  openGraph: { title: 'EscalaFin — Créditos y cobranza', description: 'Clientes, cartera y pagos en una plataforma.', url: '/', type: 'website', locale: 'es_MX' },
};
export default function Home() { return <div id="main-content"><LandingPage /></div>; }
