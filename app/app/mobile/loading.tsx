'use client';

function Sk({ className }: { className?: string }) {
  return <div className={`bg-white/[0.05] animate-pulse rounded-xl ${className}`} />;
}

export default function MobileLoading() {
  return (
    <div className="flex flex-col h-screen bg-[#080a0f] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-safe pb-3 border-b border-white/[0.05]">
        <Sk className="h-7 w-32" />
        <Sk className="h-8 w-8 rounded-full" />
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4 overflow-hidden">
        {/* Search bar */}
        <Sk className="h-11 w-full rounded-2xl" />
        {/* Cards */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
            <Sk className="h-12 w-12 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Sk className="h-4 w-32" />
              <Sk className="h-3 w-24" />
            </div>
            <Sk className="h-7 w-16 shrink-0" />
          </div>
        ))}
      </div>

      {/* Bottom nav */}
      <div className="h-16 border-t border-white/[0.05] flex items-center justify-around px-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <Sk className="h-6 w-6 rounded-lg" />
            <Sk className="h-2 w-10 rounded" />
          </div>
        ))}
      </div>

      <div className="fixed top-0 left-0 right-0 h-[2px] z-[10000] overflow-hidden">
        <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600"
          style={{ animation: 'shimmer-x 1.4s ease-in-out infinite' }} />
      </div>
      <style jsx>{`
        @keyframes shimmer-x { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
      `}</style>
    </div>
  );
}
