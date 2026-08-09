'use client';

/**
 * DynamicRecharts — EscalaFin v3.0.0 Performance
 * Wrapper de Recharts con next/dynamic para code-splitting.
 * Evita que la librería (~350KB) se incluya en el bundle del servidor.
 */

import dynamic from 'next/dynamic';

const RechartsComponents = dynamic(
  () =>
    import('recharts').then((mod) => ({
      default: mod as any,
    })),
  { ssr: false }
);

export const AreaChart = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.AreaChart as any })),
  { ssr: false }
);

export const Area = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.Area as any })),
  { ssr: false }
);

export const LineChart = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.LineChart as any })),
  { ssr: false }
);

export const Line = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.Line as any })),
  { ssr: false }
);

export const BarChart = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.BarChart as any })),
  { ssr: false }
);

export const Bar = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.Bar as any })),
  { ssr: false }
);

export const PieChart = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.PieChart as any })),
  { ssr: false }
);

export const Pie = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.Pie as any })),
  { ssr: false }
);

export const Cell = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.Cell as any })),
  { ssr: false }
);

export const XAxis = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.XAxis as any })),
  { ssr: false }
);

export const YAxis = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.YAxis as any })),
  { ssr: false }
);

export const CartesianGrid = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.CartesianGrid as any })),
  { ssr: false }
);

export const Tooltip = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.Tooltip as any })),
  { ssr: false }
);

export const ResponsiveContainer = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.ResponsiveContainer as any })),
  { ssr: false }
);

export default RechartsComponents;
