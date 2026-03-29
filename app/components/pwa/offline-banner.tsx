'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, AlertCircle, X } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { motion, AnimatePresence } from 'framer-motion';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const [showProgress, setShowProgress] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setIsVisible(true);
    } else {
      // Si vuelve a estar online, mostramos un mensaje breve de "Reconectado"
      const timer = setTimeout(() => setIsVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!isVisible && isOnline) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className={`${
            isOnline ? 'bg-[var(--primary)]' : 'bg-amber-600'
          } text-white px-4 py-2 flex items-center justify-between text-sm font-medium overflow-hidden shadow-lg z-[60] fixed top-0 left-0 right-0`}
        >
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <AlertCircle className="h-4 w-4 animate-bounce" />
            ) : (
              <WifiOff className="h-4 w-4" />
            )}
            <span>
              {isOnline 
                ? 'Conexión restablecida. Sincronizando datos...' 
                : 'Modo Offline: Trabajando sin conexión. Los cambios se guardarán localmente.'}
            </span>
          </div>
          {!isOnline && (
            <button 
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
