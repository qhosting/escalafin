
'use client';

import React, { useState, useEffect } from 'react';
import { NetworkDetector } from '@/lib/pwa-utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const [networkDetector, setNetworkDetector] = useState<NetworkDetector | null>(null);

  useEffect(() => {
    // Initialize NetworkDetector only on client
    if (typeof window !== 'undefined') {
      const detector = new NetworkDetector();
      setNetworkDetector(detector);
      setIsOnline(detector.isNetworkOnline());

      detector.onNetworkChange((online) => {
        setIsOnline(online);
        if (!online) {
          setShowOfflineAlert(true);
        } else {
          // Hide alert after 3 seconds when back online
          setTimeout(() => setShowOfflineAlert(false), 3000);
        }
      });
    }
  }, []);

  const handleRetry = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  if (!showOfflineAlert && isOnline) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Alert className={`transition-all duration-300 ${
        isOnline 
          ? 'bg-green-50 border-green-200 dark:bg-green-900/20' 
          : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20'
      }`}>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-600" />
          ) : (
            <WifiOff className="h-4 w-4 text-yellow-600" />
          )}
          <AlertDescription className="flex-1">
            {isOnline ? (
              <span className="text-green-700 dark:text-green-300">
                Conexión restaurada
              </span>
            ) : (
              <div className="space-y-2">
                <span className="text-yellow-700 dark:text-yellow-300">
                  Sin conexión - Modo offline activo
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRetry}
                  className="h-6 px-2 text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Reintentar
                </Button>
              </div>
            )}
          </AlertDescription>
        </div>
      </Alert>
    </div>
  );
};

export default OfflineIndicator;
