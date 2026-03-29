
// Admin section skeleton — matches the main-layout sidebar + content structure

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-lg bg-white/[0.04] relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent ${className}`}
    />
  );
}

export default function AdminLoading() {
  return (
    <div className="flex h-screen bg-[#080a0f] overflow-hidden">
      {/* ── Sidebar skeleton ── */}
      <div className="hidden md:flex flex-col w-64 border-r border-white/[0.05] p-4 gap-3 shrink-0">
        <Skeleton className="h-10 w-36 mb-4" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" style={{ opacity: 1 - i * 0.08 } as React.CSSProperties} />
        ))}
      </div>

      {/* ── Main content skeleton ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div className="h-16 border-b border-white/[0.05] flex items-center px-6 gap-4 shrink-0">
          <Skeleton className="h-8 w-48" />
          <div className="ml-auto flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 p-6 space-y-6 overflow-hidden">
          {/* Page title */}
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-80" />
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/[0.05] p-5 space-y-3 bg-white/[0.02]">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>

          {/* Table / Charts area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-2xl border border-white/[0.05] p-5 space-y-3 bg-white/[0.02]">
              <Skeleton className="h-5 w-32 mb-4" />
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
            <div className="rounded-2xl border border-white/[0.05] p-5 space-y-3 bg-white/[0.02]">
              <Skeleton className="h-5 w-24 mb-4" />
              <Skeleton className="h-48 w-full rounded-xl" />
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top progress bar */}
      <div className="fixed top-0 left-0 right-0 h-[2px] z-[10000] overflow-hidden">
        <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600"
          style={{ animation: 'shimmer-x 1.4s ease-in-out infinite' }} />
      </div>

      <style jsx>{`
        @keyframes shimmer {
          100% { transform: translateX(200%); }
        }
        @keyframes shimmer-x {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
