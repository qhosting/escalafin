'use client';

/**
 * Skeleton Screens - EscalaFin v3.0.0 Performance
 * Reemplaza spinners genéricos por placeholders animados por sección.
 * UI/UX Pro Max Standard: animate-pulse sobre bg-slate-200/800 redondeados.
 */

import React from 'react';

// ─── Primitivo Base ───────────────────────────────────────────────────────────
function Bone({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-lg ${className}`}
    />
  );
}

// ─── Skeleton de Tarjeta KPI ──────────────────────────────────────────────────
export function KpiCardSkeleton() {
  return (
    <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
      <div className="flex items-center justify-between">
        <Bone className="h-4 w-24" />
        <Bone className="h-8 w-8 rounded-xl" />
      </div>
      <Bone className="h-8 w-32" />
      <Bone className="h-3 w-20" />
    </div>
  );
}

// ─── Skeleton de Dashboard Admin ─────────────────────────────────────────────
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="space-y-2">
        <Bone className="h-8 w-56" />
        <Bone className="h-4 w-80" />
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>

      {/* Chart + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <Bone className="h-5 w-40" />
          <Bone className="h-64 w-full rounded-xl" />
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <Bone className="h-5 w-32" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Bone className="h-9 w-9 rounded-full flex-shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Bone className="h-3.5 w-3/4" />
                <Bone className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton de Tabla de Préstamos ──────────────────────────────────────────
export function LoanTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <Bone className="h-9 w-64 rounded-xl" />
        <Bone className="h-9 w-28 rounded-xl" />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-5 gap-4 px-5 py-3 bg-slate-50 dark:bg-slate-800/50">
          {['Cliente', 'Monto', 'Cuotas', 'Estado', 'Vencimiento'].map((h) => (
            <Bone key={h} className="h-3.5 w-full" />
          ))}
        </div>

        {/* Rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-5 gap-4 px-5 py-4 border-t border-slate-100 dark:border-slate-800"
          >
            <div className="flex items-center gap-2">
              <Bone className="h-7 w-7 rounded-full flex-shrink-0" />
              <Bone className="h-3.5 w-full" />
            </div>
            <Bone className="h-3.5 w-full" />
            <Bone className="h-3.5 w-3/4" />
            <Bone className="h-6 w-20 rounded-full" />
            <Bone className="h-3.5 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Skeleton de Detalle de Préstamo ──────────────────────────────────────────
export function LoanDetailSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-4">
        <Bone className="h-10 w-10 rounded-xl flex-shrink-0" />
        <div className="space-y-2 flex-1">
          <Bone className="h-7 w-64" />
          <Bone className="h-4 w-40" />
        </div>
        <Bone className="h-9 w-28 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
        <Bone className="h-5 w-40" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <Bone className="h-3.5 w-1/3" />
            <Bone className="h-3.5 w-1/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Skeleton de Lista de Clientes ───────────────────────────────────────────
export function ClientListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <Bone className="h-8 w-48" />
        <Bone className="h-9 w-32 rounded-xl" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        >
          <Bone className="h-11 w-11 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Bone className="h-4 w-48" />
            <Bone className="h-3 w-32" />
          </div>
          <Bone className="h-6 w-20 rounded-full" />
          <Bone className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

// ─── Skeleton de Pago ─────────────────────────────────────────────────────────
export function PaymentFormSkeleton() {
  return (
    <div className="space-y-5 p-5">
      <Bone className="h-6 w-48" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Bone className="h-3.5 w-20" />
          <Bone className="h-10 w-full rounded-xl" />
        </div>
      ))}
      <Bone className="h-11 w-full rounded-xl" />
    </div>
  );
}

// ─── Skeleton PWA Mobile ──────────────────────────────────────────────────────
export function MobileDashboardSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {/* Header PWA */}
      <div className="flex items-center justify-between py-2">
        <Bone className="h-6 w-32" />
        <Bone className="h-8 w-8 rounded-full" />
      </div>

      {/* Balance Card */}
      <Bone className="h-36 w-full rounded-3xl" />

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <Bone className="h-14 w-14 rounded-2xl" />
            <Bone className="h-3 w-14" />
          </div>
        ))}
      </div>

      {/* Transactions */}
      <Bone className="h-4 w-24" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Bone className="h-10 w-10 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Bone className="h-3.5 w-3/4" />
            <Bone className="h-3 w-1/2" />
          </div>
          <Bone className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
