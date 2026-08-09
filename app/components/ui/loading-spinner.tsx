'use client';

import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  if (size === 'xs') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full"
        />
      </div>
    );
  }

  const sizeMap = {
    sm: 'h-8 w-8',
    md: 'h-16 w-16',
    lg: 'h-24 w-24',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`relative ${sizeMap[size]} transition-all duration-700`}>
        {/* Glow Halo - High Fidelity Bloom */}
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl opacity-30 animate-pulse" />

        {/* Primary Kinetic Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-1"
        >
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="65 180"
              className="text-primary"
            />
          </svg>
        </motion.div>

        {/* Counter-rotating Secondary Ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-3 opacity-50"
        >
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="35 150"
              className="text-indigo-400"
            />
          </svg>
        </motion.div>

        {/* Inner Core Pulse */}
        <motion.div
          animate={{
            scale: [0.85, 1.1, 0.85],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-[35%] bg-gradient-to-br from-primary via-blue-600 to-indigo-700 rounded-full shadow-inner border border-white/20"
        />
      </div>
    </div>
  );
}
