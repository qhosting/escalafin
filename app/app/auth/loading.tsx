
export default function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080a0f]">
      {/* Ambient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-700/8 rounded-full blur-[100px] pointer-events-none" />

      {/* Card skeleton */}
      <div className="w-full max-w-[420px] space-y-6 bg-white/[0.03] border border-white/[0.06] rounded-3xl p-8">
        {/* Logo area */}
        <div className="flex flex-col items-center gap-3">
          <SkPulse className="h-14 w-14 rounded-2xl" />
          <SkPulse className="h-7 w-40 rounded-lg" />
          <SkPulse className="h-4 w-28 rounded-md" />
        </div>
        {/* Tab */}
        <div className="flex gap-2">
          <SkPulse className="flex-1 h-11 rounded-xl" />
          <SkPulse className="flex-1 h-11 rounded-xl" />
        </div>
        {/* Fields */}
        <div className="space-y-4">
          <SkPulse className="h-12 w-full rounded-xl" />
          <SkPulse className="h-12 w-full rounded-xl" />
        </div>
        {/* Button */}
        <SkPulse className="h-13 w-full rounded-xl" style={{ height: '52px' }} />
      </div>

      {/* Top bar */}
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

function SkPulse({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div style={style} className={`bg-white/[0.05] animate-pulse rounded-lg ${className}`} />;
}
