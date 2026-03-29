
export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#080a0f]">
      {/* Top progress bar */}
      <div className="fixed top-0 left-0 right-0 h-[2px] z-[10000] overflow-hidden">
        <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 animate-shimmer-x" />
      </div>

      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-700/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Logo + Spinner */}
      <div className="relative flex flex-col items-center gap-6">
        {/* Ring */}
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

      <style jsx>{`
        @keyframes shimmer-x {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-shimmer-x {
          animation: shimmer-x 1.4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
