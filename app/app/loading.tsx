'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-gray-950 overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      
      <div className="relative flex flex-col items-center gap-12 text-center px-6">
        {/* Animated Logo Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative"
        >
          {/* Outer Ring Animation */}
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.05, 1],
            }}
            transition={{ 
              rotate: { duration: 4, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute -inset-8 border-[1.5px] border-primary/20 rounded-full border-dashed"
          />
          
          <motion.div
            animate={{ 
              rotate: -360,
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-14 border-[1px] border-primary/10 rounded-full"
          />

          {/* Logo with pulse */}
          <motion.div
            animate={{ 
              scale: [1, 1.02, 1],
              opacity: [0.9, 1, 0.9]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="relative bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-2xl shadow-primary/10 border border-gray-100 dark:border-gray-800"
          >
            <Image
              src="/logoescalafin.png"
              alt="EscalaFin Logo"
              width={180}
              height={45}
              className="object-contain"
              priority
            />
          </motion.div>
        </motion.div>

        {/* Loading Message & Progress Bar */}
        <div className="flex flex-col items-center gap-6 max-w-xs w-full">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="space-y-2"
          >
            <h2 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 tracking-tight">
              Iniciando sistema...
            </h2>
            <p className="text-sm text-gray-500 font-medium">
              Cargando tu experiencia financiera
            </p>
          </motion.div>

          {/* Premium Progress Bar */}
          <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden relative">
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-primary to-transparent"
            />
          </div>
        </div>

        {/* Footer info/Tip */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400 mt-8"
        >
          EscalaFin v2.7 • Secure Banking
        </motion.p>
      </div>

      {/* Modern Top Progress (Global) */}
      <div className="fixed top-0 left-0 right-0 h-1 z-[10000]">
        <motion.div 
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
          className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
        />
      </div>
    </div>
  );
}
