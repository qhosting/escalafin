
function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      style={style}
      className={`rounded-lg bg-white/[0.04] relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent ${className}`}
    />
  );
}

export default function AsesorLoading() {
  return (
    <div className="flex h-screen bg-[#080a0f] overflow-hidden">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-60 border-r border-white/[0.05] p-4 gap-3 shrink-0">
        <Skeleton className="h-10 w-32 mb-4" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" style={{ opacity: 1 - i * 0.1 }} />
        ))}
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div className="h-16 border-b border-white/[0.05] flex items-center px-6 gap-4 shrink-0">
          <Skeleton className="h-7 w-40" />
          <div className="ml-auto">
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 space-y-5 overflow-hidden">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/[0.05] p-5 space-y-3 bg-white/[0.02]">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>

          {/* Client/Loan list */}
          <div className="rounded-2xl border border-white/[0.05] p-5 space-y-3 bg-white/[0.02]">
            <Skeleton className="h-5 w-28 mb-4" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full shrink-0" />
              </div>
            ))}
          </div>
        </div>
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
