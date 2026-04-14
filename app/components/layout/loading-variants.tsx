'use client';

import React from 'react';

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      style={style}
      className={`rounded-lg bg-gray-200/60 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent ${className}`}
    />
  );
}

export function SkPulse({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div style={style} className={`bg-white/[0.05] animate-pulse rounded-lg ${className}`} />;
}

export function AdminSkeleton() {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-gray-900">
      <div className="hidden md:flex flex-col w-64 border-r border-gray-200 bg-white p-4 gap-3 shrink-0">
        <Skeleton className="h-10 w-36 mb-4 bg-gray-100" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full bg-gray-50" style={{ opacity: 1 - i * 0.08 }} />
        ))}
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-16 border-b border-gray-200 bg-white flex items-center px-6 gap-4 shrink-0">
          <Skeleton className="h-8 w-48 bg-gray-100" />
          <div className="ml-auto flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full bg-gray-100" />
            <Skeleton className="h-8 w-8 rounded-full bg-gray-100" />
          </div>
        </div>
        <div className="flex-1 p-6 space-y-6 overflow-hidden bg-gray-50/50">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56 bg-gray-200" />
            <Skeleton className="h-4 w-80 bg-gray-100" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-gray-200 p-5 space-y-3 bg-white shadow-sm">
                <Skeleton className="h-3 w-20 bg-gray-100" />
                <Skeleton className="h-8 w-24 bg-gray-200" />
                <Skeleton className="h-3 w-16 bg-gray-100" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-2xl border border-gray-200 p-5 space-y-3 bg-white shadow-sm">
              <Skeleton className="h-5 w-32 mb-4 bg-gray-200" />
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full bg-gray-50" />
              ))}
            </div>
            <div className="rounded-2xl border border-gray-200 p-5 space-y-3 bg-white shadow-sm">
              <Skeleton className="h-5 w-24 mb-4 bg-gray-200" />
              <Skeleton className="h-48 w-full rounded-xl bg-gray-50" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ClienteSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-[#080a0f] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <div className="flex-1 p-5 space-y-5 overflow-hidden max-w-lg mx-auto w-full">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="rounded-3xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.06] p-6 space-y-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-40" />
          <div className="flex gap-3">
            <Skeleton className="h-8 flex-1 rounded-xl" />
            <Skeleton className="h-8 flex-1 rounded-xl" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/[0.05] p-5 space-y-3 bg-white/[0.02]">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
      <div className="h-16 border-t border-white/[0.05] flex items-center justify-around px-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-10 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function AuthSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080a0f]">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-700/8 rounded-full blur-[100px] pointer-events-none" />
      <div className="w-full max-w-[420px] space-y-6 bg-white/[0.03] border border-white/[0.06] rounded-3xl p-8">
        <div className="flex flex-col items-center gap-3">
          <SkPulse className="h-14 w-14 rounded-2xl" />
          <SkPulse className="h-7 w-40 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <SkPulse className="flex-1 h-11 rounded-xl" />
          <SkPulse className="flex-1 h-11 rounded-xl" />
        </div>
        <div className="space-y-4">
          <SkPulse className="h-12 w-full rounded-xl" />
          <SkPulse className="h-12 w-full rounded-xl" />
        </div>
        <SkPulse className="h-13 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function GenericSpinner() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#080a0f]">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-700/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="relative flex flex-col items-center gap-6">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-white/5" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 border-r-blue-500/30 animate-spin" style={{ animationDuration: '0.7s' }} />
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-white/80" />
          </div>
        </div>
        <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] animate-pulse">
          Cargando
        </p>
      </div>
    </div>
  );
}
