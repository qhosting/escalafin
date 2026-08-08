'use client';

/**
 * DynamicRecharts - EscalaFin v3.0.0 Performance
 * Wrapper de Recharts con next/dynamic para code-splitting.
 * Evita que la librería (~350KB) se incluya en el bundle del servidor.
 */

import dynamic from 'next/dynamic';

// Cargamos Recharts de forma dinámica para reducir el bundle inicial
const RechartsComponents = dynamic(
  () =>
    import('recharts').then((mod) => {
      // Re-exportamos todos los componentes bajo un único módulo dinámico
      return {
        default: mod,
      };
    }),
  { ssr: false }
);

export {
  // Re-exports con lazy loading desde el módulo dinámico
};

// Exportaciones individuales lazy (evitan tree-shaking problems)
export const AreaChart = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.AreaChart })),
  { ssr: false }
);

export const Area = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.Area })),
  { ssr: false }
);

export const LineChart = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.LineChart })),
  { ssr: false }
);

export const Line = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.Line })),
  { ssr: false }
);

export const BarChart = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.BarChart })),
  { ssr: false }
);

export const Bar = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.Bar })),
  { ssr: false }
);

export const PieChart = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.PieChart })),
  { ssr: false }
);

export const Pie = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.Pie })),
  { ssr: false }
);

export const Cell = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.Cell })),
  { ssr: false }
);

export const XAxis = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.XAxis })),
  { ssr: false }
);

export const YAxis = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.YAxis })),
  { ssr: false }
);

export const CartesianGrid = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.CartesianGrid })),
  { ssr: false }
);

export const Tooltip = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.Tooltip })),
  { ssr: false }
);

export const ResponsiveContainer = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.ResponsiveContainer })),
  { ssr: false }
);

export default RechartsComponents;
