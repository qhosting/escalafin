'use client';

function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      style={style}
      className={`rounded-lg bg-white/[0.04] relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent ${className}`}
    />
  );
}

export default function ClienteLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-[#080a0f] overflow-hidden">
      {/* Mobile header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>

      {/* Content */}
      <div className="flex-1 p-5 space-y-5 overflow-hidden max-w-lg mx-auto w-full">
        {/* Welcome bar */}
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>

        {/* Balance card */}
        <div className="rounded-3xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.06] p-6 space-y-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-40" />
          <div className="flex gap-3">
            <Skeleton className="h-8 flex-1 rounded-xl" />
            <Skeleton className="h-8 flex-1 rounded-xl" />
          </div>
        </div>

        {/* Loan cards */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/[0.05] p-5 space-y-3 bg-white/[0.02]">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="h-16 border-t border-white/[0.05] flex items-center justify-around px-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-10 rounded-xl" />
        ))}
      </div>

      <div className="fixed top-0 left-0 right-0 h-[2px] z-[10000] overflow-hidden">
        <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600"
          style={{ animation: 'shimmer-x 1.4s ease-in-out infinite' }} />
      </div>
      <style jsx>{`
        @keyframes shimmer { 100% { transform: translateX(200%); } }
        @keyframes shimmer-x { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
      `}</style>
    </div>
  );
}
