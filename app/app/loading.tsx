'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-gray-950 overflow-hidden">
      {/* Background Ambient Glow - Sophisticated and subtle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[140px] pointer-events-none animate-pulse opacity-50" />
      
      <div className="relative flex flex-col items-center justify-center">
        {/* Orbital Loading Core */}
        <div className="relative h-32 w-32 md:h-48 md:w-48">
          {/* External Orbital Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-[1.5px] border-primary/20 rounded-full border-dashed"
          />
          
          {/* Middle Kinetic Ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-4 border-[2px] border-primary/30 rounded-full border-t-primary"
          />

          {/* Inner Glowing Core */}
          <motion.div
            animate={{ 
              scale: [1, 1.15, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-10 rounded-full bg-gradient-to-br from-primary via-blue-600 to-indigo-700 shadow-[0_0_50px_rgba(var(--primary-rgb),0.5)] flex items-center justify-center overflow-hidden"
          >
             {/* Reflection Layer */}
             <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 -skew-y-12 blur-sm" />
          </motion.div>

          {/* Micro Particles / Orbital Dots */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0"
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary shadow-glow shadow-primary/80" />
          </motion.div>

           <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0"
          >
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-400 shadow-glow shadow-blue-400/80" />
          </motion.div>
        </div>
      </div>

      {/* Extreme Top Progress Line - For consistent browser experience */}
      <div className="fixed top-0 left-0 right-0 h-1 z-[10000]">
        <motion.div 
          initial={{ width: "0%" }}
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 2.5, ease: "easeInOut", repeat: Infinity }}
          className="w-full h-full bg-gradient-to-r from-transparent via-primary to-transparent opacity-60"
        />
      </div>
    </div>
  );
}
