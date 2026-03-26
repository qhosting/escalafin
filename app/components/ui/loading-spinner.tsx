import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeMap = {
    sm: 'h-10 w-10',
    md: 'h-20 w-20',
    lg: 'h-40 w-40'
  };

  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div className={`relative ${sizeMap[size]} transition-all duration-700`}>
        {/* Glow Halo - High Fidelity Bloom */}
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl opacity-30 animate-pulse" />
        
        {/* Outer orbital path - Subtle and technical */}
        <motion.div
           animate={{ rotate: 360 }}
           transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
           className="absolute inset-0 border-[1px] border-primary/10 rounded-full border-dashed"
        />

        {/* Primary Kinetic Ring - Main visual indicator */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-2"
        >
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="70 200"
              className="text-primary drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.8)]"
            />
          </svg>
        </motion.div>

        {/* Counter-rotating Secondary Ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-6 opacity-40"
        >
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="40 180"
              className="text-blue-400"
            />
          </svg>
        </motion.div>

        {/* Inner Core Pulse - Solid grounding */}
        <motion.div
           animate={{ 
            scale: [0.9, 1.1, 0.9],
            opacity: [0.6, 1, 0.6]
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-[35%] bg-gradient-to-br from-primary via-blue-600 to-indigo-700 rounded-full shadow-inner border border-white/20"
        />

        {/* Floating Particles - Orbital artifacts */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
        >
           <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),1)]" />
        </motion.div>
      </div>
    </div>
  );
}
